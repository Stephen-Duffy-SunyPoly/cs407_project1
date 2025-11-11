// Import the framework and instantiate it
import Fastify from 'fastify'
const fastify = Fastify({
    logger: true
})

import fs from 'fs'

// Declare a route
fastify.get('/', async function handler (request, reply) {
    let indexFile = fs.readFileSync('./index.html', 'utf8')
    reply.type('text/html');
    return indexFile
})

fastify.get('/now', async function (request, reply) {
    reply.type('application/json');
    return {now: Date.now()};
})

// Run the server!
try {
    await fastify.listen({ port: 3000 })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}