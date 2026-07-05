import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

export const WorkspaceGuard: React.FC = () => {
  const { workspace, isLoading, validationError } = useWorkspace();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6 select-none relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />

        <div className="relative flex flex-col items-center space-y-4 z-10">
          {/* Glowing Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-slate-900" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-primary/50 animate-reverse-spin" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-sm font-display font-extrabold text-textPearl tracking-wider uppercase">Workspace Validation</h3>
            <span className="text-[11px] text-slate-500 font-semibold animate-pulse">Preparing your workspace...</span>
          </div>
        </div>

        {/* CSS styles to handle reverse spin and general animation details */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes reverse-spin {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-reverse-spin {
            animation: reverse-spin 1.5s linear infinite;
          }
        `}} />
      </div>
    );
  }

  // Redirect to workspace error if validation has failed
  if (validationError) {
    const isOwner = workspace?.role === 'owner';
    if (validationError === 'subscription-expired' && isOwner) {
      const currentPath = window.location.pathname;
      if (currentPath === '/dashboard/owner/billing') {
        return <Outlet />;
      } else {
        return <Navigate to="/dashboard/owner/billing" replace />;
      }
    }
    return <Navigate to={`/workspace-error?type=${validationError}`} replace />;
  }

  // Fallback check: if no workspace has been generated
  if (!workspace || !workspace.isValid) {
    return <Navigate to="/staff/login" replace />;
  }

  return <Outlet />;
};

export default WorkspaceGuard;
