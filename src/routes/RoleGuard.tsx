import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

interface IRoleGuardProps {
  allowedRoles: string[];
}

export const RoleGuard: React.FC<IRoleGuardProps> = ({ allowedRoles }) => {
  const { workspace } = useWorkspace();
  const currentRole = workspace?.role;

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return <Navigate to="/workspace-error?type=unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleGuard;
