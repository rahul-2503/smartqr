const { app } = require('@azure/functions');
const { getContainers } = require('../db');

app.http('RegisterBatch', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerBatch',
    handler: async (request, context) => {
        try {
            const data = await request.json();
            const required = ["mfrId", "productId", "batchNo", "mfgDate", "expDate", "tabletsPerStrip", "totalStrips", "mrp"];

            for (const field of required) {
                if (data[field] === undefined || data[field] === null || data[field] === "") {
                    return { status: 400, body: JSON.stringify({ error: `Missing field: ${field}` }) };
                }
            }

            const { smartBatches, medicineProducts } = await getContainers();

            // Verify product belongs to manufacturer
            const { resource: product } = await medicineProducts.item(data.productId, data.mfrId).read();
            if (!product) {
                return { status: 404, body: JSON.stringify({ error: "Product not found or does not belong to this manufacturer" }) };
            }

            const totalTablets = parseInt(data.tabletsPerStrip) * parseInt(data.totalStrips);

            const item = {
                id: data.batchNo, // Using batchNo as ID since it should be unique
                batch_id: data.batchNo,
                mfr_id: data.mfrId,
                product_id: data.productId,
                mfg_date: data.mfgDate,
                exp_date: data.expDate,
                tablets_per_strip: parseInt(data.tabletsPerStrip),
                total_strips: parseInt(data.totalStrips),
                total_tablets: totalTablets,
                mrp: parseFloat(data.mrp),
                warnings: data.warnings || "",
                registered_at: new Date().toISOString()
            };

            await smartBatches.items.upsert(item);

            return {
                status: 201,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    message: "Batch registered successfully!", 
                    batchId: data.batchNo,
                    totalQrCodes: totalTablets,
                    batch: item
                })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
