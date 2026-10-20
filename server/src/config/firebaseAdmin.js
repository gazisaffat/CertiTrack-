import admin from 'firebase-admin';

let initialised = false;

/**
 * Initialises firebase-admin once, using a base64-encoded service-account JSON
 * held in FIREBASE_SERVICE_ACCOUNT_B64. Base64 is used so the whole credential
 * fits on a single line in a hosting dashboard (Render, Railway, Fly...) without
 * newline-escaping problems in the private key.
 */
export function initFirebase() {
  if (initialised) return;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_B64 is not set. Without it the server cannot verify Firebase ID tokens.'
    );
  }

  const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialised = true;
  console.log('[firebase] admin SDK initialised for project', serviceAccount.project_id);
}

/** Verifies a Firebase ID token and returns its decoded claims. */
export function verifyFirebaseIdToken(idToken) {
  initFirebase();
  return admin.auth().verifyIdToken(idToken);
}
