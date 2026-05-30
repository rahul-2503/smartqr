const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');
const { callAI } = require('../utils/aiClient');

const SYSTEM_PROMPT = `You are a pharmaceutical batch quality and compliance assistant for Indian medicine manufacturers.

Analyze the batch registration details and the associated product information. Identify potential issues and generate actionable suggestions.

Return ONLY valid JSON with these fields:
{
  "warnings": "A single string of recommended warnings to print on packaging (based on the medicine type, storage needs, and shelf life)",
  "suggestions": [
    "Array of specific suggestions or best practices for this batch"
  ],
  "complianceFlags": [
    "Array of any compliance concerns or regulatory flags. Empty array if none."
  ],
  "shelfLifeAssessment": "Brief assessment of whether the shelf life (mfg to exp) is appropriate for this type of medicine",
  "riskLevel": "LOW | MEDIUM | HIGH"
}

Rules:
- Flag if shelf life seems too short or too long for the medicine type
- Flag if MRP seems unusually high or low for the medicine category in India
- Suggest standard Indian pharmaceutical compliance warnings
- Check if packaging config (tablets per strip) is standard for the medicine type
- Be specific and actionable — no generic advice
- Reference Indian drug regulations (CDSCO/FSSAI) where relevant`;

app.http('AiBatchAssist', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'ai/batch-assist',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const data = await request.json();
            const { productId, mfgDate, expDate, mrp, tabletsPerStrip, totalStrips } = data;

            if (!productId) {
                return { status: 400, jsonBody: { error: "Product ID is required" } };
            }

            // Fetch the product details from Cosmos DB
            const { medicineProducts } = await getContainers();
            const prodQuery = {
                query: "SELECT * FROM c WHERE c.product_id = @pid AND c.organizationDomain = @org",
                parameters: [
                    { name: "@pid", value: productId },
                    { name: "@org", value: authUser.organizationDomain }
                ]
            };
            const { resources: products } = await medicineProducts.items.query(prodQuery).fetchAll();

            if (products.length === 0) {
                return { status: 404, jsonBody: { error: "Product not found" } };
            }

            const product = products[0];

            const batchContext = `
PRODUCT INFORMATION:
- Medicine Name: ${product.medicine_name}
- Generic Name: ${product.generic_name}
- Type: ${product.type}
- Category: ${product.category}
- Dosage: ${product.dosage}
- Composition: ${product.composition}
- Storage: ${product.storage}
- Prescription Required: ${product.prescription_required ? 'Yes' : 'No'}

BATCH DETAILS:
- Manufacturing Date: ${mfgDate || 'Not specified'}
- Expiry Date: ${expDate || 'Not specified'}
- MRP: ₹${mrp || 'Not specified'}
- Units per strip/pack: ${tabletsPerStrip || 'Not specified'}
- Total strips/packs: ${totalStrips || 'Not specified'}
- Total units: ${(tabletsPerStrip || 0) * (totalStrips || 0)}`;

            context.log(`[AI Batch] Analyzing batch for ${product.medicine_name} by ${authUser.email}`);

            const result = await callAI(
                SYSTEM_PROMPT,
                batchContext,
                { maxTokens: 1200, temperature: 0.4, jsonMode: true }
            );

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (parseErr) {
                context.error('[AI Batch] Failed to parse:', result);
                return { status: 500, jsonBody: { error: "AI returned invalid data" } };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    analysis: parsed
                }
            };
        } catch (err) {
            context.error('AiBatchAssist error:', err);
            return { status: 500, jsonBody: { error: "AI service temporarily unavailable" } };
        }
    }
});
