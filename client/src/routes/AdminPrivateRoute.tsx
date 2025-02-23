import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

interface Props {
  children: React.ReactNode;
}

const AdminPrivateRoute: React.FC<Props> = ({ children }) => { 
  

  return <>{children}</>;


};

export default AdminPrivateRoute;

