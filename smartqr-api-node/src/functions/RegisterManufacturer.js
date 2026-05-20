const { app } = require('@azure/functions');
const { getContainers } = require('../db');

app.http('RegisterManufacturer', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'registerManufacturer',
    handler: async (request, context) => {
        try {
            const data = await request.json();
            const required = ["companyName", "licenseNo", "gstNo", "address", "state", "contactName", "email", "phone"];

            for (const field of required) {
                if (!data[field]) {
                    return { status: 400, body: JSON.stringify({ error: `Missing field: ${field}` }) };
                }
            }

            const { manufacturers } = await getContainers();

            const mfrId = `MFR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            const item = {
                id: mfrId,
                mfr_id: mfrId,
                company_name: data.companyName,
                license_no: data.licenseNo,
                gst_no: data.gstNo,
                address: data.address,
                state: data.state,
                contact_name: data.contactName,
                email: data.email,
                phone: data.phone,
                registered_at: new Date().toISOString()
            };

            await manufacturers.items.upsert(item);

            return {
                status: 201,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: "Manufacturer registered successfully!", mfrId })
            };
        } catch (err) {
            context.error(err);
            return { status: 500, body: JSON.stringify({ error: "Internal server error" }) };
        }
    }
});
