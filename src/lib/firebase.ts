import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// ─── App Check ───────────────────────────────────────────────────────────────
// if (import.meta.env.DEV) {
//   // On first run, open the browser console and look for:
//   // "App Check debug token: xxxxxxxx-xxxx-..."
//   // Register that token in Firebase console → App Check → Apps → Manage debug tokens
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
// }

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (siteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (import.meta.env.PROD) {
  throw new Error(
    "[firebase.ts] VITE_RECAPTCHA_SITE_KEY is not set — App Check cannot initialize in production.",
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export const auth = getAuth(app);
export const db = getFirestore(app);
