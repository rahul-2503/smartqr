const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');
const { callAI } = require('../utils/aiClient');

const SYSTEM_PROMPT = `You are a pharmaceutical business intelligence assistant. Analyze the manufacturer's operational data and produce a concise, actionable insights summary.

Write in a direct, professional tone. Use emoji sparingly for visual scanning. Focus on:
1. Critical alerts that need immediate attention
2. Trends (improving or declining)
3. Specific actionable recommendations
4. Anomalies or unusual patterns

Format as 3-5 short paragraphs. Each paragraph should start with a relevant emoji. Keep the total under 200 words. Be specific — cite actual numbers from the data.

Do NOT use generic advice. Every sentence should reference specific data points provided.`;

app.http('AiInsights', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'ai/insights',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const orgDomain = authUser.organizationDomain;
            const { medicineProducts, smartBatches, scans } = await getContainers();

            // Fetch all org data
            const [productsRes, batchesRes, scansRes] = await Promise.all([
                medicineProducts.items.query({
                    query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                    parameters: [{ name: "@org", value: orgDomain }]
                }).fetchAll(),
                smartBatches.items.query({
                    query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                    parameters: [{ name: "@org", value: orgDomain }]
                }).fetchAll(),
                scans.items.query({
                    query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                    parameters: [{ name: "@org", value: orgDomain }]
                }).fetchAll()
            ]);

            const products = productsRes.resources;
            const batches = batchesRes.resources;
            const allScans = scansRes.resources;

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // Compute data summary for AI
            const expiringIn30 = batches.filter(b => {
                const exp = new Date(b.exp_date);
                const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                return diff >= 0 && diff <= 30;
            });

            const expired = batches.filter(b => new Date(b.exp_date) < today);

            // Scan trends
            const last7Days = allScans.filter(s => {
                const scanDate = new Date(s.timestamp);
                const diffDays = Math.ceil((today - scanDate) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            });
            const prev7Days = allScans.filter(s => {
                const scanDate = new Date(s.timestamp);
                const diffDays = Math.ceil((today - scanDate) / (1000 * 60 * 60 * 24));
                return diffDays > 7 && diffDays <= 14;
            });

            // Geo distribution
            const geoCounts = {};
            allScans.forEach(s => {
                if (s.city && s.city !== 'Unknown City') {
                    geoCounts[s.city] = (geoCounts[s.city] || 0) + 1;
                }
            });

            // Product scan counts
            const prodCounts = {};
            allScans.forEach(s => {
                const name = s.productName || 'Unknown';
                prodCounts[name] = (prodCounts[name] || 0) + 1;
            });

            const dataSummary = `
ORGANIZATION: ${authUser.organizationName} (${orgDomain})
DATE: ${todayStr}

INVENTORY:
- Total Products Registered: ${products.length}
- Total Active Batches: ${batches.length}
- Total QR Codes Generated: ${batches.reduce((sum, b) => sum + (b.total_tablets || 0), 0).toLocaleString()}

EXPIRY STATUS:
- Batches expiring within 30 days: ${expiringIn30.length} ${expiringIn30.length > 0 ? '(' + expiringIn30.map(b => `${b.product_name} batch ${b.batch_id} — ${b.exp_date}`).join(', ') + ')' : ''}
- Already expired batches: ${expired.length}
- Total units at risk: ${expiringIn30.reduce((sum, b) => sum + (b.total_tablets || 0), 0).toLocaleString()}

SCAN ACTIVITY:
- Total scans ever: ${allScans.length}
- Scans last 7 days: ${last7Days.length}
- Scans previous 7 days: ${prev7Days.length}
- Week-over-week change: ${prev7Days.length > 0 ? Math.round(((last7Days.length - prev7Days.length) / prev7Days.length) * 100) : 'N/A'}%

TOP SCANNED PRODUCTS: ${Object.entries(prodCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => `${name} (${count})`).join(', ') || 'No scans yet'}

GEOGRAPHIC DISTRIBUTION: ${Object.entries(geoCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([city, count]) => `${city} (${count})`).join(', ') || 'No location data'}`;

            context.log(`[AI Insights] Generating for ${authUser.email}`);

            const insights = await callAI(
                SYSTEM_PROMPT,
                dataSummary,
                { maxTokens: 500, temperature: 0.6 }
            );

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    insights,
                    generatedAt: new Date().toISOString()
                }
            };
        } catch (err) {
            context.error('AiInsights error:', err);
            return { status: 500, jsonBody: { error: "AI insights temporarily unavailable" } };
        }
    }
});
