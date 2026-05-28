const { app } = require('@azure/functions');
const { getContainers } = require('../db');
const { verifyToken } = require('../utils/auth');

app.http('GetScanAnalytics', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'getscananalytics',
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
            const { scans, smartBatches } = await getContainers();

            // 1. Fetch all batches for this org
            const batchQuery = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                parameters: [{ name: "@org", value: orgDomain }]
            };
            const { resources: batches } = await smartBatches.items.query(batchQuery).fetchAll();

            // 2. Fetch all scans for this org
            const scanQuery = {
                query: "SELECT * FROM c WHERE c.organizationDomain = @org",
                parameters: [{ name: "@org", value: orgDomain }]
            };
            const { resources: allScans } = await scans.items.query(scanQuery).fetchAll();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Compute Expiry Alerts & Batch Status Breakdown
            let safeCount = 0;
            let expiringCount = 0; // expiring in next 90 days
            let expiredCount = 0;

            const expiryAlerts = {
                next30: [],
                next60: [],
                next90: []
            };

            batches.forEach(b => {
                const expDate = new Date(b.exp_date);
                const diffTime = expDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let status = 'SAFE';
                if (diffDays < 0) {
                    status = 'EXPIRED';
                    expiredCount++;
                } else if (diffDays <= 90) {
                    status = 'EXPIRING_SOON';
                    expiringCount++;
                    
                    const alertItem = {
                        batchId: b.batch_id,
                        productName: b.product_name,
                        expDate: b.exp_date,
                        daysLeft: diffDays
                    };

                    if (diffDays <= 30) {
                        expiryAlerts.next30.push(alertItem);
                        expiryAlerts.next60.push(alertItem);
                        expiryAlerts.next90.push(alertItem);
                    } else if (diffDays <= 60) {
                        expiryAlerts.next60.push(alertItem);
                        expiryAlerts.next90.push(alertItem);
                    } else {
                        expiryAlerts.next90.push(alertItem);
                    }
                } else {
                    safeCount++;
                }
            });

            // Compute Daily Scan Volume (last 7 days)
            const dailyScanVolume = [];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
                dailyScanVolume.push({
                    date: dateStr,
                    day: dayNames[d.getDay()],
                    scans: 0
                });
            }

            allScans.forEach(scan => {
                if (!scan.timestamp) return;
                const scanDateStr = scan.timestamp.split('T')[0];
                const dayBucket = dailyScanVolume.find(item => item.date === scanDateStr);
                if (dayBucket) {
                    dayBucket.scans++;
                }
            });

            // Compute Top Scanned Products
            const productScanCounts = {};
            allScans.forEach(scan => {
                const prodName = scan.productName || 'Unknown Product';
                productScanCounts[prodName] = (productScanCounts[prodName] || 0) + 1;
            });

            const topScannedProducts = Object.entries(productScanCounts)
                .map(([name, count]) => ({ name, scans: count }))
                .sort((a, b) => b.scans - a.scans)
                .slice(0, 5);

            // Compute Geo-location distribution
            const geoCounts = {};
            allScans.forEach(scan => {
                const locKey = `${scan.city}, ${scan.country}`;
                if (scan.city && scan.city !== 'Unknown City') {
                    if (!geoCounts[locKey]) {
                        geoCounts[locKey] = {
                            city: scan.city,
                            country: scan.country,
                            scans: 0,
                            latitude: scan.latitude,
                            longitude: scan.longitude
                        };
                    }
                    geoCounts[locKey].scans++;
                }
            });

            const geoDistribution = Object.values(geoCounts).sort((a, b) => b.scans - a.scans);

            // Recent Scan Activity (last 10 scans)
            const recentActivity = allScans
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);

            return {
                status: 200,
                jsonBody: {
                    totalProducts: [...new Set(batches.map(b => b.product_id))].length,
                    totalBatches: batches.length,
                    totalScans: allScans.length,
                    statusBreakdown: {
                        safe: safeCount,
                        expiring: expiringCount,
                        expired: expiredCount
                    },
                    dailyScanVolume,
                    topScannedProducts,
                    geoDistribution,
                    expiryAlerts,
                    recentActivity
                }
            };
        } catch (err) {
            context.error('GetScanAnalytics error:', err);
            return { status: 500, jsonBody: { error: "Internal server error" } };
        }
    }
});
