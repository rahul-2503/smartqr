const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('DeleteBatch', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'DeleteBatch/{barcode}/{batch_id}',
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

            const barcode = request.params.barcode;
            const batch_id = request.params.batch_id;
            const { batches, auditLogs } = await getContainers();

            const id = `${barcode}_${batch_id}`;
            
            // Read first to enforce tenant isolation
            const existingBatch = await batches.item(id, barcode).read();
            if (!existingBatch.resource) {
                return { status: 404, body: JSON.stringify({ error: "Batch not found" }) };
            }

            if (existingBatch.resource.organizationId && existingBatch.resource.organizationId !== organizationId) {
                return { status: 403, body: JSON.stringify({ error: "Forbidden: You do not own this batch" }) };
            }

            await batches.item(id, barcode).delete();

            // Audit Trail
            await auditLogs.items.create({
                id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
                organizationId: organizationId,
                action: "DELETE_BATCH",
                details: `Deleted batch ${batch_id} for product ${barcode}`,
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Batch deleted securely!", batch_id: batch_id })
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
