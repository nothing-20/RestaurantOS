import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Menu, 
  Users, 
  QrCode, 
  Activity, 
  DollarSign, 
  ChefHat, 
  ClipboardList, 
  TrendingUp, 
  Server, 
  Settings 
} from 'lucide-react';

interface ISidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
}

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const getLinks = (): ISidebarLink[] => {
    switch (role) {
      case 'super-admin':
        return [
          { to: '/super-admin', label: 'MRR Metrics', icon: DollarSign },
          { to: '/super-admin/tenants', label: 'Manage Tenants', icon: Server },
        ];
      case 'owner':
        return [
          { to: '/dashboard/owner', label: 'Performance', icon: LayoutDashboard },
          { to: '/dashboard/owner/menu', label: 'Menu Editor', icon: Menu },
          { to: '/dashboard/owner/staff', label: 'Manage Staff', icon: Users },
          { to: '/dashboard/owner/tables', label: 'QR Generators', icon: QrCode },
          { to: '/dashboard/owner/billing', label: 'SaaS Subscription', icon: DollarSign },
        ];
      case 'admin':
        return [
          { to: '/dashboard/admin', label: 'Analytics', icon: LayoutDashboard },
          { to: '/dashboard/owner/menu', label: 'Menu Editor', icon: Menu },
          { to: '/dashboard/admin/logs', label: 'System Logs', icon: Activity },
        ];
      case 'waiter':
        return [
          { to: '/dashboard/waiter', label: 'Tables Matrix', icon: LayoutDashboard },
          { to: '/dashboard/waiter/alerts', label: 'Customer Alerts', icon: ClipboardList },
        ];
      case 'kitchen':
        return [
          { to: '/dashboard/kitchen', label: 'Cooking Tickets', icon: ChefHat },
          { to: '/dashboard/kitchen/menu-control', label: 'Out of Stock', icon: Menu },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800/40 flex flex-col z-20">
      {/* Brand logo container */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-display font-extrabold text-lg">R</span>
          </div>
          <span className="font-display font-bold text-base text-textPearl">RestaurantOS</span>
        </div>
      </div>

      {/* Navigation menu list */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const IconComponent = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => `
                flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${isActive 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary' 
                  : 'text-mutedAsh hover:text-textPearl hover:bg-slate-900/60'
                }
              `}
            >
              <IconComponent className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Settings options */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-950/20">
        <button className="flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-mutedAsh hover:text-textPearl hover:bg-slate-900/60 transition-all">
          <Settings className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;
