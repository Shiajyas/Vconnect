import React, { createContext, useContext, useEffect, useState } from "react";
import { decodeToken } from "../utils/authHelpers";
import { authService } from "@/services/authService";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  admin: User | null;
  token: string | null;
  adminToken: string | null;  
  isUserAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  userRole: string | null;
  adminRole: string | null;
  setUserAuthenticated: (value: boolean, role?: string, token?: string) => void;
  setAdminAuthenticated: (value: boolean, role?: string, token?: string) => void;
  setUser: (user: User | null, token: string | null) => void;
  setAdmin: (admin: User | null, token: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const decodeTokenSafely = (token: string | null): string | null => {
    try {
      let decoded = token ? (decodeToken(token) as { role: string }) : null;
      return decoded ? decoded.role : null;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  };

  // Load data from localStorage
  const storedUser = localStorage.getItem("user");
  const storedAdmin = localStorage.getItem("admin");
  const storedToken = localStorage.getItem("userToken");
  const storedAdminToken = localStorage.getItem("adminToken");

  const [isUserAuthenticated, setIsUserAuthenticated] = useState(!!storedToken);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem("adminToken"); 
  });
  const [userRole, setUserRoleState] = useState<string | null>(decodeTokenSafely(storedToken));
  const [adminRole, setAdminRoleState] = useState<string | null>(decodeTokenSafely(storedAdminToken));

  const [user, setUserState] = useState<User | null>(storedUser ? JSON.parse(storedUser) : null);
  const [admin, setAdminState] = useState<User | null>(storedAdmin ? JSON.parse(storedAdmin) : null);

  const [token, setToken] = useState<string | null>(storedToken);
  const [adminToken, setAdminToken] = useState<string | null>(storedAdminToken);

  // Function to handle user authentication state
  const setUserAuthenticated = (value: boolean, role?: string, token?: string) => {
    if (value && role && token) {
      localStorage.setItem("userToken", token);
      localStorage.setItem("userRole", role);
      setIsUserAuthenticated(true);
      setUserRoleState(role);
      setToken(token);
    } else {
      localStorage.removeItem("userToken");
      localStorage.removeItem("userRole");
      setIsUserAuthenticated(false);
      setUserRoleState(null);
      setToken(null);
    }
  };

  // Function to handle admin authentication state
  const setAdminAuthenticated = (value: boolean, role?: string, token?: string) => {
    if (value && role && token) {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", role);
      setIsAdminAuthenticated(true);
      setAdminRoleState(role);
      setAdminToken(token);
    } else {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
      setIsAdminAuthenticated(false);
      setAdminRoleState(null);
      setAdminToken(null);
    }
  };

  // Set user/admin separately
  const setUser = (user: User | null, token: string | null) => {
    if (user && token) {
      localStorage.setItem("userToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      setToken(token);
      setUserState(user);
    } else {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      setToken(null);
      setUserState(null);
    }
  };

  const setAdmin = (admin: User | null, token: string | null) => {
    if (admin && token) {
      localStorage.setItem("adminToken", token);
      localStorage.setItem("admin", JSON.stringify(admin));
      setAdminToken(token);
      setAdminState(admin);
    } else {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      setAdminToken(null);
      setAdminState(null);
    }
  };

  // Logout function
  const logout = (role?: "user" | "admin") => {
    if (role === "admin") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin");
      localStorage.removeItem("adminRole");
      setIsAdminAuthenticated(false);
      setAdminRoleState(null);
      setAdminToken(null);
      setAdminState(null);
    } else {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      setIsUserAuthenticated(false);
      setUserRoleState(null);
      setToken(null);
      setUserState(null);
    }
  
    authService.logout().catch((error) => {
      console.error("Logout error (background):", error);
    });
  };
  

  useEffect(() => {
    const handleStorageChange = () => {
      const userToken = localStorage.getItem("userToken");
      const adminToken = localStorage.getItem("adminToken");

      setIsUserAuthenticated(!!userToken);
      setIsAdminAuthenticated(!!adminToken);

      setUserRoleState(decodeTokenSafely(userToken));
      setAdminRoleState(decodeTokenSafely(adminToken));

      setToken(userToken);
      setAdminToken(adminToken);

      setUserState(userToken ? JSON.parse(localStorage.getItem("user") || "{}") : null);
      setAdminState(adminToken ? JSON.parse(localStorage.getItem("admin") || "{}") : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        token,
        adminToken,
        isUserAuthenticated,
        isAdminAuthenticated,
        userRole,
        adminRole,
        setUserAuthenticated,
        setAdminAuthenticated,
        setUser,
        setAdmin,
        logout,
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
