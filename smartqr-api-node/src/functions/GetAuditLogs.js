const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('GetAuditLogs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            // Enterprise Authentication
            const authHeader = request.headers.get('authorization');
            let decodedToken;
            try {
                decodedToken = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, body: JSON.stringify({ error: "Unauthorized: " + authErr.message }) };
            }
            
            const organizationId = decodedToken.uid || decodedToken.sub;

            const { auditLogs } = await getContainers();

            // Fetch logs for this organization, sorted by timestamp descending
            const querySpec = {
                query: "SELECT * FROM c WHERE c.organizationId = @orgId ORDER BY c.timestamp DESC OFFSET 0 LIMIT 50",
                parameters: [{ name: "@orgId", value: organizationId }]
            };

            const { resources } = await auditLogs.items.query(querySpec).fetchAll();

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logs: resources })
            };
        } catch (err) {
            context.error(err);
            return {
                status: 500,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Internal server error" })
            };
        }
    }
});
