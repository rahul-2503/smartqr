const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('RegisterProduct', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerProduct',
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
            const required = ["medicineName", "genericName", "dosage", "type", "category", "composition", "storage", "dosageInstructions"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, jsonBody: { error: `Missing field: ${field}` } };
                }
            }

            const { medicineProducts, auditLogs } = await getContainers();

            const productId = `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            const item = {
                id: productId,
                product_id: productId,
                organizationDomain: authUser.organizationDomain,
                organizationName: authUser.organizationName,
                createdByUid: authUser.uid,
                createdByEmail: authUser.email,
                medicine_name: data.medicineName,
                generic_name: data.genericName,
                dosage: data.dosage,
                type: data.type,
                category: data.category,
                composition: data.composition,
                storage: data.storage,
                dosage_instructions: data.dosageInstructions,
                side_effects: data.sideEffects || "",
                contraindications: data.contraindications || "",
                prescription_required: data.prescriptionRequired || false,
                registered_at: new Date().toISOString()
            };

            await medicineProducts.items.upsert(item);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "REGISTER_PRODUCT",
                actor: authUser.email,
                details: `Registered product: ${data.medicineName} (${data.dosage})`,
                entityId: productId,
                entityType: "product",
                timestamp: new Date().toISOString()
            });

            return {
                status: 201,
                jsonBody: { message: "Product registered successfully!", productId }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
