const { app } = require('@azure/functions');
const { verifyToken } = require('../utils/auth');
const { callAI } = require('../utils/aiClient');

const SYSTEM_PROMPT = `You are a pharmaceutical product database assistant for Indian medicine manufacturers.

When given a medicine name, return ACCURATE pharmaceutical data in JSON format. Use your knowledge of real medicines, their compositions, and medical guidelines.

Return ONLY valid JSON with these exact fields:
{
  "genericName": "The generic/chemical name (e.g., Acetaminophen for Paracetamol)",
  "dosage": "Standard dosage strength (e.g., 500mg)",
  "type": "One of: Tablet, Capsule, Syrup, Injection, Cream, Drops",
  "category": "One of: Painkiller/Antipyretic, Antibiotic, Antacid, Vitamin/Supplement, Antihistamine, Cardiovascular, Dermatological, Other",
  "composition": "Active ingredients with percentages/amounts",
  "storage": "Standard storage conditions",
  "dosageInstructions": "Standard dosage instructions for adults",
  "sideEffects": "Common side effects (comma-separated)",
  "contraindications": "Key contraindications (comma-separated)",
  "prescriptionRequired": true or false
}

Rules:
- Be medically accurate. Use real pharmaceutical data.
- If the medicine name includes a dosage (e.g., "Paracetamol 500mg"), use that exact dosage.
- If the medicine is not recognized, make reasonable inferences from the name but set a flag.
- Storage conditions should follow Indian pharmaceutical standards.
- Always include at least 3 side effects and 2 contraindications.`;

app.http('AiAssist', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'ai/autofill-product',
    handler: async (request, context) => {
        try {
            // Authenticate
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const data = await request.json();
            const { medicineName } = data;

            if (!medicineName || medicineName.trim().length < 2) {
                return { status: 400, jsonBody: { error: "Medicine name is required (min 2 characters)" } };
            }

            context.log(`[AI Autofill] User ${authUser.email} requesting autofill for: ${medicineName}`);

            const result = await callAI(
                SYSTEM_PROMPT,
                `Fill in pharmaceutical data for: "${medicineName.trim()}"`,
                { maxTokens: 1000, temperature: 0.3, jsonMode: true }
            );

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (parseErr) {
                context.error('[AI Autofill] Failed to parse AI response:', result);
                return { status: 500, jsonBody: { error: "AI returned invalid data. Please try again." } };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    autofill: parsed,
                    source: 'azure-openai'
                }
            };
        } catch (err) {
            context.error('AiAssist error:', err);
            return { status: 500, jsonBody: { error: "AI service temporarily unavailable. " + err.message } };
        }
    }
});
