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
            let decodedToken;
            try {
                decodedToken = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, body: JSON.stringify({ error: "Unauthorized: " + authErr.message }) };
            }
            
            const organizationId = decodedToken.uid || decodedToken.sub;

            const data = await request.json();
            const required = ["barcode", "batch_id", "mfg_date", "exp_date"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, body: JSON.stringify({ error: `Missing field: ${field}` }) };
                }
            }

            const { batches, auditLogs } = await getContainers();

            // The id needs to be unique. We can use a combination of barcode and batch_id.
            const item = {
                id: `${data.barcode}_${data.batch_id}`,
                barcode: data.barcode,
                batch_id: data.batch_id,
                mfg_date: data.mfg_date,
                exp_date: data.exp_date,
                organizationId: organizationId, // Tenant isolation
                created_at: new Date().toISOString(),
                community_verifications: 0
            };

            await batches.items.upsert(item);

            // Audit Trail
            await auditLogs.items.create({
                id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
                organizationId: organizationId,
                action: "ADD_BATCH",
                details: `Added batch ${data.batch_id} for product ${data.barcode}`,
                timestamp: new Date().toISOString()
            });

            return {
                status: 201,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Batch saved successfully!", batch_id: data.batch_id })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
