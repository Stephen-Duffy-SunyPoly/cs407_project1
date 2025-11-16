// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify({
    logger: true
})

import fs from 'fs'

const JSON_MIMIE = "application/json"

// Declare a route
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
        id: messageIdNumber
    }

    return messageObject
})

fastify.get("/total_messages", async function(request,reply){
    reply.type(JSON_MIMIE);
    return {
        messages: 256
    }
})

// Run the server!
try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}