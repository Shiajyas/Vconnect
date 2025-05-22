import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../appStore/AuthStore';

interface Props {
  children: React.ReactNode;
}

const UserPrivateRoute: React.FC<Props> = ({ children }) => {
  const { isUserAuthenticated } = useAuthStore();
  console.log(isUserAuthenticated, 'isUserAuthenticated');
  return isUserAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default UserPrivateRoute;
