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
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const organizationDomain = authUser.organizationDomain;
            const barcode = request.params.barcode;
            const batch_id = request.params.batch_id;
            const { batches, auditLogs } = await getContainers();

            const id = `${barcode}_${batch_id}`;
            
            // Read first to enforce organization-level tenant isolation
            const existingBatch = await batches.item(id, barcode).read();
            if (!existingBatch.resource) {
                return { status: 404, jsonBody: { error: "Batch not found" } };
            }

            if (existingBatch.resource.organizationDomain && existingBatch.resource.organizationDomain !== organizationDomain) {
                return { status: 403, jsonBody: { error: "Forbidden: This batch belongs to a different organization" } };
            }

            await batches.item(id, barcode).delete();

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: organizationDomain,
                action: "DELETE_BATCH",
                actor: authUser.email,
                details: `Deleted batch ${batch_id} for product ${barcode}`,
                entityId: batch_id,
                entityType: "batch",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { message: "Batch deleted securely!", batch_id: batch_id }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
