/**
 * Firebase Config Storage - Firestore Only
 * Checks Firestore for config. If not found, shows setup page.
 * No separate files needed - everything in Firestore.
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export interface FirebaseConfigData {
  firebaseApiKey: string;
  firebaseProjectId: string;
  firebaseAppId: string;
  firebaseAuthDomain: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseMeasurementId?: string;
}

/**
 * Get Firebase config from environment variables (bootstrap only)
 */
function getBootstrapConfig(): Partial<FirebaseConfigData> {
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
 * Check if Firebase has a valid config (env vars only, for initial check)
 */
export function hasBootstrapConfig(): boolean {
  const config = getBootstrapConfig();
  return !!(config.firebaseApiKey && config.firebaseProjectId && config.firebaseAppId && config.firebaseAuthDomain);
}

/**
 * Initialize Firebase with bootstrap config
 */
function initializeBootstrapFirebase() {
  try {
    if (getApps().length === 0) {
      const config = getBootstrapConfig();
      if (config.firebaseApiKey && config.firebaseProjectId) {
        initializeApp({
          apiKey: config.firebaseApiKey,
          authDomain: config.firebaseAuthDomain,
          projectId: config.firebaseProjectId,
          storageBucket: config.firebaseStorageBucket || "",
          messagingSenderId: config.firebaseMessagingSenderId || "",
          appId: config.firebaseAppId,
        });
      }
    }
  } catch (error: any) {
    if (!error.message?.includes('duplicate-app')) {
      console.error("Error initializing Firebase:", error);
    }
  }
}

/**
 * Check if config exists in Firestore (settings/firebase)
 */
export async function hasFirebaseConfigInFirestore(): Promise<boolean> {
  try {
    // Need bootstrap to read from Firestore
    if (!hasBootstrapConfig()) {
      return false;
    }

    initializeBootstrapFirebase();
    const db = getFirestore();
    const configRef = doc(db, "settings", "firebase");
    const configSnap = await getDoc(configRef);
    
    return configSnap.exists();
  } catch (error) {
    console.error("Error checking Firestore config:", error);
    return false;
  }
}

/**
 * Get config from Firestore (settings/firebase document)
 */
export async function getFirebaseConfigFromFirestore(): Promise<FirebaseConfigData | null> {
  try {
    if (!hasBootstrapConfig()) {
      return null;
    }

    initializeBootstrapFirebase();
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
