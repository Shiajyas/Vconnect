import React, { useState } from "react";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { img_Url } from "../../images/image";
import LoginPage from "../../customeComponents/auth/Login";
import { useNavigate } from "react-router-dom";

const AdminLoginPage: React.FC = () => {
  const { loginMutation: useAdminLoginMutation } = useAdminAuth();
  const loginMutation = useAdminLoginMutation;
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()
  
  const handleSubmit = (email: string, password: string) => {
    
    setIsLoading(true);
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          setIsLoading(false)
          navigate("/admin/dashboard");;
        },
        onError: () => setIsLoading(false),
      }
    );
  };

  return (
    <LoginPage
      role="admin"
      redirectPath="/admin/dashboard"
      title="Admin Login"
      logoUrl={img_Url}
      forgotPasswordLink="/admin/forgot-password"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      onGoogleLogin={() => {}}
    />
  );
};

export default AdminLoginPage;
