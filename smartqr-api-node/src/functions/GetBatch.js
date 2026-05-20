const { app } = require('@azure/functions');
const { getContainers } = require('../db');

function getStatusFromExpiry(expDateStr) {
    const expDate = new Date(expDateStr);
    const today = new Date();
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 90) return 'EXPIRING_SOON';
    return 'SAFE';
}

app.http('GetBatch', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'getbatch/{batchId}',
    handler: async (request, context) => {
        try {
            const batchId = request.params.batchId;
            if (!batchId) {
                return { status: 400, body: JSON.stringify({ error: "Batch ID is required" }) };
            }

            const { smartBatches, medicineProducts, manufacturers } = await getContainers();

            // Query the batch across partitions (since partitionKey is mfr_id)
            const batchQuery = {
                query: "SELECT * FROM c WHERE c.batch_id = @batchId",
                parameters: [{ name: "@batchId", value: batchId }]
            };
            const { resources: batchResults } = await smartBatches.items.query(batchQuery).fetchAll();
            
            if (batchResults.length === 0) {
                return { status: 404, body: JSON.stringify({ error: "Batch not found" }) };
            }
            
            const batch = batchResults[0];
            batch.status = getStatusFromExpiry(batch.exp_date);

            // Get Product
            let product = null;
            if (batch.product_id && batch.mfr_id) {
                const { resource: p } = await medicineProducts.item(batch.product_id, batch.mfr_id).read();
                product = p;
            }

            // Get Manufacturer
            let manufacturer = null;
            if (batch.mfr_id) {
                const { resource: m } = await manufacturers.item(batch.mfr_id, batch.mfr_id).read();
                manufacturer = m;
            }

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    batch,
                    product: product || {},
                    manufacturer: manufacturer || {}
                })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
