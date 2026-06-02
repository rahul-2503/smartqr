const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');
const { sendExpiryAlertEmail } = require('../utils/mailSender');

// Helper to calculate days left until expiry
function getDaysLeft(expDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expDateStr);
    expDate.setHours(0, 0, 0, 0);
    const diffTime = expDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// POST /api/triggerExpiryAlerts — Manual test trigger for email notifications
app.http('TriggerExpiryAlerts', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'triggerExpiryAlerts',
    handler: async (request, context) => {
        try {
            const authHeader = request.headers.get('authorization');
            let authUser;
            try {
                authUser = await verifyToken(authHeader);
            } catch (authErr) {
                return { status: 401, jsonBody: { error: "Unauthorized: " + authErr.message } };
            }

            const orgDomain = authUser.organizationDomain;
            const { organizations, smartBatches } = await getContainers();

            // Retrieve organization details (to get member emails)
            const { resource: org } = await organizations.item(orgDomain, orgDomain).read();
            if (!org) {
                return { status: 404, jsonBody: { error: "Organization not found" } };
            }

            // Retrieve all batches for this organization
            const batchQuery = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                parameters: [{ name: "@org", value: orgDomain }]
            };
            const { resources: batches } = await smartBatches.items.query(batchQuery).fetchAll();

            // Filter for batches expiring within 30 days
            let expiringBatches = [];
            batches.forEach(b => {
                const days = getDaysLeft(b.exp_date);
                if (days >= -5 && days <= 30) {
                    expiringBatches.push({
                        batch_id: b.batch_id,
                        product_name: b.product_name || 'Medicine Product',
                        exp_date: b.exp_date,
                        days_left: days
                    });
                }
            });

            let isSimulated = false;
            // If no batches are expiring, generate simulated batches for testing
            if (expiringBatches.length === 0) {
                isSimulated = true;
                expiringBatches = [
                    {
                        batch_id: 'SIM-BATCH-01A',
                        product_name: 'Paracetamol 500mg Tablet (Alert Stage: CRITICAL)',
                        exp_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days left (CRITICAL)
                        days_left: 5
                    },
                    {
                        batch_id: 'SIM-BATCH-02B',
                        product_name: 'Amoxicillin 250mg Capsule (Alert Stage: URGENT)',
                        exp_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days left (URGENT)
                        days_left: 12
                    },
                    {
                        batch_id: 'SIM-BATCH-03C',
                        product_name: 'Ibuprofen 400mg Tablet (Alert Stage: WARNING)',
                        exp_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 days left (WARNING)
                        days_left: 25
                    }
                ];
            }

            // Extract all registered member emails
            const recipientEmails = (org.members || []).map(m => m.email).filter(Boolean);
            
            // Fallback to authUser email if no members array
            if (recipientEmails.length === 0) {
                recipientEmails.push(authUser.email);
            }

            // Send notification email
            const emailResult = await sendExpiryAlertEmail(recipientEmails, org.name || org.domain, expiringBatches);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: isSimulated 
                        ? "Test alert simulated! No real expiring batches were found, so simulated warning batches were emailed."
                        : `Real-time alerts sent successfully for ${expiringBatches.length} expiring batch(es).`,
                    recipients: recipientEmails,
                    batchesAlertedCount: expiringBatches.length,
                    previewUrl: emailResult.previewUrl,
                    isEthereal: emailResult.isEthereal,
                    simulated: isSimulated
                }
            };
        } catch (err) {
            context.error('Manual alert trigger failed: ', err);
            return { status: 500, jsonBody: { error: "Internal server error: " + err.message } };
        }
    }
});

// TIMER TRIGGER — Daily background cron job that scans all organizations' ledgers for expiring batches
app.timer('ExpiryAlertsScheduler', {
    schedule: '0 0 10 * * *', // Run every day at 10:00 AM
    handler: async (myTimer, context) => {
        context.log('Starting automated daily manufacturing ledger scan for expiring batches...');
        
        try {
            const { organizations, smartBatches } = await getContainers();

            // Load all organizations
            const { resources: allOrgs } = await organizations.items.readAll().fetchAll();
            if (allOrgs.length === 0) {
                context.log('No organizations registered. Skipping ledger scan.');
                return;
            }

            // Load all manufacturing batches
            const { resources: allBatches } = await smartBatches.items.readAll().fetchAll();
            if (allBatches.length === 0) {
                context.log('No batches registered. Skipping ledger scan.');
                return;
            }

            // Group batches expiring in <= 30 days by organization domain
            const orgExpiringMap = {};
            
            allBatches.forEach(b => {
                const days = getDaysLeft(b.exp_date);
                if (days >= 0 && days <= 30) {
                    const domain = b.organizationDomain;
                    if (!orgExpiringMap[domain]) {
                        orgExpiringMap[domain] = [];
                    }
                    orgExpiringMap[domain].push({
                        batch_id: b.batch_id,
                        product_name: b.product_name || 'Medicine Product',
                        exp_date: b.exp_date,
                        days_left: days
                    });
                }
            });

            // Dispatch emails to each organization
            for (const org of allOrgs) {
                const domain = org.domain;
                const expiringList = orgExpiringMap[domain];

                if (expiringList && expiringList.length > 0) {
                    const recipientEmails = (org.members || []).map(m => m.email).filter(Boolean);
                    if (recipientEmails.length === 0 && org.createdByEmail) {
                        recipientEmails.push(org.createdByEmail);
                    }

                    if (recipientEmails.length > 0) {
                        context.log(`Dispatching background alert email to ${recipientEmails.length} member(s) of "${org.name}" for ${expiringList.length} expiring batch(es)...`);
                        await sendExpiryAlertEmail(recipientEmails, org.name || org.domain, expiringList);
                    }
                }
            }

            context.log('Daily automated manufacturing ledger scan completed successfully.');
        } catch (err) {
            context.error('Daily automated expiry scheduler execution failed: ', err);
        }
    }
});
