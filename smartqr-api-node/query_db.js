const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

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
    const mfrContainer = database.container("Manufacturers");
    const orgContainer = database.container("Organizations");

    console.log("\n--- MANUFACTURERS ---");
    const { resources: mfrs } = await mfrContainer.items.readAll().fetchAll();
    console.log(`Found ${mfrs.length} manufacturers:`);
    mfrs.forEach(m => {
        console.log(`MFR ID: ${m.mfr_id}, Email: ${m.email || m.contact_email}, OrgName: ${m.organizationName || m.company_name}, Domain: ${m.organizationDomain}`);
    });

    console.log("\n--- ORGANIZATIONS ---");
    const { resources: orgs } = await orgContainer.items.readAll().fetchAll();
    console.log(`Found ${orgs.length} organizations:`);
    orgs.forEach(o => {
        console.log(`Org Name: ${o.name || o.company_name}, Domain: ${o.domain}`);
    });
}

main().catch(err => {
    console.error("Error:", err);
});
