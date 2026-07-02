# Application Routes: RestaurantOS

RestaurantOS utilizes a client-side Single Page Application (SPA) routing system managed by `react-router-dom` (v6+), using nested layouts to control dashboard accessibility based on user roles and tenant bindings.

---

## 1. Route Access Matrix

| Route | Role Permitted | Authenticated | Layout Wrapper |
| :--- | :--- | :---: | :--- |
| `/` | Public | No | SaaS Landing Layout |
| `/login` | Public | No | Auth Form Layout |
| `/register` | Public | No | Auth Onboarding Layout |
| `/r/:tenantId/table/:tableId` | Customer | No | Customer Portal Layout |
| `/r/:tenantId/cart` | Customer | No | Customer Portal Layout |
| `/r/:tenantId/order-tracker/:orderId` | Customer | No | Customer Portal Layout |
| `/dashboard/owner` | Owner | Yes | Owner Dashboard Layout |
| `/dashboard/owner/menu` | Owner | Yes | Owner Dashboard Layout |
| `/dashboard/owner/staff` | Owner | Yes | Owner Dashboard Layout |
| `/dashboard/owner/billing` | Owner | Yes | Owner Dashboard Layout |
| `/dashboard/waiter` | Waiter, Admin, Owner | Yes | Waiter Dashboard Layout |
| `/dashboard/kitchen` | Kitchen, Admin, Owner | Yes | Kitchen Dashboard Layout |
| `/dashboard/admin/logs` | Admin, Owner | Yes | Admin Dashboard Layout |
| `/super-admin` | Super Admin | Yes | Super Admin Shell |

---

## 2. Route Specifications

### Public Marketing Routes
- **`/`**: Landing page displaying features, subscription tiers, and demo videos.
- **`/login`**: Universal entry portal. Decodes user custom JWT token claims post-auth to redirect them to their respective dashboard.
- **`/register`**: SaaS register form. Triggers tenant profile instantiation and redirects to Stripe SaaS setup.

---

### Customer QR-Scan Routing (`/r/:tenantId`)
Customers access this route by scanning QR codes printed on physical dining tables.

- **`/r/:tenantId/table/:tableId`**
  - *Parameters*: `tenantId` (e.g., "gourmet-bistro"), `tableId` (e.g., "table-04").
  - *Action*: Injects details into `TenantContext`, initializes order context tracking for Table 04, and lists active menu items.
- **`/r/:tenantId/cart`**
  - *Action*: Displays items selected for checkout.
- **`/r/:tenantId/order-tracker/:orderId`**
  - *Parameters*: `orderId` (Firestore document ID).
  - *Action*: Real-time ticket watcher displaying cooking statuses.

---

### Owner Dashboard (`/dashboard/owner/*`)
Restricted to users matching `{ role: "owner" }` and `tenantId` matching document context.

- **`/dashboard/owner`**: Aggregated store operations graphs (sales, peak item volumes, table turnover velocities).
- **`/dashboard/owner/menu`**: Interactive categories list and editing grids.
- **`/dashboard/owner/staff`**: HR directory containing invitation modules.
- **`/dashboard/owner/billing`**: Stripe customer portal portal links.

---

### Waiter Dashboard (`/dashboard/waiter/*`)
Restricted to users matching `{ role: "waiter" | "admin" | "owner" }`.

- **`/dashboard/waiter`**: Seating grid display. Colors indicate status triggers (green: empty, red: occupied, yellow: help/bill requested).
- **`/dashboard/waiter/table/:tableId/order`**: Manual order panel for taking custom inputs from tables without QR connectivity.
- **`/dashboard/waiter/alerts`**: Push notification alerts panel.

---

### Kitchen Dashboard (`/dashboard/kitchen/*`)
Restricted to users matching `{ role: "kitchen" | "admin" | "owner" }`.

- **`/dashboard/kitchen`**: Grid card workflow interface showing tickets sorted by delay status.
- **`/dashboard/kitchen/menu-control`**: Fast checklist page to toggle menu items in/out of stock.

---

### Admin Dashboard (`/dashboard/admin/*`)
Restricted to users matching `{ role: "admin" | "owner" }`.

- **`/dashboard/admin/branches`**: Setup secondary local shops under the same SaaS corporate brand.
- **`/dashboard/admin/logs`**: Auditing files logs containing event history records.

---

### Super Admin Dashboard (`/super-admin/*`)
Restricted to users matching `{ role: "super-admin" }`.

- **`/super-admin`**: SaaS operational metrics graphs (active MRR, tenant signup velocity, cloud consumption logs).
- **`/super-admin/tenants`**: Tenant status directory (suspend accounts, adjust plan limits).

---

## 3. Protected Route Architecture

Route guards are implemented via a custom wrapper component `ProtectedRoute.tsx` utilizing React router layouts:

```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface IProtectedRouteProps {
  allowedRoles: Array<'super-admin' | 'owner' | 'admin' | 'waiter' | 'kitchen' | 'customer'>;
}

export const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && !allowedRoles.includes(role)) {
    // Redirect to default error page if unauthorized
    return <Navigate to="/unauthorized" replace />;
  }

  // Render children layouts nested inside the route block
  return <Outlet />;
};
```
