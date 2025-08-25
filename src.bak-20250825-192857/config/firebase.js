import admin from "firebase-admin";
export const setupFirebase = () => {
  const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_KEY;
  const decodedServiceAccount = Buffer.from(
    serviceAccountBase64,
    "base64"
  ).toString("utf-8");
  const serviceAccount = JSON.parse(decodedServiceAccount);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};
