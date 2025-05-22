import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../appStore/AuthStore';

interface Props {
  children: React.ReactNode;
}

const ProUserPrivateRoute: React.FC<Props> = ({ children }) => {
  const { userRole } = useAuthContext();

  return userRole === 'proUser' ? <>{children}</> : <Navigate to="/home" replace />;
};

export default ProUserPrivateRoute;
