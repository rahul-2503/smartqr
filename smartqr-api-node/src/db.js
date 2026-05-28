const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
    endpoint: process.env.COSMOS_URL,
    key: process.env.COSMOS_KEY
});

const database = client.database("ProductDB");

let containersPromise = null;

async function getContainers() {
    if (!containersPromise) {
        containersPromise = (async () => {
            // Consumer-facing containers (existing, untouched)
            const { container: products } = await database.containers.createIfNotExists({ 
                id: "RetailProducts", 
                partitionKey: { paths: ["/barcode"] } 
            });
            const { container: batches } = await database.containers.createIfNotExists({ 
                id: "RetailBatches", 
                partitionKey: { paths: ["/barcode"] } 
            });

            // Organization-based containers (rebuilt for enterprise multi-tenant)
            const { container: organizations } = await database.containers.createIfNotExists({
                id: "Organizations",
                partitionKey: { paths: ["/domain"] }
            });
            const { container: auditLogs } = await database.containers.createIfNotExists({
                id: "AuditLogs",
                partitionKey: { paths: ["/organizationDomain"] }
            });
            const { container: manufacturers } = await database.containers.createIfNotExists({ 
                id: "Manufacturers", 
                partitionKey: { paths: ["/mfr_id"] } 
            });
            const { container: medicineProducts } = await database.containers.createIfNotExists({ 
                id: "MedicineProducts", 
                partitionKey: { paths: ["/organizationDomain"] } 
            });
            const { container: smartBatches } = await database.containers.createIfNotExists({ 
                id: "SmartBatches", 
                partitionKey: { paths: ["/organizationDomain"] } 
            });
            const { container: scans } = await database.containers.createIfNotExists({ 
                id: "Scans", 
                partitionKey: { paths: ["/organizationDomain"] } 
            });

            return { products, batches, organizations, auditLogs, manufacturers, medicineProducts, smartBatches, scans };
        })();
    }
    return containersPromise;
}

module.exports = { getContainers };
