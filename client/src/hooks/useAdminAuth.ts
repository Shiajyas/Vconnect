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

const handleMutationSuccess = async (
  data: any,
  queryClient: any,

  setAdmin: any,

) => {
  const { token, user } = data;
  console.log(data,token,">>>>>123");
  
  localStorage.setItem("adminToken", token);

  queryClient.setQueryData(["admin"], user);

  
  setAdmin(user, token);

  await queryClient.invalidateQueries({ queryKey: ["admin"] });
  await queryClient.refetchQueries({ queryKey: ["admin"] });


};

export const useAdminAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setAdminAuthenticated, setAdmin } = useAuthContext();

  const { data: admin, isLoading, isError } = useQuery({
    queryKey: ["admin"],
    queryFn: authService.getAdmin,
    enabled: !!localStorage.getItem("adminToken"), // Ensures query runs only if token exists
    staleTime: 0, // Forces a fresh data fetch on every login
  
    retry: false, // Avoids unnecessary retries
  });

  // Login Mutation for Admin Authentication
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authService.login(email, password, "admin");
      return response;
    },
    onSuccess: (data) => {
      setAdminAuthenticated(true);
      handleMutationSuccess(data, queryClient, setAdmin,);
    },
    onError: (error) => {
      setAdminAuthenticated(false);
      handleMutationError(error, "Invalid email or password.");
    },
  });

  
  const logout = async () => {
    localStorage.removeItem("adminToken");
    queryClient.setQueryData(["admin"], null);

    // ✅ Reset Auth Context
    setAdmin(null, null);
    setAdminAuthenticated(false);

   
    navigate("/admin/login");

    authService.logout().catch((error) => {
      console.error("Logout error (background):", error);
    });
  };

  // Other auth operations (OTP, password reset)
  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => authService.requestOtp(email),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, enterdOtp }: { email: string; enterdOtp: string }) =>
      authService.verifyOtp(email, enterdOtp),
    onSuccess: (data) => {
      localStorage.setItem("adminToken", data.token);
      toast.success("Admin verified");
      queryClient.setQueryData(["admin"], data.user);
      navigate("/admin/dashboard");
    },
    onError: (error) => handleMutationError(error, "Invalid OTP. Please try again."),
  });

  const verifyOtpfMutation = useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) =>
      authService.verifyOtpf(email, otp),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) =>
      authService.resetPassword(email, password),
  });

  const resendOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => authService.resendOtp(email),
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
