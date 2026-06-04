const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

// Load from local.settings.json in current directory
const settings = JSON.parse(fs.readFileSync('local.settings.json', 'utf8'));
const cosmosUrl = settings.Values.COSMOS_URL;
const cosmosKey = settings.Values.COSMOS_KEY;

const client = new CosmosClient({
    endpoint: cosmosUrl,
    key: cosmosKey
});

const database = client.database("ProductDB");

async function main() {
    console.log("Connecting to Cosmos DB...");
    const productsContainer = database.container("MedicineProducts");
    const batchesContainer = database.container("SmartBatches");

    console.log("\n--- MEDICINE PRODUCTS ---");
    const { resources: products } = await productsContainer.items.readAll().fetchAll();
    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
        console.log(`ID: ${p.id}, Name: ${p.medicine_name}, Domain: ${p.organizationDomain}`);
    });

    console.log("\n--- SMART BATCHES ---");
    const { resources: batches } = await batchesContainer.items.readAll().fetchAll();
    console.log(`Found ${batches.length} batches:`);
    batches.forEach(b => {
        console.log(`Batch ID: ${b.batch_id}, Product: ${b.product_name}, Domain: ${b.organizationDomain}, Exp: ${b.exp_date}`);
    });
}

main().catch(err => {
    console.error("Error:", err);
});
