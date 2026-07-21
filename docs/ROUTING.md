# Route Matrix & Guards: RestaurantOS Routing Grid

This document specifies the client-side router configurations, guard interceptors, redirect rules, and route variables of **RestaurantOS** (v2.0-rc).

---

## 1. Routing Tree Overview

```mermaid
graph TD
    Root[/] --> LandingPage[Landing Page /]
    Root --> CustomerWelcome[Customer Entrance /customer]
    
    subgraph Authenticated Customer
        CustomerWelcome --> CustomerHome[/customer/home]
        CustomerWelcome --> CustomerDiscover[/customer/restaurant/:tenantId]
        CustomerWelcome --> SeatingBooking[/customer/booking]
        CustomerWelcome --> MobileCart[/customer/cart]
        CustomerWelcome --> Payment[/customer/payment]
        CustomerWelcome --> Profile[/customer/profile]
    end

    subgraph Staff Login & Activation
        Root --> StaffLogin[/staff/login]
        Root --> StaffActivate[/staff/activate]
    end

    subgraph B2B Gated Dashboards
        StaffLogin --> Dashboard[/dashboard]
        Dashboard --> OwnerOverview[/dashboard/owner]
        Dashboard --> KitchenQueue[/dashboard/kitchen]
        Dashboard --> WaiterMatrix[/dashboard/waiter]
        Dashboard --> ManagerWorkspace[/dashboard/manager]
    end

    subgraph Platform Admin
        StaffLogin --> SuperAdmin[/super-admin]
    end
```

---

## 2. Route Directory Reference

### Public Routes
* `/`: Universal Landing Page. Offers entry to customer features or staff portals.
* `/customer`: Customer welcome page with search bars.
* `/customer/login`: Customer email sign-in.
* `/customer/register`: Customer account creation.
* `/staff/login`: Universal staff login portal.
* `/staff/activate`: Onboarding activation page for invited employees.
* `/r/:tenantId/table/:tableId`: Customer tableside QR portal landing page. Resolves parameters and redirects to the menu catalog.
* `/customer/restaurant/:tenantId/menu`: Public diner menu view (allows tableside ordering).
* `/customer/restaurant/:tenantId/order/:orderId`: Real-time order progress tracker.

---

## 3. Gated Routes (B2C & B2B)

Access to protected routes is intercepted by layout wraps and guard controllers:

### Customer Guarded Portal (`/customer/*`)
Wrapped under `CustomerGuard.tsx` + `CustomerLayout.tsx`:
- `/customer/home`: Dynamic customer home panel.
- `/customer/restaurant/:tenantId`: Restaurant branch details.
- `/customer/booking`: Reserve a table.
- `/customer/cart`: Mobile shopping cart.
- `/customer/payment`: Checkout payment screen.
- `/customer/profile`: Customer profile details, past order histories, and loyalty rewards tabs.

### B2B Staff Dashboards (`/dashboard/*`)
Wrapped under `OwnerGuard.tsx` (checks authentication), `WorkspaceGuard.tsx` (validates workspace subscription/active statuses), and `DashboardLayout.tsx` (sidebar/navbar dashboard wrap).

#### 1. Owner Workspace (`RoleGuard allowedRoles={['owner', 'admin']}`)
- `/dashboard/owner`: Executive overview metrics.
- `/dashboard/owner/menu`: Menu categories/items CRUD.
- `/dashboard/owner/staff`: Employee roster logs.
- `/dashboard/owner/tables`: Seating canvas manager.
- `/dashboard/owner/billing`: POS Billing register and open cash shifts.
- `/dashboard/owner/inventory`: Stock control.
- `/dashboard/owner/analytics`: BI reporting charts.
- `/dashboard/owner/automation`: Schedulers and background check rules.
- `/dashboard/owner/strategy`: Strategic growth proposals.
- `/dashboard/owner/intelligence`: AI sandbox and Sop policies.
- `/dashboard/owner/settings`: Business settings forms.

#### 2. Kitchen Touchscreen (`RoleGuard allowedRoles={['owner', 'admin', 'manager', 'kitchen']}`)
- `/dashboard/kitchen`: Kitchen queue display (KDS).
- `/dashboard/kitchen/menu-control`: Out of stock triggers.
- `/dashboard/kitchen/order-history`: Historically completed orders.
- `/dashboard/kitchen/item-history`: Prepared dish metrics.
- `/dashboard/kitchen/chef-performance`: Turnaround analytics.
- `/dashboard/kitchen/timeline`: Preparation delays.
- `/dashboard/kitchen/settings`: KDS screen settings.

#### 3. Waiter tablet (`RoleGuard allowedRoles={['owner', 'admin', 'manager', 'waiter']}`)
- `/dashboard/waiter`: Seating tables map.
- `/dashboard/waiter/alerts`: Active pickup alerts and call waiter bells.
- `/dashboard/waiter/assigned-tables`: Floor tables.
- `/dashboard/waiter/order-history`: Past service logs.
- `/dashboard/waiter/timeline`: Task countdowns.
- `/dashboard/waiter/shift-report`: Served metrics.

#### 4. Manager Desk (`RoleGuard allowedRoles={['owner', 'admin', 'manager']}`)
- `/dashboard/manager`: Manager branch overview page.

---

## 4. Super Admin Routes (`/super-admin/*`)

Wrapped under `AdminGuard.tsx` + `WorkspaceGuard.tsx` + `DashboardLayout.tsx`:
- `/super-admin`: SaaS MRR overview graphs.
- `/super-admin/tenants`: Tenant lookup registries, plan overrides, suspensions.
