import mysql from 'mysql2/promise'
import fs from 'fs'
import Fastify from 'fastify'
import dotenv from 'dotenv'
dotenv.config() // load the vars form the .env file
const fastify = Fastify({
    logger: true
})

const JSON_MIMIE = "application/json"

try{
    const databaseConnection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        rowsAsArray: true
    });


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
        //TODO query database for the message

        //tmp message object response
        let messageObject = {
            username: "USERNAME HERE",
            profile: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IB2cksfwAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+kLCxQmKccNRh4AAAJtSURBVHja7Vq5SgRBEH2z67FeCCIIIniBGJiIrn6BgoGRgWAi5uIfCILiZxj4ARoJKmIsiBoZqCiK15rJBp67tEkPyLD2zlE13eP0gwIx6Hqvqrqmq1jAwsLCwsKCG00AtgEIn7YFoDHpopcCCK5mi1wkHYYzSwCyTHzLAGooD8wQnnUos5VlrKqs9HFgUqmPEZZ6UBvRfQW+qUsyJIe6uK/ApsxAjQEVWCu5bMTl8EljyVezB27xeYPFk/WFv9CZAPGudXA0QZGwh5hDGYCkifetz89XoJjg5/hr1AB0AWhJcABaZe8KDermtOPD5y6D31B35B1ATuPgRdl33uRIHugKUIk/CvnkdgCcEHEIvFu4Iyq9CwLy10RcboOUpdBU9oibT6UrMGTgroFqxzDoJ0OmZZ+VVwY8mGA4czqup6IwMPts3LgqIDHwBqA5BZobVAFYSEEAFlQBmExBAJQan7mHD4ImSLo39FZAGxHRMwbx50TntKs+V0XC+d/Uh1BR7gkqVsCVgYSpz7pUXYF94qytEJyxTsxJqXGUYRszE4HsLAOf4Tg6rdeOQog/ZuICHQFwLe/D/zgzB60BcO0UwJRcu+Xk32cx+Y5tH2Aqqk6DhX8s/tHvY0WkIfsm7AM+pBmzD3DRy+BrV2bgtzVI8/5/j8F/t47JSwDoj0B6IM7Pnxd9ER3OEWZvPiKXnrATm6BqNpqHIicKUWGIeBY+fr4CqwaJD+pjmcrpmsY1WNgmvUzt8EXhrFZDAOoVfJ65nJah4ceJChQq8ClxNyyh4d6z8clEbEI3Brzv73Ul48ugIecTFhYWFhYWgfEDhCqGPpbzQpsAAAAASUVORK5CYII=",
            message: "sample message text. how sample do you message for your text "+messageIdNumber,
            id: messageIdNumber,
            time: Date.now()
        }

        return messageObject
    })

    fastify.get("/total_messages", async function(request,reply){
        reply.type(JSON_MIMIE);

        const [results] = await databaseConnection.execute(
            'SELECT count(id) FROM message_messages'
        );
        //for some reason it returns a 2D array

        return {
            messages: results[0][0]
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
            console.log("initial profile lookup")
            console.log(profileResult);
            //if so then get the id for that pic, if not then add it to the table and get the new id
            let profileId = 0;
            if(profileResult[0]){
                profileId = profileResult[0][0];
            } else {
                const [newProfileResultSetInfo] = await databaseConnection.execute(
                    "INSERT INTO message_profiles (image) values (?);",
                    [profile]
                )
                console.log(newProfileResultSetInfo);
                profileId = newProfileResultSetInfo.insertId;
            }
            //add the message to the database with the reference to the profile pic
            const [messageResultSetHeader] = await databaseConnection.execute(
                "INSERT INTO message_messages (message, username, time, profile) values (?,?,?,?)",
                [message, username, timestamp,profileId]
            )
            console.log("added new message")
            console.log(messageResultSetHeader);
        } else{
            const [messageResultSetHeader] = await databaseConnection.execute(
                "INSERT INTO message_messages (message, username, time, profile) values (?,?,?,1)",
                [message, username, timestamp]
            )
            console.log("added new message")
            console.log(messageResultSetHeader);
        }

        return {}

    })

    // start the web server
    try {
        await fastify.listen({
                port: 3000,
                host: "0.0.0.0"
            })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }

} catch (e){
    console.error(e)
}