import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardRoute } from '../utils/navigation';

export const AdminGuard: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-primary animate-spin" />
        <span className="text-mutedAsh text-sm font-medium">Validating admin clearance...</span>
      </div>
    );
  }

  if (!user || !role) {
    return <Navigate to="/staff/login" replace />;
  }

  if (role !== 'super-admin') {
    const destination = getDashboardRoute(role);
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
