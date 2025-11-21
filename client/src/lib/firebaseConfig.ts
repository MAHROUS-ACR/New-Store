export interface FirebaseClientConfig {
  apiKey: string;
  projectId: string;
  appId: string;
}

const STORAGE_KEY = "firebase_client_config";

export function saveFirebaseConfig(config: FirebaseClientConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save Firebase config:", error);
    throw error;
  }
}

export function getFirebaseConfig(): FirebaseClientConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Try to get from environment variables (fallback)
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;
    
    if (apiKey && projectId && appId) {
      return { apiKey, projectId, appId };
    }
    
    return null;
  } catch (error) {
    console.error("Failed to get Firebase config:", error);
    return null;
  }
}

export function clearFirebaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear Firebase config:", error);
  }
}
