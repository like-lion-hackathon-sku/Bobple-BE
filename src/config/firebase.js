// src/config/firebase.js
import fs from "node:fs";
import admin from "firebase-admin";

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_CREDENTIALS_KEY; // Base64
  const raw = process.env.FIREBASE_CREDENTIALS_JSON; // RAW JSON
  const pth = process.env.FIREBASE_CREDENTIALS_PATH; // 파일 경로

  if (!b64 && !raw && !pth) {
    // 키가 전혀 없는 경우 -> 초기화 skip 신호
    return null;
  }

  try {
    if (b64) {
      const json = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(json);
    }
    if (raw) return JSON.parse(raw);
    if (pth) return JSON.parse(fs.readFileSync(pth, "utf8"));
  } catch (e) {
    // 키가 있지만 파싱 실패 → 여기서는 서버 죽이지 말고 skip
    console.warn(
      "[firebase] 서비스 계정 파싱 실패, Firebase 비활성화로 계속 진행:",
      e.message
    );
    return null;
  }
}

export const setupFirebase = () => {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    console.warn("[firebase] 키가 없어 Firebase 초기화를 건너뜁니다.");
    return false; // 키 없음 → skip
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("[firebase] Firebase Admin 초기화 완료");
  }
  return true;
};

export { admin };
