const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { broadcastSignalRMessage } = require('../utils/signalr');

app.http('RecordScan', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'recordscan',
    handler: async (request, context) => {
        try {
            const data = await request.json();
            const { batchId, productName, organizationDomain, city, region, country, latitude, longitude } = data;

            if (!batchId || !organizationDomain) {
                return { status: 400, jsonBody: { error: "Missing required fields (batchId, organizationDomain)" } };
            }

            const { scans } = await getContainers();

            const scanId = `scan-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
            const userAgent = request.headers.get('user-agent') || 'Unknown';

            const scanEvent = {
                id: scanId,
                batchId,
                productName: productName || 'Unknown Product',
                organizationDomain,
                timestamp: new Date().toISOString(),
                city: city || 'Unknown City',
                region: region || 'Unknown Region',
                country: country || 'Unknown Country',
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                userAgent
            };

            await scans.items.create(scanEvent);

            // Broadcast to SignalR if configured
            const signalRConnString = process.env.AzureSignalRConnectionString;
            if (signalRConnString) {
                await broadcastSignalRMessage(signalRConnString, 'dashboard', 'newScan', [scanEvent]);
            }

            return {
                status: 201,
                jsonBody: { success: true, scanId }
            };
        } catch (err) {
            context.error('RecordScan error:', err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
