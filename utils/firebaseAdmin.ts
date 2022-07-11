import to from "await-to-js";
import axios from "axios";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { getNhostConfig, nhost } from "./nhost";

const getFirebaseConfig = () => ({
  FIREBASE_ADMIN_CONFIG_FILE_ID:
    process.env.FIREBASE_ADMIN_CONFIG_FILE_ID || "",
});

export const myFirebaseAdminApp = async () => {
  const url = `${
    getNhostConfig().NHOST_BACKEND_URL
  }${nhost.storage.getPublicUrl({
    fileId: getFirebaseConfig().FIREBASE_ADMIN_CONFIG_FILE_ID,
  })}`;
  console.log(
    "🚀 ~ file: firebaseAdmin.ts ~ line 18 ~ myFirebaseAdminApp ~ url",
    url
  );

  const header = {
    headers: { "x-hasura-admin-secret": getNhostConfig().NHOST_ADMIN_SECRET },
  };
  const [err, res] = await to(axios.get(url, header));
  const firebaseConfig = res?.data;
  if (!firebaseConfig) throw new Error("Firebase config not found");

  // console.log(
  //   "🚀 ~ file: firebaseAdmin.ts ~ line 30 ~ myFirebaseAdminApp ~ firebaseConfig",
  //   firebaseConfig
  // );

  const app = initializeApp({
    credential: cert({
      projectId: firebaseConfig.project_id,
      clientEmail: firebaseConfig.client_email,
      privateKey: firebaseConfig.private_key,
    }),
  });

  return {
    messaging: getMessaging(app),
  };
};
