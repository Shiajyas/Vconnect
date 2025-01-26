import React, { useState } from "react";
import LoginPage from "../../components/auth/Login";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import { img_Url } from "../../images/image";

const AdminLoginPage: React.FC = () => {
  const {loginMutation: useAdminLoginMutation} = useAdminAuth()
  const loginMutation = useAdminLoginMutation;
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
      role="admin"
      redirectPath = "/admin/dashboard"
      title="Admin Login"
      logoUrl={img_Url}
      forgotPasswordLink="/admin/forgot-password"
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
};

export default AdminLoginPage;
