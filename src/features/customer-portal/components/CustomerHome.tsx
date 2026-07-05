import React from 'react';
import { Navigate } from 'react-router-dom';

export const CustomerHome: React.FC = () => {
  return <Navigate to="/customer/restaurants" replace />;
};

export default CustomerHome;
