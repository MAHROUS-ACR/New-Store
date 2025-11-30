import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

export async function setupFirebaseSettingsFromEnv() {
  try {
    const db = getFirestore();
    
    // Check if settings already exist in Firestore
    const firebaseConfigRef = doc(db, "settings", "firebase");
    const existingConfig = await getDoc(firebaseConfigRef);
    
    // Only write env variables if no settings exist yet (first time setup)
    if (!existingConfig.exists()) {
      const firebaseSettings = {
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
        firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
        firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID || "",
        firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
        firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
        firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
        firebaseMeasurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
        updatedAt: new Date(),
      };

      // Save to Firestore only if it doesn't exist
      await setDoc(firebaseConfigRef, firebaseSettings);
    }
    // If settings exist, don't overwrite - user's custom settings are preserved

    return true;
  } catch (error) {

    return false;
  }
}
