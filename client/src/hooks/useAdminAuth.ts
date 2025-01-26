import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthContext } from "../context/AuthContext";


const handleMutationError = (error: any, message: string) => {
  console.error(error);
  toast.error(message || "An error occurred.");
};


const handleMutationSuccess = (
  data: any,
  queryClient: any,
  navigate: any,
  setAdminAuthenticated: any
) => {
  const { token, user } = data;
  queryClient.setQueryData(["admin"], user);
  setAdminAuthenticated(true);
  localStorage.setItem("adminToken", token);
  navigate("/admin/dashboard");
};

export const useAdminAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setAdminAuthenticated,setUserRole } = useAuthContext();

  // Query to get the admin details if authenticated
  const { data: admin, isLoading, isError } = useQuery({
    queryKey: ["admin"],
    queryFn: authService.getAdmin,
    enabled: !!localStorage.getItem("adminToken"),
    initialData: () => {
      const adminToken = localStorage.getItem("adminToken");
      return adminToken ? { token: adminToken } : null;
    },
  });

  // Login Mutation for admin authentication
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authService.login(email, password, "admin");
      return response;
    },
    onSuccess: (data) => {
      handleMutationSuccess(data, queryClient, navigate, setAdminAuthenticated);
    },
    onError: (error) => {
      handleMutationError(error, "Invalid email or password.");
    },
  });

  // OTP Verification Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, enterdOtp }: { email: string; enterdOtp: string }) => {
      const response = await authService.verifyOtp(email, enterdOtp);
      return response;
    },
    onSuccess: (data) => {
      localStorage.setItem("userToken", data.token);
      toast.success("User verified");
      queryClient.setQueryData(["user"], data.user);
      navigate("/home");
    },
    onError: (error) => {
      handleMutationError(error, "Invalid OTP. Please try again.");
    },
    retry: false,
  });

  // Logout function for admin
  const logout = async () => {
    localStorage.removeItem("adminToken");
    queryClient.setQueryData(["admin"], null);
    setUserRole(null);
    setAdminAuthenticated(false);
    navigate("/admin/login");

    authService.logout().catch((error) => {
      console.error("Logout error (background):", error);
    });
  };

  // Other mutations for OTP, password reset, etc.
  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return authService.requestOtp(email);
    },
  });

  const verifyOtpfMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      return authService.verifyOtpf(email, otp);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return authService.resetPassword(email, password);
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return authService.resendOtp(email);
    },
  });

  return {
    admin,
    isLoading,
    isError,
    loginMutation,
    logout,
    verifyOtpMutation,
    resendOtpMutation,
    resetPasswordMutation,
    verifyOtpfMutation,
    requestOtpMutation,
  };
};
