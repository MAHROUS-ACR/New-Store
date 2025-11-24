/**
 * Firebase Config Storage
 * Reads/writes Firebase config from Firestore (settings/firebase doc)
 * This is cloud-based, so all users see the same config
 */

import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

export interface FirebaseConfigData {
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  firebaseAuthDomain: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseMeasurementId?: string;
  timestamp?: number;
}

/**
 * Get Firebase config from environment variables (bootstrap config)
 */
export function getBootstrapFirebaseConfig(): Partial<FirebaseConfigData> {
  return {
    firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID,
    firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    firebaseMeasurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

/**
 * Check if Firebase config exists (from env vars)
 */
export function hasFirebaseConfig(): boolean {
  const config = getBootstrapFirebaseConfig();
  return !!(config.firebaseApiKey && config.firebaseProjectId && config.firebaseAppId && config.firebaseAuthDomain);
}

/**
 * Get Firebase config from Firestore if it exists
 */
export async function getFirebaseConfigFromFirestore(): Promise<FirebaseConfigData | null> {
  try {
    // Need bootstrap config to initialize Firebase first
    const bootstrapConfig = getBootstrapFirebaseConfig();
    if (!bootstrapConfig.firebaseApiKey) {
      return null;
    }

    // Initialize Firebase if not already initialized
    if (getApps().length === 0) {
      initializeApp({
        apiKey: bootstrapConfig.firebaseApiKey,
        authDomain: bootstrapConfig.firebaseAuthDomain,
        projectId: bootstrapConfig.firebaseProjectId,
        storageBucket: bootstrapConfig.firebaseStorageBucket || "",
        messagingSenderId: bootstrapConfig.firebaseMessagingSenderId || "",
        appId: bootstrapConfig.firebaseAppId,
      });
    }

    const db = getFirestore();
    const configRef = doc(db, "settings", "firebase");
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return configSnap.data() as FirebaseConfigData;
    }
    return null;
  } catch (error) {
    console.error("Error reading Firebase config from Firestore:", error);
    return null;
  }
}

/**
 * Get effective Firebase config (priority: Firestore > env vars)
 */
export function getEffectiveFirebaseConfig(): Partial<FirebaseConfigData> {
  // Always use environment variables as bootstrap
  return getBootstrapFirebaseConfig();
}
