import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, logout as logoutService, getProfile } from "./services/authService";

interface AuthContextType {
  user: any;
  login: (userData: any) => void;
  logout: () => void;
  updateUser: (userData: any) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        try {
          const freshUser = await getProfile();
          setUser(freshUser);
        } catch (error: any) {
          console.error("Failed to refresh profile:", error);
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
    };
    initAuth();
  }, []);

  const login = (userData: any) => {
    setUser(userData);
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const updateUser = (userData: any) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, isAuthenticated: !!user }}>
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
