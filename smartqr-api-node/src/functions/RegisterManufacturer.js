const { app } = require('@azure/functions');
const { getContainers } = require('../db');

// RegisterManufacturer is now DEPRECATED — use RegisterOrganization instead.
// Keeping this as a legacy redirect for backward compatibility.
app.http('RegisterManufacturer', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerManufacturer',
    handler: async (request, context) => {
        return {
            status: 410,
            jsonBody: { 
                error: "This endpoint has been deprecated. Please use POST /api/registerOrganization with Firebase authentication.",
                migration: "The SmartQR platform now uses organization-based authentication. Register through the Manufacturer Portal at /manufacturer/register"
            }
        };
    }
});
