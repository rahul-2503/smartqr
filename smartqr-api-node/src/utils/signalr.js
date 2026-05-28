const jwt = require('jsonwebtoken');

function generateSignalRConnectionInfo(connectionString, hubName) {
    if (!connectionString) return null;
    try {
        const pairs = connectionString.split(';').reduce((acc, pair) => {
            const idx = pair.indexOf('=');
            if (idx !== -1) {
                const key = pair.substring(0, idx).trim();
                const val = pair.substring(idx + 1).trim();
                acc[key] = val;
            }
            return acc;
        }, {});

        const endpoint = pairs['Endpoint'];
        const accessKey = pairs['AccessKey'];
        if (!endpoint || !accessKey) return null;

        const baseUrl = endpoint.replace(/\/$/, '');
        const clientUrl = `${baseUrl}/client/?hub=${hubName}`;

        const token = jwt.sign({}, Buffer.from(accessKey, 'base64'), {
            audience: clientUrl,
            expiresIn: '1h',
            algorithm: 'HS256'
        });

        return {
            url: clientUrl,
            accessToken: token
        };
    } catch (err) {
        console.error('Error generating SignalR connection info:', err);
        return null;
    }
}

async function broadcastSignalRMessage(connectionString, hubName, target, args) {
    if (!connectionString) return;
    try {
        const pairs = connectionString.split(';').reduce((acc, pair) => {
            const idx = pair.indexOf('=');
            if (idx !== -1) {
                acc[pair.substring(0, idx).trim()] = pair.substring(idx + 1).trim();
            }
            return acc;
        }, {});

        const endpoint = pairs['Endpoint'];
        const accessKey = pairs['AccessKey'];
        if (!endpoint || !accessKey) return;

        const baseUrl = endpoint.replace(/\/$/, '');
        const restUrl = `${baseUrl}/api/v1/hubs/${hubName}`;

        const token = jwt.sign({}, Buffer.from(accessKey, 'base64'), {
            audience: restUrl,
            expiresIn: '5m',
            algorithm: 'HS256'
        });

        const res = await fetch(restUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                Target: target,
                Arguments: args
            })
        });

        if (!res.ok) {
            console.error('SignalR broadcast failed:', res.status, await res.text());
        }
    } catch (err) {
        console.error('SignalR broadcast error:', err);
    }
}

module.exports = {
    generateSignalRConnectionInfo,
    broadcastSignalRMessage
};
