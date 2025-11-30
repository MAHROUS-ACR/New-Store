export interface FirebaseClientConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
}

const STORAGE_KEY = "firebase_client_config";

export function saveFirebaseConfig(config: FirebaseClientConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {

    throw error;
  }
}

export function getFirebaseConfig(): FirebaseClientConfig | null {
  try {
    // Priority order:
    // 1. Check localStorage (user-saved config takes precedence)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only return if all required fields exist
      if (parsed.apiKey && parsed.projectId && parsed.appId) {
        return parsed;
      }
    }
    
    // 2. Fall back to environment variables (default config)
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
    const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    
    if (apiKey && projectId && appId) {
      return { 
        apiKey, 
        projectId, 
        appId,
        authDomain,
        storageBucket,
        messagingSenderId,
        measurementId
      };
    }
    
    return null;
  } catch (error) {

    return null;
  }
}

export function clearFirebaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {

  }
}
