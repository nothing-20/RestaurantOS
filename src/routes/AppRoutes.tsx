import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Import newly created Authentication module components
import LoginForm from '../features/auth/components/LoginForm';
import RegisterForm from '../features/auth/components/RegisterForm';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';
import VerifyEmail from '../features/auth/components/VerifyEmail';
import SessionExpired from '../features/auth/components/SessionExpired';
import Maintenance from '../features/auth/components/Maintenance';

// Mock UI Pages (Operational Dashboards)

// 1. Home / Marketing page with Role Switcher for verification
const Home: React.FC = () => {
  const { loginAsMockRole, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: any, path: string) => {
    loginAsMockRole(role, 'gourmet-bistro');
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className="absolute top-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      
      <div className="max-w-3xl z-10 space-y-6">
        <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/5">
          <span className="text-primary font-display font-extrabold text-3xl">R</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-textPearl">
          Welcome to <span className="text-primary">RestaurantOS</span>
        </h1>
        <p className="text-mutedAsh max-w-xl mx-auto text-base">
          A production-grade SaaS Restaurant Management System. Use the switchboard below to authenticate as mock roles and explore the dashboard interfaces.
        </p>

        {user ? (
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between max-w-md mx-auto border-slate-800/40">
            <div className="text-left">
              <span className="text-xs text-mutedAsh">Logged in as:</span>
              <h3 className="text-sm font-semibold text-textPearl">{user.displayName}</h3>
            </div>
            <div className="space-x-2">
              <Link to={user.role === 'super-admin' ? '/super-admin' : '/dashboard/' + user.role} className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-background text-xs font-bold rounded-lg transition-all">
                Go to Dashboard
              </Link>
              <button onClick={logout} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-all">
                Logout
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6 text-left">
          {/* Customer QR Ordering */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800/50 hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-textPearl">Customer QR Order</h3>
              <p className="text-xs text-mutedAsh mt-1 mb-4">Simulate a diner scanning QR code at Table 4.</p>
            </div>
            <Link to="/r/gourmet-bistro/table/4" className="w-full text-center px-4 py-2 border border-slate-700 hover:border-primary text-slate-300 hover:text-primary text-xs font-bold rounded-xl transition-all">
              Scan Table QR Link
            </Link>
          </div>

          {/* Waiter Portal */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800/50 hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-textPearl">Waiter Dashboard</h3>
              <p className="text-xs text-mutedAsh mt-1 mb-4">Monitor table states, requests, and billing splits.</p>
            </div>
            <button onClick={() => handleRoleSelect('waiter', '/dashboard/waiter')} className="w-full px-4 py-2 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-bold rounded-xl transition-all">
              Enter Waiter Panel
            </button>
          </div>

          {/* Kitchen Queue */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800/50 hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-textPearl">Kitchen Workspace</h3>
              <p className="text-xs text-mutedAsh mt-1 mb-4">Manage orders cooking tickets and ingredient availability.</p>
            </div>
            <button onClick={() => handleRoleSelect('kitchen', '/dashboard/kitchen')} className="w-full px-4 py-2 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-bold rounded-xl transition-all">
              Enter Kitchen Panel
            </button>
          </div>

          {/* Owner Suite */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800/50 hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-textPearl">Restaurant Owner</h3>
              <p className="text-xs text-mutedAsh mt-1 mb-4">CRUD menu lists, manage team members, check analytics reports.</p>
            </div>
            <button onClick={() => handleRoleSelect('owner', '/dashboard/owner')} className="w-full px-4 py-2 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-bold rounded-xl transition-all">
              Enter Owner Panel
            </button>
          </div>

          {/* Manager / Admin */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800/50 hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-textPearl">Branch Administrator</h3>
              <p className="text-xs text-mutedAsh mt-1 mb-4">Coordinate physical branches, review security logs.</p>
            </div>
            <button onClick={() => handleRoleSelect('admin', '/dashboard/admin')} className="w-full px-4 py-2 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-bold rounded-xl transition-all">
              Enter Admin Panel
            </button>
          </div>

          {/* Super Admin */}
          <div className="glass-panel p-5 rounded-2xl border-slate-800/50 hover:border-primary/30 transition-all flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-textPearl">Super Admin SaaS</h3>
              <p className="text-xs text-mutedAsh mt-1 mb-4">View aggregate SaaS ARR, manage active merchant workspaces.</p>
            </div>
            <button onClick={() => handleRoleSelect('super-admin', '/super-admin')} className="w-full px-4 py-2 bg-slate-900 border border-slate-800 hover:border-primary text-slate-300 hover:text-primary text-xs font-bold rounded-xl transition-all">
              Enter SaaS Admin Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Customer Portal components
const CustomerPortal: React.FC = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-2xl mx-auto glass-panel p-6 rounded-2xl border-slate-800/40">
      <h2 className="text-2xl font-display font-extrabold text-textPearl">Gourmet Bistro</h2>
      <p className="text-xs text-primary mt-0.5">Scanning Table #4</p>
      <div className="mt-6 p-12 text-center border border-dashed border-slate-800 rounded-xl">
        <p className="text-sm text-mutedAsh">Active QR Ordering Portal is ready for menu injection.</p>
      </div>
    </div>
  </div>
);

// Role Dashboard placeholders
const OwnerOverview: React.FC = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Owner Operations Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="glass-panel p-5 rounded-2xl border-slate-800/50">
        <span className="text-xs text-mutedAsh">Daily Gross Sales</span>
        <h2 className="text-2xl font-display font-bold text-textPearl mt-1">$4,850.20</h2>
      </div>
      <div className="glass-panel p-5 rounded-2xl border-slate-800/50">
        <span className="text-xs text-mutedAsh">Active Dining Tables</span>
        <h2 className="text-2xl font-display font-bold text-accent mt-1">12 / 20</h2>
      </div>
      <div className="glass-panel p-5 rounded-2xl border-slate-800/50">
        <span className="text-xs text-mutedAsh">SaaS Active Plan</span>
        <h2 className="text-2xl font-display font-bold text-primary mt-1">Pro Tier</h2>
      </div>
    </div>
  </div>
);

const OwnerMenuEditor: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Menu CRUD Editor</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Menu builder is ready. Connect database hooks here.</p>
    </div>
  </div>
);

const OwnerStaffManager: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Staff Scheduling & Onboarding</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Staff invite list is ready.</p>
    </div>
  </div>
);

const OwnerTablesManager: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">QR Code Layout Exporter</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">QR creation system ready.</p>
    </div>
  </div>
);

const OwnerBilling: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">SaaS Billing & Subscriptions</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Stripe Billing interface integrations.</p>
    </div>
  </div>
);

const KitchenQueue: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Prep Tickets</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Real-time cooking ticket lines ready.</p>
    </div>
  </div>
);

const KitchenMenuControl: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Kitchen Stock Override</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Toggle items out-of-stock.</p>
    </div>
  </div>
);

const WaiterMatrix: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Waiter Seating Grid</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Live table alert matrix ready.</p>
    </div>
  </div>
);

