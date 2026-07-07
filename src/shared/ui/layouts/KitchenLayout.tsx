import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { LogOut, ChefHat, ToggleLeft } from 'lucide-react';

export const KitchenLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-textPearl">Kitchen Station Manager</h1>
            <p className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">{user?.tenantId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/dashboard/kitchen/menu-control" className="text-xs text-slate-400 hover:text-textPearl flex items-center space-x-2">
            <ToggleLeft className="w-4 h-4 text-emerald-500" />
            <span>Stock Settings</span>
          </Link>
          <Link to="/dashboard/kitchen" className="text-xs text-slate-400 hover:text-textPearl font-semibold">Active Orders</Link>
          
          <button 
            onClick={logout} 
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 bg-slate-950 overflow-auto p-6 relative">
        <Outlet />
      </main>
    </div>
  );
};
export default KitchenLayout;
