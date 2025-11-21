import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { getFirebaseConfig } from "./firebaseConfig";

export interface User {
  id: string;
  firebaseUid: string;
  email: string;
  username: string;
}

interface UserContextType {
  user: User | null;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const defaultUserValue: UserContextType = {
  user: null,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  isLoggedIn: false,
  isLoading: true,
};

const UserContext = createContext<UserContextType>(defaultUserValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseAuth, setFirebaseAuth] = useState<any>(null);

  useEffect(() => {
    // Initialize Firebase
    const config = getFirebaseConfig();
    if (config) {
      try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        setFirebaseAuth(auth);

        // Try to restore user from localStorage first
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            setIsLoading(false);
          } catch (error) {
            console.error("Failed to parse saved user:", error);
          }
        }

        // Restore user from localStorage if available
        setIsLoading(false);
        
        // Listen to auth state changes as backup
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          // Just track auth state, don't fetch user (already in localStorage)
          if (!firebaseUser && !savedUser) {
            setUser(null);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const signup = async (email: string, password: string, username: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured");

    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const firebaseUser = userCredential.user;

    // Save to database via server
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      throw new Error("Failed to create user");
    }

    const userData = await response.json();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const login = async (email: string, password: string) => {
    // Use server-side login for simplicity
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const userData = await response.json();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Also log in with Firebase to set authentication state
    if (firebaseAuth) {
      try {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      } catch (error) {
        console.warn("Firebase signin skipped (server-only auth):", error);
      }
    }
  };

  const logout = async () => {
    if (!firebaseAuth) throw new Error("Firebase not configured");
    await signOut(firebaseAuth);
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("orders");
  };

  return (
    <UserContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        isLoggedIn: !!user,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
