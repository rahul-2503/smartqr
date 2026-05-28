const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('AddBatch', {
    methods: ['POST'],
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
            const data = await request.json();
            const required = ["barcode", "batch_id", "mfg_date", "exp_date"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, jsonBody: { error: `Missing field: ${field}` } };
                }
            }

            const { batches, auditLogs } = await getContainers();

            const item = {
                id: `${data.barcode}_${data.batch_id}`,
                barcode: data.barcode,
                batch_id: data.batch_id,
                mfg_date: data.mfg_date,
                exp_date: data.exp_date,
                organizationDomain: organizationDomain,
                organizationName: authUser.organizationName,
                createdByEmail: authUser.email,
                created_at: new Date().toISOString(),
                community_verifications: 0
            };

            await batches.items.upsert(item);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: organizationDomain,
                action: "ADD_BATCH",
                actor: authUser.email,
                details: `Added batch ${data.batch_id} for product ${data.barcode}`,
                entityId: data.batch_id,
                entityType: "batch",
                timestamp: new Date().toISOString()
            });

            return {
                status: 201,
                jsonBody: { message: "Batch saved successfully!", batch_id: data.batch_id }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
