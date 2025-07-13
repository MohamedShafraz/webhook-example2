// index.js (with the new root route)
const express = require('express');
const bodyParser = require('body-parser');
const { ApolloServer, gql } = require('apollo-server-express');
require('dotenv').config();

// --- 1. Initialize Express App ---
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// --- 2. Define GraphQL Schema and Resolvers ---
const typeDefs = gql`
  type Query {
    hello: String
  }
`;
const resolvers = {
  Query: {
    hello: () => 'Hello! Your GraphQL server is running!',
  },
};

// --- 3. Setup Apollo Server ---
async function startApolloServer() {
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });
}
startApolloServer();

// --- NEW: Add a root route for a friendly welcome message ---
app.get('/', (req, res) => {
    res.send('✅ WhatsApp GraphQL Webhook is alive! Use the /webhook endpoint for Meta integrations.');
});

// --- 4. Webhook Verification Endpoint (GET) ---
// This endpoint is used by Meta to verify your webhook URL.
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

// --- 5. Webhook Event Handler (POST) ---
// This endpoint receives notifications from Meta.
app.post('/webhook', (req, res) => {
    const body = req.body;
    console.log('Incoming webhook message:', JSON.stringify(body, null, 2));

    if (body.object === 'whatsapp_business_account') {
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (message) {
            console.log(`Message from ${message.from}: ${message.text.body}`);
        }
    }
    res.sendStatus(200);
});

// --- 6. Start the Server ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`GraphQL available at http://localhost:${PORT}/graphql`);
});
