import mysql from 'mysql2/promise'
import fs from 'fs'
import Fastify from 'fastify'
import dotenv from 'dotenv'

dotenv.config() // load the vars form the .env file

const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.USE_HTTPS === '1'

const fastify = USE_HTTPS ? Fastify({
    logger: true,
    http2: true,
    https: {
        key: fs.readFileSync(process.env.SSL_PRIVATE_KEY),
        cert: fs.readFileSync(process.env.SSL_CERT)
    }
}): Fastify({
    logger: true
})

const JSON_MIMIE = "application/json"

try{
    let databaseConnection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        rowsAsArray: true
    });


    setInterval( async () => {
        try {
            await databaseConnection.query("SELECT 1;")
        }catch (err) {
            if(err) {
                //reconnect to the database
                await databaseConnection.destroy()
                console.log("Reconnecting to database...")
                databaseConnection = await mysql.createConnection({
                host: process.env.DATABASE_HOST,
                port: process.env.DATABASE_PORT,
                user: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DATABASE_NAME,
                rowsAsArray: true
                })
            }
        }
    }, 30000)

    // main page
    fastify.get('/', async function handler (request, reply) {
        let indexFile = fs.readFileSync('./index.html', 'utf8')
        reply.type('text/html');
        return indexFile
    })

    fastify.get('/message', async function handler (request, reply) {
        let messageId = request.query.messageid
        reply.type(JSON_MIMIE);
        if(!messageId) {
            reply.statusCode = 400;
            return {error: "missing messageid"};
        }
        let messageIdNumber = 0
        try{
            messageIdNumber = Number(messageId)
        }catch(e){
            reply.statusCode = 400;
            return {error: "invalid messageId"};
        }
        if(messageIdNumber !== 0 && !messageIdNumber){
            reply.statusCode = 400;
            return {error: "invalid messageId"};
        }

        const messageResult = await databaseConnection.execute(
            "SELECT message, username, time, image FROM message_messages JOIN message_profiles ON message_messages.profile = message_profiles.id where message_messages.id = ?;",
            [messageIdNumber+1]
        )
        // console.log("getting message: "+messageIdNumber)
        if(!messageResult[0]){
            reply.statusCode = 400;
            return {error: "message not found"};
        }
        // console.log("message result")
        // console.log(messageResult)
        return {
            message: messageResult[0][0][0],
            username: messageResult[0][0][1],
            time: messageResult[0][0][2],
            profile: messageResult[0][0][3],
            id: messageIdNumber
        }
    })

    fastify.get("/total_messages", async function(request,reply){
        reply.type(JSON_MIMIE);

        const [results] = await databaseConnection.execute(
            'SELECT count(id) FROM message_messages'
        );
        //for some reason it returns a 2D array

        return {
            messages: results[0][0] -1
        }
    })

    fastify.post("/postMessage", async function(request,reply){
        let body = request.body;
        reply.type(JSON_MIMIE);
        if(!body){
            reply.statusCode = 400;
            return {error: "no message provided"};
        }

        if(!body.username){
            reply.statusCode = 400;
            return {error: "no username provided"};
        }

        if(!body.message){
            reply.statusCode = 400;
            return {error: "no message provided"};
        }

        if(body.username.length > 64){
            reply.statusCode = 400;
            return {error: "username too long"};
        }

        if(body.message.length > 2048){
            reply.statusCode = 400;
            return {error: "message too long"};
        }

        let username = body.username;
        let message = body.message;
        let timestamp = Date.now();
        let profile = null
        if(body.profile) {
            profile = body.profile;
        }
        //if a profile pic was included then check if it is in the pfp table,
        if(profile){
            const [profileResult] = await databaseConnection.execute(
                "SELECT id FROM message_profiles WHERE image = ?",
                [profile]
            )
            // console.log("initial profile lookup")
            // console.log(profileResult);
            //if so then get the id for that pic, if not then add it to the table and get the new id
            let profileId;
            if(profileResult[0]){
                profileId = profileResult[0][0];
            } else {
                const [newProfileResultSetInfo] = await databaseConnection.execute(
                    "INSERT INTO message_profiles (image) values (?);",
                    [profile]
                )
                // console.log(newProfileResultSetInfo);
                profileId = newProfileResultSetInfo.insertId;
            }
            //add the message to the database with the reference to the profile pic
            const [messageResultSetHeader] = await databaseConnection.execute(
                "INSERT INTO message_messages (message, username, time, profile) values (?,?,?,?)",
                [message, username, timestamp,profileId]
            )
            // console.log("added new message")
            // console.log(messageResultSetHeader);
        } else{
            const [messageResultSetHeader] = await databaseConnection.execute(
                "INSERT INTO message_messages (message, username, time, profile) values (?,?,?,1)",
                [message, username, timestamp]
            )
            // console.log("added new message")
            // console.log(messageResultSetHeader);
        }

        return {}

    })

    // start the web server
    try {
        await fastify.listen({
                port: Number(process.env.SERVICE_PORT),
                host: "0.0.0.0"
            })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }

} catch (e){
    console.error(e)
}