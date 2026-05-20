const { app } = require('@azure/functions');
const { getContainers } = require('../db');

app.http('GetManufacturerProducts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'getmanufacturerproducts/{mfrId}',
    handler: async (request, context) => {
        try {
            const mfrId = request.params.mfrId;
            if (!mfrId) {
                return { status: 400, body: JSON.stringify({ error: "Manufacturer ID is required" }) };
            }

            const { medicineProducts, smartBatches } = await getContainers();

            // Query Products
            const productQuery = {
                query: "SELECT * FROM c WHERE c.mfr_id = @mfrId",
                parameters: [{ name: "@mfrId", value: mfrId }]
            };
            const { resources: products } = await medicineProducts.items.query(productQuery).fetchAll();

            // Query Batches
            const batchQuery = {
                query: "SELECT * FROM c WHERE c.mfr_id = @mfrId",
                parameters: [{ name: "@mfrId", value: mfrId }]
            };
            const { resources: batches } = await smartBatches.items.query(batchQuery).fetchAll();

            // Add status to batches
            const today = new Date();
            const processedBatches = batches.map(b => {
                const expDate = new Date(b.exp_date);
                const diffTime = expDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let status = 'SAFE';
                if (diffDays < 0) status = 'EXPIRED';
                else if (diffDays <= 90) status = 'EXPIRING_SOON';
                
                return { ...b, status };
            });

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    products,
                    batches: processedBatches
                })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
