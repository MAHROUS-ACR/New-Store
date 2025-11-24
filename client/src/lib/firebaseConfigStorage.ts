/**
 * Firebase Config Storage
 * Manages reading/writing Firebase config to localStorage
 * This allows first-time setup detection and persistence across sessions
 */

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

const CONFIG_KEY = "flux_wallet_firebase_config";

/**
 * Check if Firebase config exists in localStorage
 */
export function hasFirebaseConfig(): boolean {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (!stored) return false;
    
    const config = JSON.parse(stored) as FirebaseConfigData;
    // Check if required fields exist
    return !!(config.firebaseApiKey && config.firebaseProjectId && config.firebaseAppId && config.firebaseAuthDomain);
  } catch (error) {
    return false;
  }
}

/**
 * Get Firebase config from localStorage
 */
export function getFirebaseConfigFromStorage(): FirebaseConfigData | null {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as FirebaseConfigData;
  } catch (error) {
    console.error("Error reading Firebase config from storage:", error);
    return null;
  }
}

/**
 * Save Firebase config to localStorage
 */
export function saveFirebaseConfigToStorage(config: FirebaseConfigData): void {
  try {
    const dataToStore = {
      ...config,
      timestamp: Date.now(),
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(dataToStore));
    console.log("✅ Firebase config saved to localStorage");
  } catch (error) {
    console.error("Error saving Firebase config to localStorage:", error);
  }
}

/**
 * Clear Firebase config from localStorage
 */
export function clearFirebaseConfigFromStorage(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
    console.log("✅ Firebase config cleared from localStorage");
  } catch (error) {
    console.error("Error clearing Firebase config from localStorage:", error);
  }
}

/**
 * Get config from environment variables
 */
export function getFirebaseConfigFromEnv(): Partial<FirebaseConfigData> {
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
 * Get effective Firebase config (priority: localStorage > env vars)
 */
export function getEffectiveFirebaseConfig(): Partial<FirebaseConfigData> {
  const stored = getFirebaseConfigFromStorage();
  if (stored && stored.firebaseApiKey && stored.firebaseProjectId) {
    return stored;
  }
  return getFirebaseConfigFromEnv();
}
