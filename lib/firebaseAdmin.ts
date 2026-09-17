import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return admin;

  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!svc) {
    // Not initialized — consumer should handle this situation and fail gracefully.
    return admin;
  }

  const serviceAccount = JSON.parse(svc);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  return admin;
}

const adminApp = initAdmin();
export default adminApp;
