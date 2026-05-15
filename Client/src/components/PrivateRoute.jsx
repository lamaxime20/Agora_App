import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = JSON.parse(localStorage.getItem('user'))?.role; // Supposons que vous stockez l'utilisateur

  if (!token) {
    return <Navigate to="/connexion" />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/connexion" />;
  }

  return children;
};

export default PrivateRoute;