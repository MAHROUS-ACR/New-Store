import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface User {
  id: string;
  username: string;
}

interface UserContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const defaultUserValue: UserContextType = {
  user: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: false,
};

const UserContext = createContext<UserContextType>(defaultUserValue);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
    }
  }, []);

  const login = (username: string) => {
    const newUser = { id: `user_${Date.now()}`, username };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("orders");
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
