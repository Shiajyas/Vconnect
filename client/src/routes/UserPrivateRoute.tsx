import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

const UserPrivateRoute: React.FC<Props> = ({ children }) => {
  const { isUserAuthenticated } = useAuthContext();

  return isUserAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default UserPrivateRoute;
