import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./components/auth/RegisterPage";
import OtpVerification from "./components/auth/VerifyOtpPage";
import Home from "./pages/User/Home";
import { ToastContainer } from "react-toastify";
import { useAuthContext } from "./context/AuthContext";
import ForgotPasswordPage from "./components/ForgetPwd";
import { UserLoginPage } from "./pages/User/UserLoginPage";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminDashBord from "./pages/Admin/DashBord";
import ProUserPage from "./pages/proUser/ProUserPage";
import UserPrivateRoute from "./routes/UserPrivateRoute";
import AdminPrivateRoute from "./routes/AdminPrivateRoute";
import ProUserPrivateRoute from "./routes/ProUserPrivateRoute";

const App = () => {
  const { isAdminAuthenticated, isUserAuthenticated, userRole } = useAuthContext();

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
        <Route
          path="/login"
          element={isUserAuthenticated ? <Navigate to="/home" replace /> : <UserLoginPage />}
        />
        <Route
          path="/admin/login"
          element={
            isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

        {/* Private Routes */}
        <Route
          path="/home"
          element={
            <UserPrivateRoute>
              {userRole === "proUser" ? (
                <ProUserPrivateRoute>
                  <ProUserPage />
                </ProUserPrivateRoute>
              ) : (
                <Home />
              )}
            </UserPrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminPrivateRoute>
              <AdminDashBord />
            </AdminPrivateRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                isUserAuthenticated
                  ? userRole === "proUser"
                    ? "/home"
                    : "/home"
                  : isAdminAuthenticated
                  ? "/admin/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </>
  );
};

export default App;
