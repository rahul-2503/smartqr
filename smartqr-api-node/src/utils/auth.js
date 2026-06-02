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

/**
 * Verifies the user's role within their organization.
 * Looks up the organization's members array to determine the user's role.
 * Auto-migrates legacy orgs (without members array) by assigning the creator as owner.
 * 
 * @param {object} authUser - The authenticated user object from verifyToken()
 * @param {string} requiredRole - Minimum role required: 'employee' (any member) or 'owner'
 * @returns {Promise<object>} { role, organization }
 * @throws {Error} 403 if user lacks required role, 404 if org not found
 */
async function verifyRole(authUser, requiredRole = 'employee') {
  const { getContainers } = require('../db');
  const { organizations } = await getContainers();
  const domain = authUser.organizationDomain;

  let org;
  try {
    const { resource } = await organizations.item(domain, domain).read();
    org = resource;
  } catch (e) {
    // org not found
  }

  if (!org) {
    const err = new Error('Organization not found. Please complete registration.');
    err.statusCode = 404;
    throw err;
  }

  // Auto-migrate legacy orgs that don't have a members array
  if (!org.members || !Array.isArray(org.members)) {
    org.members = [{
      uid: org.createdBy,
      email: org.createdByEmail,
      role: 'owner',
      joinedAt: org.createdAt || new Date().toISOString()
    }];
    await organizations.items.upsert(org);
  }

  // Find user in members array
  const member = org.members.find(m => m.uid === authUser.uid || m.email === authUser.email);

  if (!member) {
    const err = new Error('You are not a member of this organization.');
    err.statusCode = 403;
    throw err;
  }

  // Check role hierarchy: owner > employee
  if (requiredRole === 'owner' && member.role !== 'owner') {
    const err = new Error('This action requires owner privileges.');
    err.statusCode = 403;
    throw err;
  }

  return { role: member.role, organization: org };
}

module.exports = {
  verifyToken,
  verifyRole,
  extractOrgDomain,
  isBusinessEmail,
  deriveOrgName,
  PERSONAL_DOMAINS
};
