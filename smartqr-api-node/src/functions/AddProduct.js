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
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const organizationDomain = authUser.organizationDomain;
            const data = await request.json();
            const required = ["barcode", "product_name", "manufacturer", "category"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, jsonBody: { error: `Missing field: ${field}` } };
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
                organizationDomain: organizationDomain,
                organizationName: authUser.organizationName,
                createdByEmail: authUser.email,
                created_at: new Date().toISOString(),
                community_verifications: 0
            };

            await products.items.upsert(item);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: organizationDomain,
                action: "ADD_PRODUCT",
                actor: authUser.email,
                details: `Created product profile for ${data.product_name} (${data.barcode})`,
                entityId: data.barcode,
                entityType: "product",
                timestamp: new Date().toISOString()
            });

            return {
                status: 201,
                jsonBody: { message: "Product profile saved securely!", barcode: data.barcode }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});