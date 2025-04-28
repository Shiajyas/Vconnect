import React, { useState, useEffect } from "react";
import LoginPage from "../../customeComponents/auth/Login";
import { useUserAuth } from "../../hooks/useUserAuth";
import { socket } from "@/utils/Socket"; // Import the socket instance

export const UserLoginPage: React.FC = () => {
  const { loginMutation: useUserLoginMutation } = useUserAuth();
  const loginMutation = useUserLoginMutation;
  const [isLoading, setIsLoading] = useState(false);



  const handleSubmit = (email: string, password: string) => {
    setIsLoading(true);
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setIsLoading(false);
            
          const userId = data?.user?._id;
          console.log("userId",userId)
          if (userId) {
            console.log(`🔌 Emitting "joinUser" event for user ID: ${userId}`);
            // socket.emit("joinUser", userId);
          } else {
            console.warn("⚠️ No user ID received.");
          }
        },
        onError: () => setIsLoading(false),
      }
    );
  };

  return (
    <LoginPage
      role="user"
      redirectPath="/home"
      title="User Login"
      logoUrl="/logo.png"
      forgotPasswordLink="/forgot-password"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      onGoogleLogin={() => {
        // Handle Google login here
      }}
    />
  );
};

export default UserLoginPage;
