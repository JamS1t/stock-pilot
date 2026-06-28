import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { logout as apiLogout } from "../utils/api"; // Import logout API call

// Interfaces
interface User {
  user_id: number;
  email: string;
  name: string;
  picture?: string;
}

interface Store {
  store_id: number;
  name?: string;
  store_name?: string;
  timezone: string;
  currency: string;
}

interface Metadata {
  joined_at: string;
  last_updated: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: User | null;
  store: Store | null;
  role: string | null;
  metadata: Metadata | null;
  login: (authData: {
    accessToken: string;
    user: User;
    store: Store;
    role: string;
    metadata: Metadata;
  }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata | null>(null);

  // Load stored auth data on mount
  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    const storedStore = localStorage.getItem("store");
    const storedRole = localStorage.getItem("role");
    const storedMetadata = localStorage.getItem("metadata");

    if (storedAccessToken && storedUser && storedStore && storedRole && storedMetadata) {
      try {
        setAccessToken(storedAccessToken);
        setUser(JSON.parse(storedUser));
        setStore(JSON.parse(storedStore));
        setRole(storedRole);
        setMetadata(JSON.parse(storedMetadata));
        setIsAuthenticated(true);
      } catch {
        handleLogout();
      }
    }
  }, []);

  const handleLogin = (authData: {
    accessToken: string;
    user: User;
    store: Store;
    role: string;
    metadata: Metadata;
  }) => {
    localStorage.setItem("accessToken", authData.accessToken);
    localStorage.setItem("user", JSON.stringify(authData.user));
    localStorage.setItem("store", JSON.stringify(authData.store));
    localStorage.setItem("role", authData.role);
    localStorage.setItem("metadata", JSON.stringify(authData.metadata));

    setAccessToken(authData.accessToken);
    setUser(authData.user);
    setStore(authData.store);
    setRole(authData.role);
    setMetadata(authData.metadata);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // console.error("Error during backend logout:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("store");
      localStorage.removeItem("role");
      localStorage.removeItem("metadata");

      setAccessToken(null);
      setUser(null);
      setStore(null);
      setRole(null);
      setMetadata(null);
      setIsAuthenticated(false);
    }
  };

  // 🔹 Sync global reference for access in api.ts
  useEffect(() => {
    authContextValue = {
      isAuthenticated,
      accessToken,
      user,
      store,
      role,
      metadata,
      login: handleLogin,
      logout: handleLogout,
    };
  }, [isAuthenticated, accessToken, user, store, role, metadata]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        user,
        store,
        role,
        metadata,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
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

// 🔹 Global accessor for api.ts
let authContextValue: AuthContextType | null = null;

export const getAuthContext = (): AuthContextType => {
  if (!authContextValue) {
    throw new Error("AuthContext not initialized yet.");
  }
  return authContextValue;
};
