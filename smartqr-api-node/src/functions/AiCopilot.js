const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');
const { callAIChat } = require('../utils/aiClient');

app.http('AiCopilot', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'ai/copilot',
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
            const { messages } = data;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return { status: 400, jsonBody: { error: "Messages array is required" } };
            }

            const orgDomain = authUser.organizationDomain;
            const { medicineProducts, smartBatches, scans } = await getContainers();

            // Fetch org context for the AI
            const orgFilter = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                parameters: [{ name: "@org", value: orgDomain }]
            };

            const [productsRes, batchesRes, scansRes] = await Promise.all([
                medicineProducts.items.query(orgFilter).fetchAll(),
                smartBatches.items.query(orgFilter).fetchAll(),
                scans.items.query({
                    query: "SELECT TOP 50 * FROM c WHERE c.organizationDomain = @org ORDER BY c.timestamp DESC",
                    parameters: [{ name: "@org", value: orgDomain }]
                }).fetchAll()
            ]);

            const products = productsRes.resources;
            const batches = batchesRes.resources;
            const recentScans = scansRes.resources;

            const today = new Date();

            // Build context
            const batchSummary = batches.map(b => {
                const daysToExp = Math.ceil((new Date(b.exp_date) - today) / (1000 * 60 * 60 * 24));
                return `${b.batch_id}: ${b.product_name} | Exp: ${b.exp_date} (${daysToExp}d) | ${b.total_tablets} units | ₹${b.mrp}`;
            }).join('\n');

            const productSummary = products.map(p =>
                `${p.product_id}: ${p.medicine_name} (${p.generic_name}) | ${p.dosage} ${p.type} | ${p.category} | Rx: ${p.prescription_required ? 'Yes' : 'No'}`
            ).join('\n');

            const scanSummary = `Total recent scans: ${recentScans.length}. ` +
                `Cities: ${[...new Set(recentScans.map(s => s.city).filter(Boolean))].join(', ')}`;

            const systemPrompt = `You are SmartQR Copilot, an enterprise AI assistant for ${authUser.organizationName} — a pharmaceutical manufacturer using the SmartQR platform.

You have access to the organization's real-time data. Answer questions using ONLY this data — don't make up information.

ORGANIZATION DATA (as of ${today.toISOString().split('T')[0]}):

PRODUCTS (${products.length}):
${productSummary || 'No products registered yet.'}

BATCHES (${batches.length}):
${batchSummary || 'No batches registered yet.'}

SCAN ACTIVITY:
${scanSummary}

GUIDELINES:
- Answer in a concise, professional tone.
- When asked about batches, expiry, or inventory, use the EXACT data above.
- When asked about scans, use the scan data.
- If asked something not in the data, say "I don't have that information in your current SmartQR data."
- Format numbers nicely (e.g., 1,000 not 1000).
- Use markdown for formatting (bold, lists) when helpful.
- If a question is about drug interactions or medical advice, recommend they use the Drug Interaction Checker feature.
- Keep responses under 200 words unless the user asks for detail.`;

            // Build the full message array
            const fullMessages = [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-10) // Keep last 10 messages for context
            ];

            context.log(`[AI Copilot] Query from ${authUser.email}: ${messages[messages.length - 1]?.content?.substring(0, 100)}`);

            const response = await callAIChat(fullMessages, {
                maxTokens: 800,
                temperature: 0.5
            });

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    response,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (err) {
            context.error('AiCopilot error:', err);
            return { status: 500, jsonBody: { error: "Copilot temporarily unavailable" } };
        }
    }
});
