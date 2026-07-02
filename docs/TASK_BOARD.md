# Task Board: RestaurantOS Features

This board is the canonical list of all features planned for RestaurantOS. It acts as the task backlog for developers and AI agents.

---

## Current Overall Progress: Phase 1 Complete

- **Not Started**: 85%
- **In Progress**: 0%
- **Completed**: 15%
- **Blocked**: 0%


---

## 1. Not Started

### Multi-Tenant Core & Auth Setup
- [x] Initialize React + TypeScript frontend using Vite.
- [x] Configure Tailwind CSS with custom design tokens, fonts, and dark-glass overrides.
- [x] Setup Firebase config helper (`src/config/firebase.ts`) initializing Auth, Firestore, and Storage.
- [x] Write global `AuthContext` to manage login/logout state and loading indicators.
- [x] Write global `TenantContext` to parse tenant ID from subdomain or path URL (`/r/:tenantId`) and fetch tenant configuration.
- [x] Create higher-order route components (`ProtectedRoute.tsx`) to validate specific permissions before accessing dashboards.
- [x] Implement Firebase functions to set custom claims (e.g. `role`, `tenantId`) on user accounts during signup or employee onboarding.

### Customer Portal
- [ ] Design responsive mobile-first landing layout for scanning QR codes `/r/:tenantId/table/:tableId`.
- [ ] Build menu browser component with quick search, category filters, and allergen indicators.
- [ ] Build item customization sheet (modal for options like extra cheese, spice levels, sides).
- [ ] Build localized shopping cart utility using local storage + context syncer.
- [ ] Integrate Stripe Checkout flow for cashless table-side digital payment.
- [ ] Create order placement logic pushing tickets to Firestore `orders` collection.
- [ ] Build real-time order progression screen showing "Placed" -> "Preparing" -> "Ready" -> "Served" using Firestore snapshot listeners.

### Restaurant Owner Dashboard
- [ ] Build main layout containing analytics overview cards (total sales, active tables, peak hours).
- [ ] Build Menu Management module: CRUD categories and menu items with image upload to Firebase Storage.
- [ ] Build Employee Management module: Invite staff, set roles (`admin`, `waiter`, `kitchen`), and manage active status.
- [ ] Build Table QR Code Generator: Enter table count, generate links `/r/:tenantId/table/:tableId`, and export high-res printable QR cards.
- [ ] Build Inventory Management view: Track raw ingredient stock counts, setup low-stock thresholds, and display warnings.
- [ ] Create Reports & Analytics tab: Visual charts (using Chart.js or Recharts) plotting daily/monthly sales, popular menu items, and waiter performance.
- [ ] Build Subscription Billing screen: Integrates Stripe customer portal to manage subscription tier (Starter, Pro, Enterprise) and payment cards.

### Kitchen Dashboard
- [ ] Design landscape kitchen ticket board showing active tickets sorted by placement time.
- [ ] Build interactive ticket card containing:
  - Table number, order elapsed timer (color-changing for delayed tickets).
  - List of items with modifications highlighted in orange/red.
- [ ] Add update buttons: transition order status from `Pending` -> `Preparing` -> `Ready for Pickup`.
- [ ] Integrate sound alert module: Play sound notifications on new orders or delayed tickets.
- [ ] Create kitchen item availability toggle: allow kitchen staff to mark a menu item "Out of Stock" to instantly update the customer portal.

### Waiter Dashboard
- [ ] Build responsive tablet table-grid view showing all table layouts (e.g., Table 1: Green/Empty, Table 2: Red/Occupied, Table 3: Yellow/Unpaid).
- [ ] Build Order intake interface: Waiter can click a table and manually input an order, selecting from categories and items.
- [ ] Build split-bill calculator: Allow splitting order items or dividing total amount equally, printing individual customer receipts.
- [ ] Add Waiter request alert viewer: Receive real-time push alerts from customers asking for assistance or bill requests at tables.

### Admin Dashboard
- [ ] Build Multi-Branch settings view: Toggle settings for secondary locations, share inventory thresholds, or sync menus.
- [ ] Build Audit Trail viewer: Logs actions (e.g., "Menu item pricing changed", "Staff deleted") with timestamp, IP, and user ID.
- [ ] Build Staff Shift Planner: Plan weekly employee schedules and calculate estimated weekly payroll expenses.

### Super Admin Dashboard
- [ ] Build SaaS overview portal: Track total signed-up tenants, monthly recurring revenue (MRR), and active global subscriptions.
- [ ] Build Tenant Management module: List tenants, toggle ban/suspend status, manually bypass subscription limits.
- [ ] Build Global Settings & System Logs: Monitor database read/write thresholds, API latency counters, and server error rates.

---

## 2. In Progress

*None (Awaiting Phase 2 planning)*

---

## 3. Completed

- [x] Phase 1 - Architecture Specs & System Guidelines (`PROJECT_CONTEXT.md`, `SRS.md`, `ARCHITECTURE.md`).
- [x] Phase 1 - Multi-Tenant Routing Guards, Providers Contexts, and UI primitives library.
- [x] Phase 1 - Authentication Module (Forms, Firebase auth state listener integration).

---


## 4. Blocked

- *None*
