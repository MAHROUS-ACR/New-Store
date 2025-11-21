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

        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            try {
              // Fetch user data from server
              const response = await fetch("/api/auth/me", {
                headers: {
                  "x-firebase-uid": firebaseUser.uid,
                },
              });
              if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                localStorage.setItem("user", JSON.stringify(userData));
              } else if (!savedUser) {
                // If fetch fails and no saved user, clear state
                setUser(null);
              }
            } catch (error) {
              console.error("Failed to fetch user:", error);
              // Keep saved user if fetch fails
              if (!savedUser) {
                setUser(null);
              }
            }
          } else {
            setUser(null);
            localStorage.removeItem("user");
          }
          setIsLoading(false);
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
    if (!firebaseAuth) throw new Error("Firebase not configured");

    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const firebaseUser = userCredential.user;
    
    if (firebaseUser) {
      try {
        const response = await fetch("/api/auth/me", {
          headers: {
            "x-firebase-uid": firebaseUser.uid,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          console.error("Failed to fetch user data:", response.status);
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
      } catch (error) {
        console.error("Login fetch error:", error);
        throw error;
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
