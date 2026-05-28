const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('RegisterBatch', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerBatch',
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

            if (!authUser.isBusinessEmail) {
                return { status: 403, jsonBody: { error: "Business email required." } };
            }

            const data = await request.json();
            const required = ["productId", "batchNo", "mfgDate", "expDate", "tabletsPerStrip", "totalStrips", "mrp"];

            for (const field of required) {
                if (data[field] === undefined || data[field] === null || data[field] === "") {
                    return { status: 400, jsonBody: { error: `Missing field: ${field}` } };
                }
            }

            const { smartBatches, medicineProducts, auditLogs } = await getContainers();

            // Verify product belongs to the same organization
            const prodQuery = {
                query: "SELECT * FROM c WHERE c.product_id = @pid AND c.organizationDomain = @org",
                parameters: [
                    { name: "@pid", value: data.productId },
                    { name: "@org", value: authUser.organizationDomain }
                ]
            };
            const { resources: prodResults } = await medicineProducts.items.query(prodQuery).fetchAll();
            
            if (prodResults.length === 0) {
                return { status: 404, jsonBody: { error: "Product not found or does not belong to your organization" } };
            }

            const product = prodResults[0];
            const totalTablets = parseInt(data.tabletsPerStrip) * parseInt(data.totalStrips);
            const batchId = data.batchNo;

            const item = {
                id: `${authUser.organizationDomain}_${batchId}`,
                batch_id: batchId,
                organizationDomain: authUser.organizationDomain,
                organizationName: authUser.organizationName,
                product_id: data.productId,
                product_name: product.medicine_name,
                mfg_date: data.mfgDate,
                exp_date: data.expDate,
                tablets_per_strip: parseInt(data.tabletsPerStrip),
                total_strips: parseInt(data.totalStrips),
                total_tablets: totalTablets,
                mrp: parseFloat(data.mrp),
                warnings: data.warnings || "",
                createdByUid: authUser.uid,
                createdByEmail: authUser.email,
                registered_at: new Date().toISOString()
            };

            await smartBatches.items.upsert(item);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "REGISTER_BATCH",
                actor: authUser.email,
                details: `Registered batch ${batchId} for ${product.medicine_name} (${totalTablets} QR codes)`,
                entityId: batchId,
                entityType: "batch",
                timestamp: new Date().toISOString()
            });

            return {
                status: 201,
                jsonBody: { 
                    message: "Batch registered successfully!", 
                    batchId: batchId,
                    totalQrCodes: totalTablets,
                    batch: item
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
