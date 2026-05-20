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
            // Using new container names to avoid clashes with the old schema's partition keys
            const { container: products } = await database.containers.createIfNotExists({ 
                id: "RetailProducts", 
                partitionKey: { paths: ["/barcode"] } 
            });
            const { container: batches } = await database.containers.createIfNotExists({ 
                id: "RetailBatches", 
                partitionKey: { paths: ["/barcode"] } 
            });
            const { container: auditLogs } = await database.containers.createIfNotExists({
                id: "AuditLogs",
                partitionKey: { paths: ["/organizationId"] }
            });
            const { container: manufacturers } = await database.containers.createIfNotExists({
                id: "Manufacturers",
                partitionKey: { paths: ["/mfr_id"] }
            });
            const { container: medicineProducts } = await database.containers.createIfNotExists({
                id: "MedicineProducts",
                partitionKey: { paths: ["/mfr_id"] }
            });
            const { container: smartBatches } = await database.containers.createIfNotExists({
                id: "Batches",
                partitionKey: { paths: ["/mfr_id"] }
            });
            return { products, batches, auditLogs, manufacturers, medicineProducts, smartBatches };
        })();
    }
    return containersPromise;
}

module.exports = { getContainers };
