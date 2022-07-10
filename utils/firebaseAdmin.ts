import { initializeApp, cert } from "firebase-admin/app";

// This value must match with the file rocketjaket-hasura-firebase-adminsdk-72pei-e68995a8b3.json
const serviceAccount = () => ({
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url:
    process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
});

export const initFirebaseApp = () => {
  const firebaseConfig = serviceAccount();
  return initializeApp({
    credential: cert({
      projectId: firebaseConfig.project_id,
      clientEmail: firebaseConfig.client_email,
      privateKey: firebaseConfig.private_key,
    }),
  });
};
