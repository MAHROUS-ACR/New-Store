import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseConfig } from "./firebaseConfig";

export interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
}

interface UserContextType {
  user: User | null;
  signup: (email: string, password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: string) => void;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const defaultUserValue: UserContextType = {
  user: null,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  setRole: () => {},
  isLoggedIn: false,
  isLoading: true,
};

const UserContext = createContext<UserContextType>(defaultUserValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseAuth, setFirebaseAuth] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);

  useEffect(() => {
    // Initialize Firebase
    const config = getFirebaseConfig();
    if (config) {
      try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        const db = getFirestore(app);
        setFirebaseAuth(auth);
        setFirestore(db);

        // Listen to Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            // User is signed in - fetch user data from Firestore
            try {
              const userRef = doc(db, "users", firebaseUser.uid);
              const userSnap = await getDoc(userRef);
              
              let role = "user"; // default role
              
              if (userSnap.exists()) {
                const firestoreData = userSnap.data();
                role = firestoreData.role || "user";
              }
              
              const userData: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                username: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
                role: role,
              };
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            } catch (error) {
              console.error("Failed to fetch user data from Firestore:", error);
              // Fallback to stored user data
              const storedUser = localStorage.getItem("user");
              const storedRole = storedUser ? JSON.parse(storedUser).role : "user";
              
              const userData: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || "",
                username: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
                role: storedRole,
              };
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            }
          } else {
            // User is signed out
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
    if (!firestore) throw new Error("Firestore not configured");

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const firebaseUser = userCredential.user;

    // Create user document in Firestore with default role
    try {
      await setDoc(doc(firestore, "users", firebaseUser.uid), {
        email: firebaseUser.email,
        username: username,
        role: "user", // default role for new users
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to create user document in Firestore:", error);
    }

    // User data is automatically set via onAuthStateChanged
    console.log("User created with Firebase Auth:", firebaseUser.uid);
  };

  const login = async (email: string, password: string) => {
    if (!firebaseAuth) throw new Error("Firebase not configured");

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    
    // User data is automatically set via onAuthStateChanged
    console.log("User signed in with Firebase Auth:", userCredential.user.uid);
  };

  const logout = async () => {
    if (!firebaseAuth) throw new Error("Firebase not configured");
    await signOut(firebaseAuth);
    localStorage.removeItem("orders");
  };

  const setRole = (role: string) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        setRole,
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
