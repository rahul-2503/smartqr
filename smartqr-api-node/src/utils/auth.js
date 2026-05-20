const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// IMPORTANT: The credentials must be placed in the Azure Functions Application Settings
// or local.settings.json (for local development).
// We use a try-catch block to prevent crashing if the credentials are not yet set,
// but the API will fail to authenticate requests.
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // privateKey might have escaped newlines in env variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

/**
 * Validates a Firebase Authentication JWT token.
 * @param {string} authHeader - The Authorization header string (e.g., "Bearer eyJhb...")
 * @returns {Promise<object>} The decoded token payload if valid.
 */
async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired Firebase token: ' + error.message);
  }
}

module.exports = {
  verifyToken
};