const WaiterAlerts: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Customer Requests</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Table calls queue lists.</p>
    </div>
  </div>
);

const AdminAnalytics: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Manager System Logs</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Branch configuration analytics.</p>
    </div>
  </div>
);

const AdminLogs: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Immutable Audit Trails</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Audit logs viewer.</p>
    </div>
  </div>
);

const SuperAdminOverview: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">SaaS ARR Metrics</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Global MRR trackers.</p>
    </div>
  </div>
);

const SuperAdminTenants: React.FC = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Merchant Tenant Directory</h1>
    <div className="glass-panel p-6 rounded-2xl border-slate-800/50">
      <p className="text-sm text-mutedAsh">Activate/suspend tenant workspaces.</p>
    </div>
  </div>
);

const Unauthorized: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
    <h1 className="text-3xl font-display font-extrabold text-red-500">Access Denied</h1>
    <p className="text-mutedAsh mt-2 max-w-sm">Your JWT custom claims do not grant permission to view this dashboard.</p>
    <Link to="/" className="mt-6 px-4 py-2 bg-primary text-background font-bold text-xs rounded-xl">Go Home</Link>
  </div>
);

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
    <h1 className="text-3xl font-display font-extrabold text-primary">404 - Not Found</h1>
    <p className="text-mutedAsh mt-2">The route or workspace slug you entered does not exist.</p>
    <Link to="/" className="mt-6 px-4 py-2 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl">Go Home</Link>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Front facing routes */}
      <Route path="/" element={<Home />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* 2. Public Auth sub-routes gated by PublicRoute redirect interceptor */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Route>
      </Route>

      {/* 3. Customer tables QR portal routes */}
      <Route path="/r/:tenantId/table/:tableId" element={<CustomerPortal />} />

      {/* 4. Protected Restaurant Owner routes */}
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/owner" element={<OwnerOverview />} />
          <Route path="/dashboard/owner/menu" element={<OwnerMenuEditor />} />
          <Route path="/dashboard/owner/staff" element={<OwnerStaffManager />} />
          <Route path="/dashboard/owner/tables" element={<OwnerTablesManager />} />
          <Route path="/dashboard/owner/billing" element={<OwnerBilling />} />
        </Route>
      </Route>

      {/* 5. Protected Kitchen staff routes */}
      <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin', 'owner']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/kitchen" element={<KitchenQueue />} />
          <Route path="/dashboard/kitchen/menu-control" element={<KitchenMenuControl />} />
        </Route>
      </Route>

      {/* 6. Protected Waiter staff routes */}
      <Route element={<ProtectedRoute allowedRoles={['waiter', 'admin', 'owner']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/waiter" element={<WaiterMatrix />} />
          <Route path="/dashboard/waiter/alerts" element={<WaiterAlerts />} />
        </Route>
      </Route>

      {/* 7. Protected Branch Admin / Manager routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'owner']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/admin" element={<AdminAnalytics />} />
          <Route path="/dashboard/admin/logs" element={<AdminLogs />} />
        </Route>
      </Route>

      {/* 8. Protected SaaS Super Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={['super-admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/super-admin" element={<SuperAdminOverview />} />
          <Route path="/super-admin/tenants" element={<SuperAdminTenants />} />
        </Route>
      </Route>

      {/* 9. Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default AppRoutes;
