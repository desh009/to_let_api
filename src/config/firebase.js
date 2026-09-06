import admin from 'firebase-admin';

function getCredential() {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (rawServiceAccount) {
    try {
      return admin.credential.cert(JSON.parse(rawServiceAccount));
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.');
    }
  }

  return admin.credential.applicationDefault();
}

export function initializeFirebase() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: getCredential(),
      projectId: process.env.FIREBASE_PROJECT_ID || undefined,
    });
  }

  return {
    admin,
    db: admin.firestore(),
    messaging: admin.messaging(),
  };
}
