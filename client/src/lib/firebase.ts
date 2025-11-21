import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseConfig } from "./firebaseConfig";

let app: any = null;
let auth: any = null;

export function initializeFirebaseAuth() {
  try {
    const config = getFirebaseConfig();
    if (!config) {
      console.warn("Firebase config not available");
      return null;
    }

    const firebaseConfig = {
      apiKey: config.apiKey,
      authDomain: `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: `${config.projectId}.firebasestorage.app`,
      appId: config.appId,
    };

    if (!app) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    }
    return auth;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    return null;
  }
}

export function getFirebaseAuth() {
  if (!auth) {
    return initializeFirebaseAuth();
  }
  return auth;
}

export async function signInWithGoogle() {
  try {
    const authInstance = getFirebaseAuth();
    if (!authInstance) throw new Error("Firebase not initialized");

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(authInstance, provider);
    return result.user;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    const authInstance = getFirebaseAuth();
    if (!authInstance) throw new Error("Firebase not initialized");
    await signOut(authInstance);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

export function onAuthStateChange(callback: (user: any) => void) {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    callback(null);
    return;
  }

  return authInstance.onAuthStateChanged((user: any) => {
    callback(user);
  });
}
