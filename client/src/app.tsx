import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "./customeComponents/auth/RegisterPage";
import OtpVerification from "./customeComponents/auth/VerifyOtpPage";
import HomeLayout from "./pages/User/Home"; // Import HomeLayout
import { ToastContainer } from "react-toastify";
import { useAuthStore } from "./context/AuthContext";
import ForgotPasswordPage from "./customeComponents/ForgetPwd";
import { UserLoginPage } from "./pages/User/UserLoginPage";
import AdminLoginPage from "./pages/Admin/AdminLoginPage";
import AdminDashBord from "./pages/Admin/DashBord";
import AdminPrivateRoute from "./routes/AdminPrivateRoute";
import { SocketProvider } from "./features/SocketProvider";
import PostList from "@/customeComponents/home/post/PostList";
import PostDetails from "@/customeComponents/home/post/PostDetails";
import Notification from "@/customeComponents/home/Notification";
import ProfilePage from "@/customeComponents/home/profile/ProfilePage";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PostUpload from "./customeComponents/home/post/postUploadComponent";
import EditPost from "./customeComponents/home/post/EditPost";

const App = () => {
  const { isAdminAuthenticated, isUserAuthenticated } = useAuthStore();
  const queryClient = new QueryClient();

  return (
    <div className="bg-white">
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <ToastContainer />
          <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/login" element={isUserAuthenticated ? <Navigate to="/home" replace /> : <UserLoginPage />} />
            <Route path="/admin/login" element={isAdminAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

            {/* Private Routes */}
            <Route path="/home/*" element={<HomeLayout />}>
  <Route index element={<PostList />} />
  <Route path="post/:postId" element={<PostDetails />} />
  <Route path="notifications" element={<Notification />} />
  <Route path="profile/:userId" element={<ProfilePage />} />
  <Route path="create/:userId" element={<PostUpload />} />
  <Route path="edit-post/:postId" element={<EditPost />} />
</Route>

            <Route path="/admin/dashboard" element={<AdminPrivateRoute><AdminDashBord /></AdminPrivateRoute>} />

            {/* Default Route */}
            <Route path="*" element={isUserAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
          </Routes>
        </SocketProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
