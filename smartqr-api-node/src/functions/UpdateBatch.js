const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('UpdateBatch', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'updateBatch/{batchId}',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const batchId = request.params.batchId;
            const data = await request.json();
            const { smartBatches, auditLogs } = await getContainers();

            // Find existing batch owned by this org
            const querySpec = {
                query: "SELECT * FROM c WHERE c.batch_id = @bid AND c.organizationDomain = @org",
                parameters: [
                    { name: "@bid", value: batchId },
                    { name: "@org", value: authUser.organizationDomain }
                ]
            };
            const { resources } = await smartBatches.items.query(querySpec).fetchAll();

            if (resources.length === 0) {
                return { status: 404, jsonBody: { error: "Batch not found or access denied" } };
            }

            const existing = resources[0];

            const tabletsPerStrip = data.tabletsPerStrip != null ? parseInt(data.tabletsPerStrip) : existing.tablets_per_strip;
            const totalStrips = data.totalStrips != null ? parseInt(data.totalStrips) : existing.total_strips;

            const updated = {
                ...existing,
                mfg_date: data.mfgDate ?? existing.mfg_date,
                exp_date: data.expDate ?? existing.exp_date,
                tablets_per_strip: tabletsPerStrip,
                total_strips: totalStrips,
                total_tablets: tabletsPerStrip * totalStrips,
                mrp: data.mrp != null ? parseFloat(data.mrp) : existing.mrp,
                warnings: data.warnings ?? existing.warnings,
                updated_at: new Date().toISOString(),
                updatedByEmail: authUser.email
            };

            await smartBatches.items.upsert(updated);

            // Audit Trail
            await auditLogs.items.create({
                id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
                organizationDomain: authUser.organizationDomain,
                action: "UPDATE_BATCH",
                actor: authUser.email,
                details: `Updated batch ${batchId}`,
                entityId: batchId,
                entityType: "batch",
                timestamp: new Date().toISOString()
            });

            return {
                status: 200,
                jsonBody: { message: "Batch updated successfully!", batch: updated }
            };
        } catch (err) {
            context.error(err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
