const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('AddProduct', {
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
            
            const organizationId = decodedToken.uid || decodedToken.sub; // Firebase Identity ID

            const data = await request.json();
            const required = ["barcode", "product_name", "manufacturer", "category"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, body: JSON.stringify({ error: `Missing field: ${field}` }) };
                }
            }

            const { products, auditLogs } = await getContainers();

            const item = {
                id: data.barcode,
                barcode: data.barcode,
                product_name: data.product_name,
                manufacturer: data.manufacturer,
                category: data.category,
                instructions: data.instructions || "",
                warnings: data.warnings || "",
                organizationId: organizationId, // Tenant isolation
                created_at: new Date().toISOString(),
                community_verifications: 0
            };

            await products.items.upsert(item);

            // Audit Trail
            await auditLogs.items.create({
                id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
                organizationId: organizationId,
                action: "ADD_PRODUCT",
                details: `Created product profile for ${data.product_name} (${data.barcode})`,
                timestamp: new Date().toISOString()
            });

            return {
                status: 201,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Product profile saved securely!", barcode: data.barcode })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});