const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');

async function backup() {
    const client = new CosmosClient({
        endpoint: process.env.COSMOS_URL,
        key: process.env.COSMOS_KEY
    });
    
    const container = client.database("ProductDB").container("Products");
    
    console.log("Fetching all items for backup...");
    const { resources: items } = await container.items.readAll().fetchAll();
    
    fs.writeFileSync('cosmos_backup.json', JSON.stringify(items, null, 2));
    console.log(`Successfully backed up ${items.length} items to cosmos_backup.json`);
}

backup().catch(console.error);
