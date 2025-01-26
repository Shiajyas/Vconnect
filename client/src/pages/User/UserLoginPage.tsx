import React, { useState } from "react";
import LoginPage from "../../components/auth/Login";
// import { useUserLoginMutation } from "../../hooks/useAuth";
// import { useAuth } from "../../hooks/useAuth";
import { useUserAuth } from "../../hooks/useUserAuth";
import { img_Url } from "../../images/image";

export const UserLoginPage: React.FC = () => {

   const {loginMutation :useUserLoginMutation} = useUserAuth()

  const loginMutation = useUserLoginMutation;
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (email: string, password: string) => {
    setIsLoading(true);
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => setIsLoading(false),
        onError: () => setIsLoading(false),
      }
    );
  };

  return (
    <LoginPage
      role="user"
      redirectPath="/home"
      title="User Login"
      logoUrl={img_Url}
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
