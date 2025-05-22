import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../appStore/AuthStore';

interface Props {
  children: React.ReactNode;
}

const AdminPrivateRoute: React.FC<Props> = ({ children }) => {
  const { isAdminAuthenticated } = useAuthStore();
  console.log(isAdminAuthenticated, 'isAdminAuthenticated');
  return isAdminAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default AdminPrivateRoute;
