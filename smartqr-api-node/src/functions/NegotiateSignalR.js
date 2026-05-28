const { app } = require('@azure/functions');
const { generateSignalRConnectionInfo } = require('../utils/signalr');

app.http('NegotiateSignalR', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'negotiate',
    handler: async (request, context) => {
        try {
            const signalRConnString = process.env.AzureSignalRConnectionString;
            if (!signalRConnString) {
                return { 
                    status: 503, 
                    jsonBody: { error: "SignalR service connection not configured on server. Falling back to polling." } 
                };
            }

            const connectionInfo = generateSignalRConnectionInfo(signalRConnString, 'dashboard');
            if (!connectionInfo) {
                return { status: 500, jsonBody: { error: "Failed to generate connection info." } };
            }

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                jsonBody: connectionInfo
            };
        } catch (err) {
            context.error('NegotiateSignalR error:', err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
