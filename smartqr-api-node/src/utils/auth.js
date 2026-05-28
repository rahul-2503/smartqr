const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

// Personal email domains that are NOT allowed for manufacturer registration
const PERSONAL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com',
  'gmx.com', 'live.com', 'msn.com', 'me.com', 'inbox.com',
  'yahoo.co.in', 'rediffmail.com', 'yahoo.in'
];

/**
 * Extracts organization domain from an email address.
 * @param {string} email 
 * @returns {string} The domain portion (e.g., "cipla.com")
 */
function extractOrgDomain(email) {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase();
}

/**
 * Checks if an email is a business email (not personal).
 * @param {string} email 
 * @returns {boolean}
 */
function isBusinessEmail(email) {
  const domain = extractOrgDomain(email);
  if (!domain) return false;
  return !PERSONAL_DOMAINS.includes(domain);
}

/**
 * Derives an organization name from a domain.
 * e.g., "cipla.com" → "Cipla", "britannia.co.in" → "Britannia"
 * @param {string} domain 
 * @returns {string}
 */
function deriveOrgName(domain) {
  if (!domain) return 'Unknown';
  // Remove TLD parts to get the company name
  const parts = domain.split('.');
  const name = parts[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Validates a Firebase Authentication JWT token and extracts organization context.
 * @param {string} authHeader - The Authorization header string (e.g., "Bearer eyJhb...")
 * @returns {Promise<object>} { uid, email, organizationDomain, organizationName }
 */
async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const email = decodedToken.email;
    const organizationDomain = extractOrgDomain(email);
    const organizationName = deriveOrgName(organizationDomain);

    return {
      uid: decodedToken.uid,
      email: email,
      organizationDomain: organizationDomain,
      organizationName: organizationName,
      isBusinessEmail: isBusinessEmail(email)
    };
  } catch (error) {
    throw new Error('Invalid or expired Firebase token: ' + error.message);
  }
}

module.exports = {
  verifyToken,
  extractOrgDomain,
  isBusinessEmail,
  deriveOrgName,
  PERSONAL_DOMAINS
};
