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
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const organizationDomain = authUser.organizationDomain;
            const { auditLogs } = await getContainers();

            // Fetch logs for this organization, sorted by timestamp descending
            const querySpec = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org ORDER BY c.timestamp DESC OFFSET 0 LIMIT 50",
                parameters: [{ name: "@org", value: organizationDomain }]
            };

            const { resources } = await auditLogs.items.query(querySpec).fetchAll();

            return {
                status: 200,
                jsonBody: { logs: resources }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
