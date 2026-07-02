import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicRoute: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-primary animate-spin" />
        <span className="text-mutedAsh text-sm font-medium">Loading session...</span>
      </div>
    );
  }

  // If already authenticated, redirect to appropriate role dashboard
  if (user && role) {
    if (role === 'super-admin') {
      return <Navigate to="/super-admin" replace />;
    }
    return <Navigate to={`/dashboard/${role}`} replace />;
  }

  return <Outlet />;
};
export default PublicRoute;
