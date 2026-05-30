const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');
const { callAI } = require('../utils/aiClient');

const SYSTEM_PROMPT = `You are a pharmaceutical risk assessment AI for Indian medicine manufacturers. Analyze the organization's complete operational data and produce a structured risk assessment.

Return ONLY valid JSON with this exact structure:
{
  "overallRiskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "riskScore": 0-100,
  "criticalAlerts": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "category": "EXPIRY | COMPLIANCE | QUALITY | SUPPLY | MARKET",
      "title": "Short alert title",
      "description": "Detailed description with specific numbers",
      "recommendation": "Actionable recommendation",
      "affectedBatches": ["batch IDs if applicable"]
    }
  ],
  "trends": [
    {
      "metric": "What's being measured",
      "direction": "UP | DOWN | STABLE",
      "value": "The change value (e.g., +47%, -12 units)",
      "interpretation": "What this means for the business"
    }
  ],
  "complianceSummary": {
    "status": "COMPLIANT | NEEDS_ATTENTION | NON_COMPLIANT",
    "issues": ["List of specific compliance issues found"],
    "recommendations": ["Specific compliance recommendations"]
  },
  "executiveSummary": "2-3 sentence executive summary of overall org health"
}

Rules:
- Be data-driven. Every alert must reference specific numbers.
- Flag expiry risks with exact dates and unit counts.
- Analyze scan patterns for anomalies (sudden drops, geographic oddities).
- Check for CDSCO/Indian pharma regulatory concerns.
- Risk score: 0-25 LOW, 26-50 MEDIUM, 51-75 HIGH, 76-100 CRITICAL.
- Don't fabricate issues. If data is clean, say so.`;

app.http('AiRiskAssessment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'ai/risk-assessment',
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
            const { medicineProducts, smartBatches, scans, auditLogs } = await getContainers();

            // Fetch all data
            const orgFilter = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                parameters: [{ name: "@org", value: orgDomain }]
            };

            const [productsRes, batchesRes, scansRes, logsRes] = await Promise.all([
                medicineProducts.items.query(orgFilter).fetchAll(),
                smartBatches.items.query(orgFilter).fetchAll(),
                scans.items.query(orgFilter).fetchAll(),
                auditLogs.items.query(orgFilter).fetchAll()
            ]);

            const products = productsRes.resources;
            const batches = batchesRes.resources;
            const allScans = scansRes.resources;
            const logs = logsRes.resources;
            const today = new Date();

            // Pre-compute batch statuses
            const batchAnalysis = batches.map(b => {
                const exp = new Date(b.exp_date);
                const mfg = new Date(b.mfg_date);
                const daysToExpiry = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                const shelfLifeDays = Math.ceil((exp - mfg) / (1000 * 60 * 60 * 24));
                return {
                    batchId: b.batch_id,
                    productName: b.product_name,
                    productId: b.product_id,
                    mfgDate: b.mfg_date,
                    expDate: b.exp_date,
                    daysToExpiry,
                    shelfLifeDays,
                    totalUnits: b.total_tablets || 0,
                    mrp: b.mrp,
                    status: daysToExpiry < 0 ? 'EXPIRED' : daysToExpiry <= 30 ? 'CRITICAL' : daysToExpiry <= 90 ? 'WARNING' : 'SAFE'
                };
            });

            // Scan trends (daily for last 14 days)
            const dailyScans = {};
            for (let i = 0; i < 14; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                dailyScans[d.toISOString().split('T')[0]] = 0;
            }
            allScans.forEach(s => {
                if (s.timestamp) {
                    const dateStr = s.timestamp.split('T')[0];
                    if (dailyScans[dateStr] !== undefined) {
                        dailyScans[dateStr]++;
                    }
                }
            });

            const dataPayload = `
ORGANIZATION: ${authUser.organizationName} (${orgDomain})
ASSESSMENT DATE: ${today.toISOString().split('T')[0]}

PRODUCT REGISTRY (${products.length} products):
${products.map(p => `- ${p.medicine_name} (${p.dosage}, ${p.type}, ${p.category}, Rx: ${p.prescription_required ? 'Yes' : 'No'})`).join('\n')}

BATCH STATUS ANALYSIS (${batches.length} batches):
${batchAnalysis.map(b => `- ${b.batchId}: ${b.productName} | Expires: ${b.expDate} (${b.daysToExpiry} days) | ${b.totalUnits} units | ₹${b.mrp} | Shelf life: ${b.shelfLifeDays} days | Status: ${b.status}`).join('\n')}

SCAN ACTIVITY (${allScans.length} total scans):
Daily scan counts (last 14 days): ${JSON.stringify(dailyScans)}

RECENT AUDIT ACTIONS (last 10):
${logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10).map(l => `- ${l.action}: ${l.details} (${l.timestamp})`).join('\n')}

CRITICAL NUMBERS:
- Expired batches: ${batchAnalysis.filter(b => b.status === 'EXPIRED').length}
- Batches expiring in 30 days: ${batchAnalysis.filter(b => b.status === 'CRITICAL').length}
- Batches expiring in 90 days: ${batchAnalysis.filter(b => b.status === 'WARNING').length}
- Total units at immediate risk: ${batchAnalysis.filter(b => b.status === 'CRITICAL' || b.status === 'EXPIRED').reduce((s, b) => s + b.totalUnits, 0)}`;

            context.log(`[AI Risk] Generating assessment for ${authUser.email}`);

            const result = await callAI(
                SYSTEM_PROMPT,
                dataPayload,
                { maxTokens: 2000, temperature: 0.3, jsonMode: true }
            );

            let parsed;
            try {
                parsed = JSON.parse(result);
            } catch (parseErr) {
                context.error('[AI Risk] Failed to parse:', result);
                return { status: 500, jsonBody: { error: "AI returned invalid data" } };
            }

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    assessment: parsed,
                    generatedAt: new Date().toISOString(),
                    dataPoints: {
                        products: products.length,
                        batches: batches.length,
                        scans: allScans.length,
                        auditEvents: logs.length
                    }
                }
            };
        } catch (err) {
            context.error('AiRiskAssessment error:', err);
            return { status: 500, jsonBody: { error: "AI risk assessment temporarily unavailable" } };
        }
    }
});
