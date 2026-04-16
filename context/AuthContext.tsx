import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (userData: User, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load stored token and user on startup
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        const storedUser = await AsyncStorage.getItem("auth_user");

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load auth data:", e);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const signIn = async (userData: User, authToken: string) => {
    try {
      await AsyncStorage.setItem("auth_token", authToken);
      await AsyncStorage.setItem("auth_user", JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
    } catch (e) {
      console.error("Failed to save auth data:", e);
      throw e;
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error("Failed to clear auth data:", e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
