const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('GetManufacturerProducts', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'getManufacturerProducts',
    handler: async (request, context) => {
        try {
            // Enterprise Authentication — org derived from token, not URL param
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const orgDomain = authUser.organizationDomain;
            const { medicineProducts, smartBatches } = await getContainers();

            // Query Products for this organization
            const productQuery = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org ORDER BY c.registered_at DESC",
                parameters: [{ name: "@org", value: orgDomain }]
            };
            const { resources: products } = await medicineProducts.items.query(productQuery).fetchAll();

            // Query Batches for this organization
            const batchQuery = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org ORDER BY c.registered_at DESC",
                parameters: [{ name: "@org", value: orgDomain }]
            };
            const { resources: batches } = await smartBatches.items.query(batchQuery).fetchAll();

            // Add expiry status to batches
            const today = new Date();
            const processedBatches = batches.map(b => {
                const expDate = new Date(b.exp_date);
                const diffTime = expDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let status = 'SAFE';
                if (diffDays < 0) status = 'EXPIRED';
                else if (diffDays <= 90) status = 'EXPIRING_SOON';
                
                return { ...b, status, days_left: diffDays };
            });

            return {
                status: 200,
                jsonBody: { 
                    products,
                    batches: processedBatches,
                    organization: {
                        domain: orgDomain,
                        name: authUser.organizationName
                    }
                }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
