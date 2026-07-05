import React from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OwnerGuard from './OwnerGuard';
import AdminGuard from './AdminGuard';
import CustomerGuard from './CustomerGuard';
import PublicGuard from './PublicGuard';
import WorkspaceGuard from './WorkspaceGuard';
import RoleGuard from './RoleGuard';
import AuthLayout from '../components/layout/AuthLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Import newly created Authentication module components
import LoginForm from '../features/auth/components/LoginForm';
import StaffLogin from '../features/auth/components/StaffLogin';
import StaffActivate from '../features/auth/components/StaffActivate';
import WorkspaceError from '../features/auth/components/WorkspaceError';
import RegisterForm from '../features/auth/components/RegisterForm';
import ForgotPasswordForm from '../features/auth/components/ForgotPasswordForm';
import VerifyEmail from '../features/auth/components/VerifyEmail';
import SessionExpired from '../features/auth/components/SessionExpired';
import Maintenance from '../features/auth/components/Maintenance';

// Import newly created Menu and Ordering features
import MenuManagement from '../features/owner-dashboard/components/MenuManagement';
import CustomerPortal from '../features/customer-portal/components/CustomerPortal';

// Import newly created Kitchen features
import KitchenQueue from '../features/kitchen-dashboard/components/KitchenQueue';
import KitchenMenuControl from '../features/kitchen-dashboard/components/KitchenMenuControl';

// Import newly created Waiter features
import WaiterMatrix from '../features/waiter-dashboard/components/WaiterMatrix';
import WaiterAlerts from '../features/waiter-dashboard/components/WaiterAlerts';

// Import newly created Owner dashboard features
import OwnerOverview from '../features/owner-dashboard/components/OwnerOverview';
import OwnerStaffManager from '../features/owner-dashboard/components/OwnerStaffManager';
import OwnerTablesManager from '../features/owner-dashboard/components/OwnerTablesManager';
import OwnerInventoryManager from '../features/owner-dashboard/components/OwnerInventoryManager';
import OwnerSettings from '../features/owner-dashboard/components/OwnerSettings';

// Import newly created Super Admin features
import SuperAdminOverview from '../features/super-admin/components/SuperAdminOverview';
import SuperAdminTenants from '../features/super-admin/components/SuperAdminTenants';

import LandingPage from '../features/landing-page/LandingPage';
import CustomerLogin from '../features/customer-portal/components/CustomerLogin';
import CustomerRegister from '../features/customer-portal/components/CustomerRegister';
import RestaurantDiscovery from '../features/customer-portal/components/RestaurantDiscovery';
import RestaurantDetails from '../features/customer-portal/components/RestaurantDetails';
import CustomerMenu from '../features/customer-portal/components/CustomerMenu';
import OrderTracking from '../features/customer-portal/components/OrderTracking';

// Mock UI Pages (Operational Dashboards)
const ManagerDashboard: React.FC = () => (
  <div className="space-y-4 text-left">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Manager Workspace</h1>
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
      <p className="text-sm text-mutedAsh">Operational branch analytics and dashboard panels are loading...</p>
    </div>
  </div>
);

const CashierDashboard: React.FC = () => (
  <div className="space-y-4 text-left">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Cashier Desk</h1>
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
      <p className="text-sm text-mutedAsh">Point of sale and checkout billing panels are loading...</p>
    </div>
  </div>
);

const ReceptionDashboard: React.FC = () => (
  <div className="space-y-4 text-left">
    <h1 className="text-2xl font-display font-extrabold text-textPearl">Reception / Seating</h1>
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/50">
      <p className="text-sm text-mutedAsh">Diner queue seating registries are loading...</p>
    </div>
  </div>
);





