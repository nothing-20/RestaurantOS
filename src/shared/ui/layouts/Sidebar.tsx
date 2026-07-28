import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { featureFlags } from '../../../config/featureFlags';
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
  Settings,
  Sparkles,
  Target,
  History,
  ListOrdered,
  X
} from 'lucide-react';

interface ISidebarLink {
  to: string;
  label: string;
  icon: React.ComponentType<any>;
  disabled?: boolean;
}

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { role } = useAuth();

  const getLinks = (): ISidebarLink[] => {
    switch (role) {
      case 'super-admin':
        return [
          { to: '/super-admin', label: 'MRR Metrics', icon: DollarSign },
          { to: '/super-admin/tenants', label: 'Manage Tenants', icon: Server },
        ];
      case 'owner':
        const ownerLinks = [
          { to: '/dashboard/owner', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dashboard/owner/menu', label: 'Menu', icon: Menu },
          { to: '/dashboard/owner/tables', label: 'Tables', icon: QrCode },
          { to: '/dashboard/owner/staff', label: 'Staff', icon: Users },
          { to: '/dashboard/owner/billing', label: 'Billing', icon: DollarSign },
          { to: '/dashboard/owner/inventory', label: 'Inventory', icon: ClipboardList },
        ];
        
        if (featureFlags.analytics) {
          ownerLinks.push({ to: '/dashboard/owner/analytics', label: 'Analytics', icon: TrendingUp });
        }
        if (featureFlags.automation) {
          ownerLinks.push({ to: '/dashboard/owner/automation', label: 'Automation', icon: Activity });
        }
        if (featureFlags.intelligence) {
          ownerLinks.push({ to: '/dashboard/owner/intelligence', label: 'Intelligence', icon: Sparkles });
        }
        if (featureFlags.strategy) {
          ownerLinks.push({ to: '/dashboard/owner/strategy', label: 'Strategy', icon: Target });
        }
        
        return ownerLinks;
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
          { to: 'divider-waiter-1', label: '', icon: () => null },
          { to: '/dashboard/waiter/assigned-tables', label: 'My Assigned Tables', icon: QrCode },
          { to: '/dashboard/waiter/order-history', label: 'Order History', icon: History },
          { to: '/dashboard/waiter/item-history', label: 'Item History', icon: ListOrdered },
          { to: '/dashboard/waiter/performance', label: 'Waiter Performance', icon: Sparkles },
          { to: '/dashboard/waiter/timeline', label: 'Kitchen Timeline', icon: Activity },
          { to: '/dashboard/waiter/shift-report', label: 'Daily Shift Report', icon: ClipboardList },
        ];
      case 'kitchen':
        return [
          { to: '/dashboard/kitchen', label: 'Cooking Tickets', icon: ChefHat },
          { to: '/dashboard/kitchen/menu-control', label: 'Out of Stock', icon: Menu },
          { to: 'divider-1', label: '', icon: () => null },
          { to: '/dashboard/kitchen/order-history', label: 'Order History', icon: History },
          { to: '/dashboard/kitchen/item-history', label: 'Item History', icon: ListOrdered },
          { to: '/dashboard/kitchen/chef-performance', label: 'Chef Performance', icon: ChefHat },
          { to: '/dashboard/kitchen/timeline', label: 'Kitchen Timeline', icon: Activity },
          { to: 'divider-2', label: '', icon: () => null },
          { to: '/dashboard/kitchen/settings', label: 'Kitchen Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-full h-full bg-slate-950 flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/40 justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-display font-extrabold text-lg">R</span>
          </div>
          <span className="font-display font-bold text-base text-textPearl">RestaurantOS</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-slate-500 hover:text-white transition-colors lg:hidden border border-slate-850 hover:bg-slate-900"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          if (link.to.startsWith('divider-')) {
            return <hr key={link.to} className="border-slate-800/40 my-3" />;
          }
          const IconComponent = link.icon;
          if (link.disabled) {
            return (
              <div
                key={link.to + link.label}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed select-none"
                title="Coming Soon"
              >
                <IconComponent className="w-4 h-4" />
                <span>{link.label}</span>
                <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md">Soon</span>
              </div>
            );
          }
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard/owner' || link.to === '/dashboard/waiter' || link.to === '/dashboard/kitchen'}
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

      {(role === 'owner' || role === 'admin') && (
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/20">
          <NavLink 
            to="/dashboard/owner/settings"
            className={({ isActive }) => 
              `flex items-center space-x-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary text-background font-bold shadow-lg shadow-primary/10' 
                  : 'text-mutedAsh hover:text-textPearl hover:bg-slate-900/60'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
