/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import CustomerMenu from "./pages/CustomerMenu";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Locations from "./pages/Locations";
import OrderStatus from "./pages/OrderStatus";
import Checkout from "./pages/Checkout";
import ProfilePage from "./pages/ProfilePage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import { AuthProvider } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider, useTheme, type ThemeScope } from "./ThemeContext";
import { LocationProvider } from "./LocationContext";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "sonner";

function ThemeManager() {
  const location = useLocation();
  const { themes } = useTheme();

  useEffect(() => {
    let scope: ThemeScope = 'customer';
    if (location.pathname.startsWith('/admin')) {
      scope = 'admin';
    } else if (location.pathname.startsWith('/staff')) {
      scope = 'staff';
    }

    const theme = themes[scope];
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [location.pathname, themes]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <LocationProvider>
            <LanguageProvider>
              <ThemeProvider>
              <ThemeManager />
              <Toaster position="top-right" richColors />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<CustomerMenu />} />
                <Route path="/menu/:tableId" element={<CustomerMenu />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/order-status/:orderId" element={<OrderStatus />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager", "cashier", "barista", "customer"]}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager", "cashier", "barista", "customer"]}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Admin/Manager Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager", "cashier", "barista"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Staff Routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager", "cashier", "barista"]}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ThemeProvider>
          </LanguageProvider>
        </LocationProvider>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  );
}

