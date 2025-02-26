import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./customeComponents/auth/RegisterPage";
import OtpVerification from "./customeComponents/auth/VerifyOtpPage";
import Home from "./pages/User/Home";
import { ToastContainer } from "react-toastify";
import { useAuthStore } from "./context/AuthContext";
import ForgotPasswordPage from "./customeComponents/ForgetPwd";
import { UserLoginPage } from "./pages/User/UserLoginPage";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminDashBord from "./pages/Admin/DashBord";
import UserPrivateRoute from "./routes/UserPrivateRoute";
import AdminPrivateRoute from "./routes/AdminPrivateRoute";
import { SocketProvider } from "./features/SocketProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";



const App = () => {
  const { isAdminAuthenticated, isUserAuthenticated} = useAuthStore();
  const queryClient = new QueryClient();

  return (
    <div className=" bg-white">
      
    <QueryClientProvider client={queryClient}>
    <SocketProvider>
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
           
              <Home />
            
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

        {/* Default Route (catch-all) */}
        <Route
          path="*"
          element={
            isUserAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
      </SocketProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
