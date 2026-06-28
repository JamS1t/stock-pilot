import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import {
  logout as apiLogout,
  refreshAccessToken,
} from "../utils/api"; // Import auth API calls

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
  updateStore: (store: Store) => void;
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
    const storedAccessToken = sessionStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");
    const storedStore = localStorage.getItem("store");
    const storedRole = localStorage.getItem("role");
    const storedMetadata = localStorage.getItem("metadata");

    const restoreSession = (
      token: string,
      userJson: string,
      storeJson: string,
      roleValue: string,
      metadataJson: string
    ) => {
      try {
        setAccessToken(token);
        setUser(JSON.parse(userJson));
        setStore(JSON.parse(storeJson));
        setRole(roleValue);
        setMetadata(JSON.parse(metadataJson));
        setIsAuthenticated(true);
      } catch {
        handleLogout();
      }
    };

    if (storedAccessToken && storedUser && storedStore && storedRole && storedMetadata) {
      restoreSession(
        storedAccessToken,
        storedUser,
        storedStore,
        storedRole,
        storedMetadata
      );
      return;
    }

    if (storedUser && storedStore && storedRole && storedMetadata) {
      refreshAccessToken()
        .then((newToken) => {
          if (newToken) {
            restoreSession(
              newToken,
              storedUser,
              storedStore,
              storedRole,
              storedMetadata
            );
          }
        })
        .catch(() => undefined);
    }
  }, []);

  const handleLogin = (authData: {
    accessToken: string;
    user: User;
    store: Store;
    role: string;
    metadata: Metadata;
  }) => {
    sessionStorage.setItem("accessToken", authData.accessToken);
    localStorage.removeItem("accessToken");
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

  const handleUpdateStore = (nextStore: Store) => {
    localStorage.setItem("store", JSON.stringify(nextStore));
    setStore(nextStore);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // console.error("Error during backend logout:", error);
    } finally {
      sessionStorage.removeItem("accessToken");
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
      updateStore: handleUpdateStore,
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
        updateStore: handleUpdateStore,
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
