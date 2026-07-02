import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Bell, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800/40 bg-slate-950/40 backdrop-blur-md flex items-center justify-between px-6 z-20">
      <div className="flex items-center space-x-3">
        <span className="text-xs font-display font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
          Tenant: {user?.tenantId || 'SaaS Global'}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Mock Notification Bell */}
        <button className="p-2 text-mutedAsh hover:text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* User Card */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-800/60">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700/60 text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-textPearl">{user?.displayName || 'User'}</span>
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider">{role}</span>
          </div>
        </div>

        {/* Logout Toggle */}
        <button 
          onClick={logout} 
          className="p-2 text-mutedAsh hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
export default Navbar;