// Role Dashboard placeholders






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
      <Route path="/" element={<LandingPage />} />
      <Route path="/customer/login" element={<CustomerLogin />} />
      <Route path="/customer/register" element={<CustomerRegister />} />
      {/* Staff activation — public, no auth guard needed (employee activates before they have an account) */}
      <Route path="/staff/activate" element={<StaffActivate />} />
      
      {/* Protected customer routes */}
      <Route element={<CustomerGuard />}>
        <Route path="/customer/restaurants" element={<RestaurantDiscovery />} />
        <Route path="/customer/restaurant/:tenantId" element={<RestaurantDetails />} />
        <Route path="/customer/restaurant/:tenantId/menu" element={<CustomerMenu />} />
        <Route path="/customer/restaurant/:tenantId/order/:orderId" element={<OrderTracking />} />
        <Route path="/customer/home" element={<RestaurantDiscovery />} />
      </Route>
      
      {/* Backward compatibility redirects for old login routes */}
      <Route path="/owner/login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/waiter/login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/kitchen/login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/cashier/login" element={<Navigate to="/staff/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/staff/login" replace />} />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/workspace-error" element={<WorkspaceError />} />

      {/* 2. Public Auth sub-routes gated by PublicGuard redirect interceptor */}
      <Route element={<PublicGuard />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Navigate to="/staff/login" replace />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/session-expired" element={<SessionExpired />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Route>
      </Route>

      {/* 3. Customer tables QR portal routes */}
      <Route path="/r/:tenantId/table/:tableId" element={<CustomerPortal />} />

      {/* 4. Protected B2B Restaurant Staff & Owner routes gated by Workspace Validation */}
      <Route element={<OwnerGuard />}>
        <Route element={<WorkspaceGuard />}>
          <Route element={<DashboardLayout />}>
            {/* Owner Dashboards */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin']} />}>
              <Route path="/dashboard/owner" element={<OwnerOverview />} />
              <Route path="/dashboard/owner/menu" element={<MenuManagement />} />
              <Route path="/dashboard/owner/staff" element={<OwnerStaffManager />} />
              <Route path="/dashboard/owner/tables" element={<OwnerTablesManager />} />
              <Route path="/dashboard/owner/billing" element={<OwnerInventoryManager />} />
              <Route path="/dashboard/owner/settings" element={<OwnerSettings />} />
            </Route>
            
            {/* Branch Manager Dashboard */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin', 'manager']} />}>
              <Route path="/dashboard/manager" element={<ManagerDashboard />} />
            </Route>

            {/* Cashier Dashboard */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin', 'manager', 'cashier']} />}>
              <Route path="/dashboard/cashier" element={<CashierDashboard />} />
            </Route>

            {/* Reception Dashboard */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin', 'manager', 'reception']} />}>
              <Route path="/dashboard/reception" element={<ReceptionDashboard />} />
            </Route>

            {/* Kitchen Dashboards */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin', 'manager', 'kitchen']} />}>
              <Route path="/dashboard/kitchen" element={<KitchenQueue />} />
              <Route path="/dashboard/kitchen/menu-control" element={<KitchenMenuControl />} />
            </Route>

            {/* Waiter Dashboards */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin', 'manager', 'waiter']} />}>
              <Route path="/dashboard/waiter" element={<WaiterMatrix />} />
              <Route path="/dashboard/waiter/alerts" element={<WaiterAlerts />} />
            </Route>

            {/* Branch Admin/Logs Dashboards */}
            <Route element={<RoleGuard allowedRoles={['owner', 'admin']} />}>
              <Route path="/dashboard/admin" element={<AdminAnalytics />} />
              <Route path="/dashboard/admin/logs" element={<AdminLogs />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* 5. Protected SaaS Super Admin routes gated by Workspace Validation */}
      <Route element={<AdminGuard />}>
        <Route element={<WorkspaceGuard />}>
          <Route element={<DashboardLayout />}>
            <Route path="/super-admin" element={<SuperAdminOverview />} />
            <Route path="/super-admin/tenants" element={<SuperAdminTenants />} />
          </Route>
        </Route>
      </Route>

      {/* 9. Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
export default AppRoutes;
