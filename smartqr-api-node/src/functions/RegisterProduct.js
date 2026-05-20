const { app } = require('@azure/functions');
const { getContainers } = require('../db');

app.http('RegisterProduct', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerProduct',
    handler: async (request, context) => {
        try {
            const data = await request.json();
            const required = ["mfrId", "medicineName", "genericName", "dosage", "type", "category", "composition", "storage", "dosageInstructions"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, body: JSON.stringify({ error: `Missing field: ${field}` }) };
                }
            }

            const { medicineProducts } = await getContainers();

            const productId = `PRD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const item = {
                id: productId,
                product_id: productId,
                mfr_id: data.mfrId,
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

            return {
                status: 201,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Product registered successfully!", productId })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
