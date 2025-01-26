import React, { createContext, useContext, useEffect, useState } from "react";
import { decodeToken } from "../utils/authHelpers";

interface AuthContextType {
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  userRole: string | null;
  setUserAuthenticated: (value: boolean, role?: string) => void;
  setAdminAuthenticated: (value: boolean) => void;
  setUserRole: (role: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const decodeTokenSafely = (token: string | null): string | null => {
    try {
      return token ? decodeToken(token) : null;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(
    !!localStorage.getItem("userToken")
  );
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    !!localStorage.getItem("adminToken")
  );
  const [userRole, setUserRoleState] = useState<string | null>(
    decodeTokenSafely(localStorage.getItem("userToken"))
  );

  const setUserAuthenticated = (value: boolean, role?: string) => {
    if (value && role) {
      localStorage.setItem("userToken", "dummyUserToken");
      localStorage.setItem("userRole", role);
      setIsUserAuthenticated(true);
      setUserRoleState(role);
    } else {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userRole");
      setIsUserAuthenticated(false);
      setUserRoleState(null);
    }
  };

  const setAdminAuthenticated = (value: boolean) => {
    if (value) {
      localStorage.setItem("adminToken", "dummyAdminToken");
      setIsAdminAuthenticated(true);
    } else {
      localStorage.removeItem("adminToken");
      setIsAdminAuthenticated(false);
    }
  };

  const setUserRole = (role: string | null) => {
    if (role) {
      localStorage.setItem("userRole", role);
    } else {
      localStorage.removeItem("userRole");
    }
    setUserRoleState(role);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const userToken = localStorage.getItem("userToken");
      const adminToken = localStorage.getItem("adminToken");

      setIsUserAuthenticated(!!userToken);
      setIsAdminAuthenticated(!!adminToken);

      if (userToken) {
        setUserRoleState(decodeTokenSafely(userToken));
      } else {
        setUserRoleState(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isUserAuthenticated,
        isAdminAuthenticated,
        userRole,
        setUserAuthenticated,
        setAdminAuthenticated,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
