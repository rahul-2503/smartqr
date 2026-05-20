const { app } = require('@azure/functions');
const { getContainers } = require('../db');

app.http('GetProduct', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'GetProduct/{barcode}',
    handler: async (request, context) => {
        try {
            const barcode = request.params.barcode;
            const { products, batches } = await getContainers();

            // 1. Fetch Product Profile
            const { resource: product } = await products.item(barcode, barcode).read();

            if (!product) {
                return { status: 404, body: JSON.stringify({ error: "Product not found" }) };
            }

            // 2. Fetch all batches for this barcode
            const querySpec = {
                query: "SELECT * from c WHERE c.barcode = @barcode",
                parameters: [{ name: "@barcode", value: barcode }]
            };
            const { resources: productBatches } = await batches.items.query(querySpec).fetchAll();

            // 3. Add dynamic days_left and status to batches
            const today = new Date();
            const enrichedBatches = productBatches.map(b => {
                const expDate = new Date(b.exp_date);
                const daysLeft = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                let status;
                if (daysLeft < 0) status = "EXPIRED";
                else if (daysLeft <= 30) status = "EXPIRING_SOON";
                else status = "SAFE";
                return { ...b, days_left: daysLeft, status };
            });

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product: product,
                    batches: enrichedBatches
                })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});