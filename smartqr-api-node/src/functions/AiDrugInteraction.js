const { app } = require('@azure/functions');
const { callAI } = require('../utils/aiClient');

const SYSTEM_PROMPT = `You are a clinical pharmacology AI assistant specializing in drug interactions. You help consumers understand potential interactions between medicines they are taking.

When given two or more medicine names, analyze:
1. Known drug-drug interactions
2. Severity of the interaction
3. Mechanism of the interaction
4. Recommended actions

Return ONLY valid JSON with this structure:
{
  "hasInteraction": true or false,
  "interactions": [
    {
      "drugs": ["Drug A", "Drug B"],
      "severity": "SEVERE | MODERATE | MILD | NONE",
      "type": "The type of interaction (e.g., increased bleeding risk, reduced efficacy)",
      "mechanism": "Brief explanation of WHY they interact",
      "effects": "What could happen to the patient",
      "recommendation": "What the patient should do"
    }
  ],
  "generalAdvice": "Overall safety guidance for this combination",
  "disclaimer": "Always include: This is AI-generated guidance. Always consult your doctor or pharmacist before combining medications."
}

Rules:
- Be medically accurate. Use established pharmacological knowledge.
- Always err on the side of caution for patient safety.
- For SEVERE interactions, be very clear about the danger.
- Include the disclaimer in every response.
- If no interaction is known, say so clearly but still recommend consulting a doctor.
- Support both brand names (Indian/global) and generic names.
- Handle up to 5 medicines at once.`;

app.http('AiDrugInteraction', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'ai/drug-interaction',
    handler: async (request, context) => {
        try {
            // This is a CONSUMER-FACING endpoint — no auth required
            const data = await request.json();
            const { medicines } = data;

            if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
                return { status: 400, jsonBody: { error: "At least 2 medicine names are required" } };
            }

            if (medicines.length > 5) {
                return { status: 400, jsonBody: { error: "Maximum 5 medicines can be checked at once" } };
            }

            // Clean and validate input
            const cleanNames = medicines
                .map(m => m?.trim())
                .filter(m => m && m.length >= 2);

            if (cleanNames.length < 2) {
                return { status: 400, jsonBody: { error: "At least 2 valid medicine names are required" } };
            }

            context.log(`[AI Drug Interaction] Checking: ${cleanNames.join(' + ')}`);

            const userMessage = `Check drug interactions between these medicines: ${cleanNames.join(', ')}`;

            const result = await callAI(
                SYSTEM_PROMPT,
                userMessage,
                { maxTokens: 1500, temperature: 0.2, jsonMode: true }
            );

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (parseErr) {
                context.error('[AI Drug Interaction] Failed to parse:', result);
                return { status: 500, jsonBody: { error: "AI returned invalid data. Please try again." } };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    result: parsed,
                    checkedMedicines: cleanNames,
                    source: 'azure-openai'
                }
            };
        } catch (err) {
            context.error('AiDrugInteraction error:', err);
            return { status: 500, jsonBody: { error: "Drug interaction check temporarily unavailable" } };
        }
    }
});
