// index.js (UPDATED FOR APOLLO SERVER 4)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
require('dotenv').config();

async function startServer() {
    // --- 1. Initialize Express App ---
    const app = express();
    const PORT = process.env.PORT || 4000; // Use 4000 for local dev
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    // --- 2. Define GraphQL Schema and Resolvers ---
    const typeDefs = `
      type Query {
        hello: String
      }
    `;
    const resolvers = {
        Query: {
            hello: () => 'Hello! Your GraphQL server is running with Apollo v4!',
        },
    };

    // --- 3. Setup Apollo Server (New v4 method) ---
    // Note: The 'gql' tag is no longer needed to be imported.
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    // You must start the server before applying the middleware
    await server.start();

    // --- 4. Define All Express Routes and Middleware ---

    // Root route for a health check
    app.get('/', (req, res) => {
        res.send('✅ WhatsApp GraphQL Webhook is alive!');
    });

    // Webhook Verification Endpoint (GET) - NO CHANGES NEEDED HERE
    app.get('/webhook', (req, res) => {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            } else {
                res.sendStatus(403);
            }
        } else {
            res.sendStatus(404);
        }
    });

    // Webhook Event Handler (POST) - IMPORTANT: Add bodyParser before this route
    app.post('/webhook', bodyParser.json(), (req, res) => {
        const body = req.body;
        console.log('Incoming webhook message:', JSON.stringify(body, null, 2));

        if (body.object === 'whatsapp_business_account') {
            const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            if (message && message.text) {
                console.log(`Message from ${message.from}: ${message.text.body}`);
            }
        }
        res.sendStatus(200);
    });
    
    // Apply Apollo's Express middleware
    // This should be one of the LAST middleware to be applied.
    app.use('/graphql', cors(), bodyParser.json(), expressMiddleware(server));


    // --- 5. Start the HTTP Server ---
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
        console.log(`GraphQL available at http://localhost:${PORT}/graphql`);
    });
}

startServer();