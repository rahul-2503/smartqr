const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('DeleteMedicineProduct', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'deleteProduct/{productId}',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const productId = request.params.productId;
            const { medicineProducts, smartBatches, auditLogs } = await getContainers();

            // Find and verify ownership
            const querySpec = {
                query: "SELECT * FROM c WHERE c.product_id = @pid AND c.organizationDomain = @org",
                parameters: [
                    { name: "@pid", value: productId },
                    { name: "@org", value: authUser.organizationDomain }
                ]
            };
            const { resources } = await medicineProducts.items.query(querySpec).fetchAll();

            if (resources.length === 0) {
                return { status: 404, jsonBody: { error: "Product not found or access denied" } };
            }

            const product = resources[0];

            // Check if any batches reference this product
            const batchQuery = {
                query: "SELECT VALUE COUNT(1) FROM c WHERE c.product_id = @pid AND c.organizationDomain = @org",
                parameters: [
                    { name: "@pid", value: productId },
                    { name: "@org", value: authUser.organizationDomain }
                ]
            };
            const { resources: countResult } = await smartBatches.items.query(batchQuery).fetchAll();
            const batchCount = countResult[0] || 0;

            if (batchCount > 0) {
                return { status: 409, jsonBody: { error: `Cannot delete: ${batchCount} batch(es) are linked to this product. Delete those batches first.` } };
            }

            await medicineProducts.item(product.id, authUser.organizationDomain).delete();

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "DELETE_PRODUCT",
                actor: authUser.email,
                details: `Deleted product: ${product.medicine_name} (${product.dosage})`,
                entityId: productId,
                entityType: "product",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { message: "Product deleted successfully!", productId }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
