const { app } = require('@azure/functions');
const { getContainers } = require('../db');

function getStatusFromExpiry(expDateStr) {
    const expDate = new Date(expDateStr);
    const today = new Date();
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'EXPIRED';
    if (diffDays <= 90) return 'EXPIRING_SOON';
    return 'SAFE';
}

app.http('GetBatch', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'getbatch/{batchId}',
    handler: async (request, context) => {
        try {
            const batchId = decodeURIComponent(request.params.batchId);
            if (!batchId) {
                return { status: 400, body: JSON.stringify({ error: "Batch ID is required" }) };
            }

            const { smartBatches, medicineProducts, manufacturers, organizations } = await getContainers();

            let batch = null;

            // Strategy 1: If batchId contains '_', it's a composite ID (orgDomain_batchNo)
            // Try a precise point-read first (much faster and always returns the correct batch)
            if (batchId.includes('_')) {
                const underscoreIdx = batchId.indexOf('_');
                const orgDomain = batchId.substring(0, underscoreIdx);
                try {
                    const { resource } = await smartBatches.item(batchId, orgDomain).read();
                    if (resource) batch = resource;
                } catch (err) {
                    // Point read failed, fall through to query
                    context.log("Point read failed for", batchId, "- trying cross-partition query");
                }
            }

            // Strategy 2: Fallback — cross-partition query by batch_id (for old QR codes)
            if (!batch) {
                const batchQuery = {
                    query: "SELECT * FROM c WHERE c.batch_id = @batchId OR c.id = @batchId",
                    parameters: [{ name: "@batchId", value: batchId }]
                };
                const { resources: batchResults } = await smartBatches.items.query(batchQuery).fetchAll();
                
                if (batchResults.length === 0) {
                    return { status: 404, body: JSON.stringify({ error: "Batch not found" }) };
                }
                
                batch = batchResults[0];
            }

            batch.status = getStatusFromExpiry(batch.exp_date);

            // Get Product
            let product = null;
            const orgDomain = batch.organizationDomain || batch.mfr_id;
            if (batch.product_id && orgDomain) {
                try {
                    const { resource: p } = await medicineProducts.item(batch.product_id, orgDomain).read();
                    product = p;
                } catch (err) {
                    context.error("Error reading product:", err);
                }
            }

            // Get Manufacturer / Organization
            let manufacturer = null;
            if (orgDomain) {
                try {
                    const { resource: org } = await organizations.item(orgDomain, orgDomain).read();
                    if (org) {
                        manufacturer = {
                            mfr_id: org.domain,
                            companyName: org.name,
                            address: org.address,
                            contactEmail: org.contactEmail,
                            contactPhone: org.contactPhone
                        };
                    } else {
                        const { resource: m } = await manufacturers.item(orgDomain, orgDomain).read();
                        manufacturer = m;
                    }
                } catch (err) {
                    context.error("Error reading manufacturer:", err);
                }
            }

            return {
                status: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    batch,
                    product: product || {},
                    manufacturer: manufacturer || {}
                })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
