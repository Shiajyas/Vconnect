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

// Default function to manage success for mutations
const handleMutationSuccess = (
  data: any,
  queryClient: any,
  navigate: any,
  setUserAuthenticated: any
) => {
  const { token, user } = data;
  queryClient.setQueryData(["user"], user);
  setUserAuthenticated(true);
  localStorage.setItem("userToken", token);
  navigate("/home");
};


export const useUserAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setUserAuthenticated,setUserRole } = useAuthContext();

  // Query to get user details if authenticated
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["user"],
    queryFn: authService.getUser,
    enabled: !!localStorage.getItem("userToken"),
    initialData: () => {
      const userToken = localStorage.getItem("userToken");
      return userToken ? { token: userToken } : null;
    },
  });

  // Mutation for user login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authService.login(email, password, "user");
      return response; 
    },
    onSuccess: (data) => handleMutationSuccess(data, queryClient, navigate, setUserAuthenticated),
    onError: (error) => handleMutationError(error, "Invalid email or password."),
  });

  // Logout function
  const logout =  () => {
    localStorage.removeItem("userToken");
    queryClient.setQueryData(["user"], null);
    setUserRole(null);
    setUserAuthenticated(false); 
    navigate("/login");
    authService.logout().catch((error) => {
      console.error("Logout error (background):", error);
    });
  };

  // Mutation for OTP verification
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, enterdOtp }: { email: string; enterdOtp: string }) => {
      const response = await authService.verifyOtp(email, enterdOtp);
      return response;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["user"], data.user);
      setUserAuthenticated(true);
      localStorage.setItem("userToken", data.token);
      toast.success("User verified");
      navigate("/home");
    },
    onError: (error) => handleMutationError(error, "Invalid OTP. Please try again."),
    retry: false,
  });

  // Other mutations like requesting OTP, resetting password, etc.
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

  // Mutation for user registration
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      fullname: string;
      username: string;
      email: string;
      password: string;
      confirmPassword: string;
      gender: string;
    }) => {
      const data = await authService.register(userData);
      return data; // Return parsed data directly
    },
    onSuccess: (responseData) => {
      queryClient.setQueryData(["userEmail"], { email: responseData.email });
      toast.success("Registration successful! Please verify your OTP.");
    },
    onError: (error: any) => {
      handleMutationError(error, "An error occurred during registration.");
    },
  });
  const googleAuthMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await authService.googleAuth(userData);
      console.log("Response from backend:", response); // Log the response to check the structure
      return response
    },
    onSuccess: (data) => {
      console.log(data, ">>>>>>>>>>>>>>>");
      queryClient.setQueryData(["user"], data.user);
      setUserAuthenticated(true);
      localStorage.setItem("userToken", data.token);
      toast.success("User verified");
      navigate("/home");
    },
    onError: (error) => {
      console.log(error);
      
      toast.error("Google login failed");
    },
  });
  
  const { isPending: isRegisterLoading } = registerMutation;
  const { isPending: isOtpLoading } = verifyOtpMutation;

 
  return {
    user,
    isLoading,
    isError,
    isRegisterLoading,
    loginMutation,
    logout,
    verifyOtpMutation,
    resendOtpMutation,
    resetPasswordMutation,
    verifyOtpfMutation,
    requestOtpMutation,
    registerMutation,
    isOtpLoading,
    googleAuthMutation
  
  };
};
