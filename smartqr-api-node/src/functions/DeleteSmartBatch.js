const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('DeleteSmartBatch', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'deleteSmartBatch/{batchId}',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const batchId = request.params.batchId;
            const { smartBatches, auditLogs } = await getContainers();

            // Find existing batch owned by this org
            const querySpec = {
                query: "SELECT * FROM c WHERE c.batch_id = @bid AND c.organizationDomain = @org",
                parameters: [
                    { name: "@bid", value: batchId },
                    { name: "@org", value: authUser.organizationDomain }
                ]
            };
            const { resources } = await smartBatches.items.query(querySpec).fetchAll();

            if (resources.length === 0) {
                return { status: 404, jsonBody: { error: "Batch not found or access denied" } };
            }

            const batch = resources[0];
            await smartBatches.item(batch.id, authUser.organizationDomain).delete();

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "DELETE_BATCH",
                actor: authUser.email,
                details: `Deleted batch ${batchId} (${batch.product_name || 'unknown product'})`,
                entityId: batchId,
                entityType: "batch",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { message: "Batch deleted successfully!", batchId }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
