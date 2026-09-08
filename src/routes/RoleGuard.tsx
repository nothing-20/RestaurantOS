import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

interface IRoleGuardProps {
  allowedRoles: string[];
}

export const RoleGuard: React.FC<IRoleGuardProps> = ({ allowedRoles }) => {
  const { role: authRole, isLoading: isAuthLoading } = useAuth();
  const { workspace } = useWorkspace();

  const currentRole = authRole || workspace?.role;

  if (isAuthLoading) {
    return null;
  }

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    console.warn(`[RoleGuard] Access denied for role "${currentRole}". Allowed:`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
