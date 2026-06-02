const nodemailer = require('nodemailer');

let testAccount = null;

/**
 * Configure Nodemailer transporter dynamically
 */
async function getTransporter() {
    if (process.env.SMTP_HOST) {
        return {
            transporter: nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            }),
            from: process.env.SMTP_FROM || 'alerts@smartqr.com',
            isEthereal: false
        };
    }
    
    // Automatically create a developer Ethereal test account if no SMTP configured
    if (!testAccount) {
        try {
            testAccount = await nodemailer.createTestAccount();
        } catch (err) {
            console.error('Failed to create Ethereal Email test account, falling back to basic mock: ', err);
            // Fallback object to prevent crashes if Ethereal creation fails
            testAccount = {
                user: 'mock-developer@ethereal.email',
                pass: 'mockpass',
                smtp: { host: 'smtp.ethereal.email', port: 587, secure: false }
            };
        }
    }
    
    return {
        transporter: nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        }),
        from: `SmartQR Alerts <${testAccount.user}>`,
        isEthereal: true
    };
}

/**
 * Sends a warning email about expiring batches to all employees/owners
 * @param {string[]} toEmails Roster of user emails
 * @param {string} orgName Organization name
 * @param {object[]} expiringBatches Array of batch objects
 */
async function sendExpiryAlertEmail(toEmails, orgName, expiringBatches) {
    if (!toEmails || toEmails.length === 0) {
        console.log(`[MailSender] No recipient emails found for org "${orgName}". Skipping email send.`);
        return { success: false, reason: 'No recipients' };
    }

    const { transporter, from, isEthereal } = await getTransporter();

    // Map batches to categorized threat level and color styling
    const formattedBatches = expiringBatches.map(b => {
        const days = b.days_left ?? 30; // default fallback
        let tier = 'WARNING';
        let color = '#d97706'; // Orange/Yellow
        let bgColor = '#fffbeb';
        let borderColor = '#fef3c7';

        if (days <= 10) {
            tier = 'CRITICAL';
            color = '#dc2626'; // Red
            bgColor = '#fef2f2';
            borderColor = '#fee2e2';
        } else if (days <= 15) {
            tier = 'URGENT';
            color = '#ea580c'; // Orange-Red
            bgColor = '#fff7ed';
            borderColor = '#ffedd5';
        }

        return {
            ...b,
            days_left: days,
            tier,
            color,
            bgColor,
            borderColor
        };
    });

    // Sort batches by urgency (days left ascending)
    formattedBatches.sort((a, b) => a.days_left - b.days_left);

    // Create batch table rows
    const rowsHtml = formattedBatches.map(b => `
        <tr style="background-color: ${b.bgColor}; border-bottom: 1px solid ${b.borderColor};">
            <td style="padding: 12px 16px; font-family: monospace; font-weight: bold; color: #1f2937;">${b.batch_id}</td>
            <td style="padding: 12px 16px; color: #374151; font-weight: 500;">${b.product_name || 'Unknown Product'}</td>
            <td style="padding: 12px 16px; color: #4b5563;">${new Date(b.exp_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td style="padding: 12px 16px;">
                <span style="color: ${b.color}; font-weight: 700; font-size: 12px; background: #ffffff; padding: 4px 8px; border: 1px solid ${b.color}; border-radius: 4px; display: inline-block;">
                    ${b.tier} (${b.days_left} days left)
                </span>
            </td>
        </tr>
    `).join('');

    const subject = `[SmartQR Expiry Alert] ${expiringBatches.length} batch(es) expiring soon for ${orgName}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Batch Expiration Alert</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
            
            <!-- Email Header -->
            <div style="background: linear-gradient(135deg, #09090b, #27272a); padding: 32px; text-align: center; border-bottom: 3px solid #dc2626;">
                <div style="background-color: #ffffff; width: 44px; height: 44px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                    <span style="font-size: 20px; font-weight: 900; color: #09090b;">QR</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.025em;">SmartQR Enterprise Ledger</h1>
                <p style="color: #a1a1aa; margin: 4px 0 0; font-size: 13px;">Automated Manufacturing Expiry Alert System</p>
            </div>

            <!-- Email Body -->
            <div style="padding: 32px;">
                <h2 style="color: #111827; margin: 0 0 12px; font-size: 18px; font-weight: 700;">Attention ${orgName} Workspace Team,</h2>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    The system has detected **${expiringBatches.length} batch(es)** in your pharmaceutical ledger that are approaching expiration. Please review the details below to prevent distribution of expired stocks:
                </p>

                <!-- Batches Table -->
                <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13.5px;">
                        <thead>
                            <tr style="background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                                <th style="padding: 12px 16px; font-weight: 600; color: #374151;">Batch ID</th>
                                <th style="padding: 12px 16px; font-weight: 600; color: #374151;">Medicine</th>
                                <th style="padding: 12px 16px; font-weight: 600; color: #374151;">Exp Date</th>
                                <th style="padding: 12px 16px; font-weight: 600; color: #374151;">Severity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>

                <!-- Guidance note -->
                <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 4px; color: #1e293b; font-size: 13px; font-weight: bold;">Actions Required:</h4>
                    <p style="margin: 0; color: #475569; font-size: 12px; line-height: 1.5;">
                        1. Stop packaging/distributing these batches immediately.<br>
                        2. Verify warehouse inventory counts for matching QR labels.<br>
                        3. Expiry status is automatically broadcasted to consumers upon scanning.
                    </p>
                </div>

                <!-- Call to action button -->
                <div style="text-align: center; margin-bottom: 8px;">
                    <a href="https://smartqr.com/manufacturer/dashboard" style="background-color: #09090b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        Open Batch Ledger Dashboard
                    </a>
                </div>
            </div>

            <!-- Email Footer -->
            <div style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                <p style="margin: 0 0 8px;">This is an automated security broadcast sent to all registered accounts in your workspace domain.</p>
                <p style="margin: 0; font-weight: bold;">SmartQR Protection Services &copy; 2026</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const info = await transporter.sendMail({
        from: from,
        to: toEmails.join(', '),
        subject: subject,
        html: htmlContent
    });

    let previewUrl = null;
    if (isEthereal) {
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[MailSender] Expiring Alert Email sent to: ${toEmails.join(', ')}`);
        console.log(`[MailSender] Ethereal Preview Inbox: ${previewUrl}`);
    } else {
        console.log(`[MailSender] Live Expiring Alert Email sent to: ${toEmails.join(', ')}`);
    }

    return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl,
        isEthereal
    };
}

module.exports = { sendExpiryAlertEmail };
