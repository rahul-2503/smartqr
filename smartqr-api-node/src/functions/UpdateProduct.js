const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('UpdateProduct', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'updateProduct/{productId}',
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
            const data = await request.json();
            const { medicineProducts, auditLogs } = await getContainers();

            // Read existing product and verify org ownership
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

            const existing = resources[0];

            // Patch allowed fields
            const updated = {
                ...existing,
                medicine_name: data.medicineName ?? existing.medicine_name,
                generic_name: data.genericName ?? existing.generic_name,
                dosage: data.dosage ?? existing.dosage,
                type: data.type ?? existing.type,
                category: data.category ?? existing.category,
                composition: data.composition ?? existing.composition,
                storage: data.storage ?? existing.storage,
                dosage_instructions: data.dosageInstructions ?? existing.dosage_instructions,
                side_effects: data.sideEffects ?? existing.side_effects,
                contraindications: data.contraindications ?? existing.contraindications,
                prescription_required: data.prescriptionRequired ?? existing.prescription_required,
                updated_at: new Date().toISOString(),
                updatedByEmail: authUser.email
            };

            await medicineProducts.items.upsert(updated);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "UPDATE_PRODUCT",
                actor: authUser.email,
                details: `Updated product: ${updated.medicine_name} (${updated.dosage})`,
                entityId: productId,
                entityType: "product",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { message: "Product updated successfully!", product: updated }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
