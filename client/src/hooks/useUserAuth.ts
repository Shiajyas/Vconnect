import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';

const handleMutationError = (error: any, message: string) => {
  console.error(error);
  if (error.msg == 'Too many login attempts from this IP, please try again later.') {
    toast.error(error.msg);
  } else {
    toast.error(message || 'An error occurred.');
  }
};

// Default function to manage success for mutations
const handleMutationSuccess = (data: any, queryClient: any, navigate: any, setUser: any) => {
  const { user } = data;
  queryClient.setQueryData(['user'], user);
  setUser(user); // Setting user in context
  navigate('/home');
};

export const useUserAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setUser, isUserAuthenticated } = useAuthStore();

  // Query to get user details if authenticated
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['user'],
    queryFn: authService.getUser,
    enabled: !!isUserAuthenticated,
  });

  // Mutation for user login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authService.login(email, password, 'user');
      return response;
    },
    onSuccess: (data) => {
      console.log('Login successful, navigating to /home');
      handleMutationSuccess(data, queryClient, navigate, setUser);
      queryClient.invalidateQueries({ queryKey: ['user'] }); // Invalidate user query to ensure it's up-to-date
    },
    onError: (error) => handleMutationError(error, error.message),
  });

  // Mutation for OTP verification
  const verifyOtpMutation = useMutation({
    mutationFn: async ({ email, enterdOtp }: { email: string; enterdOtp: string }) => {
      const response = await authService.verifyOtp(email, enterdOtp);
      return response;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(['user'], data.user);

      setUser(data.user);
      toast.success('User verified');
      navigate('/home');
    },
    onError: (error) => handleMutationError(error, 'Invalid OTP. Please try again.'),
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
      queryClient.setQueryData(['userEmail'], { email: responseData.email });
      toast.success('Registration successful! Please verify your OTP.');
    },
    onError: (error: any) => {
      handleMutationError(error, 'An error occurred during registration.');
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await authService.googleAuth(userData);
      console.log('Response from backend:', response); // Log the response to check the structure
      return response;
    },
    onSuccess: (data) => {
      console.log(data.user._id, '>>>>>>>>>>>>>>>');
      socket.emit('joinUser', data.user._id);
      handleMutationSuccess(data, queryClient, navigate, setUser);
      toast.success('User verified');
    },
    onError: (error) => {
      console.log(error);
      toast.error('Google login failed');
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
    verifyOtpMutation,
    resendOtpMutation,
    resetPasswordMutation,
    verifyOtpfMutation,
    requestOtpMutation,
    registerMutation,
    isOtpLoading,
    googleAuthMutation,
  };
};
