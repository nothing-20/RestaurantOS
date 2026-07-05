# Task Board: RestaurantOS Features

This board is the canonical list of all features planned for RestaurantOS. It acts as the task backlog for developers and AI agents.

---

## Current Overall Progress: RestaurantOS Core v1.0.0 Stable Release

- **Not Started**: 0%
- **In Progress**: 0%
- **Completed**: 100%
- **Blocked**: 0%

---

## 1. Not Started

### Customer Portal
- [ ] Build item customization sheet (modal for options like extra cheese, spice levels, sides).
- [ ] Integrate Stripe Checkout flow for cashless table-side digital payment.

### Restaurant Owner Dashboard
- [ ] Build Subscription Billing screen: Integrates Stripe customer portal to manage subscription tier (Starter, Pro, Enterprise) and payment cards.

### Kitchen Dashboard
- [ ] Integrate sound alert module: Play sound notifications on new orders or delayed tickets.

### Waiter Dashboard
- [ ] Build Order intake interface: Waiter can click a table and manually input an order, selecting from categories and items.
- [ ] Build split-bill calculator: Allow splitting order items or dividing total amount equally, printing individual customer receipts.

### Admin Dashboard
- [ ] Build Multi-Branch settings view: Toggle settings for secondary locations, share inventory thresholds, or sync menus.
- [ ] Build Audit Trail viewer: Logs actions (e.g., "Menu item pricing changed", "Staff deleted") with timestamp, IP, and user ID.
- [ ] Build Staff Shift Planner: Plan weekly employee schedules and calculate estimated weekly payroll expenses.

---

## 2. In Progress

*None (Awaiting Production deployments)*

---

## 3. Completed

- [x] Phase 1 - Architecture Specs & System Guidelines (`PROJECT_CONTEXT.md`, `SRS.md`, `ARCHITECTURE.md`).
- [x] Phase 1 - Multi-Tenant Routing Guards, Providers Contexts, and UI primitives library.
- [x] Phase 1 - Authentication Module (Forms, Firebase auth state listener integration).
- [x] Phase 2 - Menu CRUD Management (Categories, Search, Image uploads to Firebase Storage).
- [x] Phase 2 - Diner QR Scan Menu browser, Persistent Shopping Cart, Checkout form checkout.
- [x] Phase 2 - Kitchen real-time prep ticket queues, Cook/Ready click transitions, out of stock stock overrides.
- [x] Phase 2 - Waiter tables grid occupied trackers, Deliveries routes, tables alerts hub, billing summary Mark Paid transactions.
- [x] Phase 2 - Owner Dashboard Sales earnings stats, custom SVG charts, employee profiles roster CRUD, tables arrangement CRUD, and inventory safety alert logs.
- [x] Phase 3 - Super Admin SaaS Platform command metrics summaries.
- [x] Integration & Stabilization - Registered application with the Firebase SDK, initialized services config structures under `src/firebase/`, structured environment templates `.env.example`, created a single-click database seeding script in the Super Admin UI, and defined multi-tenant tenant isolation rules in `firestore.rules`.
- [x] B2B/B2C Entry Experience - Created the dual B2B (Grow Your Restaurant) and B2C (Order Food) home landing page experience with theme toggling, Framer Motion fade-ins, customer login flows, table scans portal, and a developer switchboard utility.
- [x] Customer Journey & Auth Flow - Created the Customer Registration view, linked forms to `signInWithEmailAndPassword` and `createUserWithEmailAndPassword` via Firebase, synced user profile fullName/phoneNumber from Firestore, protected customer routes redirecting to `/customer/login`, and removed legacy mock customer configurations.
- [x] Restaurant Staff Authentication Redesign - Replaced separate role login views with a unified `/staff/login` portal featuring email activation workflows for invited employees, status-based access rejection, auto-redirect role-routing, and Owner staff dashboard upgrades (invitations, suspensions, and password resets).
- [x] Multi-Tenant Workspace Validation Layer - Implemented sequential validation checking user statuses, tenant restaurant deactivations, branch disablements, subscription expirations, and assigning permission context values before displaying dashboards.
- [x] Workspace Security Refinements - Structured specific owner bypass exception gates for expired subscriptions on billing renewal paths, implemented a global `RoleGuard` wrapper separating B2B dashboards, and added auto-signouts for user-not-found profiles.
- [x] Authentication Deep Debug Sprint - Identified and fixed 9 root-cause bugs: missing `TUserRole` union members (manager/cashier/reception), JWT claims overriding Firestore role, mock session Firestore crash, hardcoded `branchId: 'main-branch'` causing false branch-disabled errors, missing profile silent redirect, PublicGuard template literal path bug, WorkspaceContext re-validation loop, employee roster UID backfill missing, and owner profile schema inconsistency.
- [x] Staff Onboarding & Invitation Authentication Redesign - Redesigned employee onboarding flow: owner creates a pending invitation doc in a root-level `employees` collection (not a subcollection, firebaseUid = null); employee activates their account at `/staff/activate` creating their own Firebase Authentication account and `users/{uid}` document, linking the UID back to the employee record; refactored `/staff/login` to login-only; added top filter tabs and detailed actions to `OwnerStaffManager.tsx` to handle Suspend/Reactivate/Archive/Resend Invite (link copy)/Edit/Delete.
- [x] Menu Management System Foundation - Designed and implemented a commercial-grade tabbed workspace in Menu Engine including Category CRUD (Display Order reordering, toggles, custom images, list views), Menu Item CRUD (Veg/Non-Veg status, prices, discount prices, bestseller/recommended tags, spice levels, duplicate actions, image handling), Availability Switchboard, Pricing quick adjustments (save-on-blur input inputs), and full Customer Menu Preview simulation, all synced in real-time to Firestore with strict name-duplication and price validations.
- [x] Menu Firestore Architecture Migration - Refactored Categories and Items path structures to `menu/menu/categories/{categoryId}` and `menu/menu/items/{itemId}` to prevent deep subcollection redundancy, implemented client-side automated migration checking legacy documents on mount, and updated path references across collections helpers, services singletons, seeder modules, and customer portals.
- [x] RestaurantOS Firestore Architecture v1.0 - Finalized and simplified paths to `/menu/default/categories` and `/menu/default/items`, updated the automated client migration routine to handle V1 and V2 source schemas, and pre-constructed database placeholders for variants, addons, and combos.
- [x] Seating & Tables Layout Management (Sprint 3) - Programmed an interactive visual floor plan module in `OwnerTablesManager.tsx` with drag-and-drop position editing, circle/square/rectangle shapes, status badge updates, Floor/Section config managers, and a canvas QR Code card exporter (preview, download, print, regenerate actions).
- [x] KDS Operations & Architecture Reorganization (Sprint 4 Prep) - Standardized Order Status Lifecycle states, conformed Table State Transitions, drafted full component hierarchies and notification routing strategies, and updated changelogs, task boards, and developer docs.
- [x] Sprint 4: Kitchen Display System (KDS) Implementation - Rewrote `KitchenQueue.tsx` to a professional 4-tab multi-view KDS: Table View (default, per-order ticket cards with live elapsed timers and status advance buttons), Category View (items grouped by menu category), Station View (items grouped by kitchen station with dynamic fallback), and Item Queue (batch-cook aggregator). All views share one real-time Firestore listener with no duplicate reads.
- [x] Sprint 4.1: Waiter Delivery Loop - Added "Kitchen Ready" primary tab to `WaiterAlerts.tsx` subscribing to `orders` with `status == READY`. Waiters see all kitchen-ready dishes with full item lists and can click "Mark Delivered" to advance orders to DELIVERED, completing the KDS → Waiter operational loop.
- [x] Sprint 5: Kitchen Dashboard Professional Operations Suite - Transformed KDS into commercial-grade system: (1) `KitchenStatsBar` — 8 live metric cards (Active, Preparing, Ready, Avg Prep, Delayed, Completed Today, Efficiency %, Peak Queue); (2) `BulkActionsToolbar` — floating multi-select toolbar with Firestore `writeBatch` for bulk Accept/Preparing/Ready/Archive; (3) `OrderTimeline` — vertical per-order event history appended via `arrayUnion`; (4) `KitchenInsightsPanel` — 6-metric insights sidebar (Longest Waiting, Fastest, Bottleneck, Avg Times, >15m count); (5) `KitchenTicket` — enhanced card with checkbox, 5-band timer, inline timeline; (6) `kitchenMetrics.ts` — pure metrics utility module. Single Firestore listener preserved. ITimelineEvent added to global types.
- [x] Sprint 6: Kitchen Display System Professional Enhancements - Completed KDS enhancements: (1) Chef Assignment flow (dropdown assignment, active employees real-time lookup, unassign controls); (2) Pause & Resume cooking states (transitions, reason prompt capture, details badge, timeline updates); (3) Recall Ready orders (back-transition to Preparing, updates Waiter pick-ups instantly); (4) Internal notes segment (editable kitchen & chef notes inputs); (5) Cooking Queue view tab (queue positions, sequential estimations start/finish time, ▲/▼ reordering, Auto-Sort priority triggers); (6) Smart Priority auto-matrix (VIP name match, size check, delay check, override selector).
- [x] Sprint 7: Waiter Operations Module - Implemented floor server cockpit: (1) My Floor Grid (assigned tables, seating check-ins with guest counts, waiter release); (2) Quick Order builder (modal cart, item search selection, sub-total sum calculations, KDS submissions); (3) Pickup Alerts (READY orders list, claiming, Mark Delivered updates); (4) Requests Hub (assistance requests accept/resolve alerts); (5) Invoice Billings (calculations, discount percentage sliders, tax rates, checkout marking paid); (6) Table Cleaning resetting loop (dirty → cleaning → available empty); (7) Checklist Timelines; (8) Live toasted alert banners (Ready order delay warnings, diner request bells, checkouts); (9) Waiter Stats widgets.
- [x] Sprint 8: Waiter Service Command Center - Upgraded floor cockpit to B2B command dashboard: (1) Shift clocker tracker (Start/End/Break states, serving stats); (2) Unified dynamic tasks queue (Deliveries, QR diner calls, checkouts, cleaning resets); (3) Smart priority algorithm (VIP status matching, elapsed response aging escalations); (4) Second-precision service timers color-coded by response thresholds; (5) Route Optimization next best action (priority → section → table sort); (6) Command Header metrics cards & Live Activity Logger feed.
- [x] Sprint 9: Waiter Operations Final Enhancements - Completed final operations sprint: (1) Shift Handover (checks pending items, modal transfer builder, `/handovers` logging); (2) Incoming Handover notification acceptance (batch writes reassigning tables/orders); (3) Table Allocation Cockpit for managers/owners (Round Robin & Least Loaded auto load balancers, bulk section assign, manual dropdowns); (4) Diner Experience Review prompts during checkout (logs satisfaction rating Excellent/Good/Neutral/Needs Attention/Complaint, notes, repeat customer checkbox to `/satisfactionRatings`).
- [x] Sprint 10: Restaurant Event Engine & Customer Experience Intelligence - Finalized the operational sprint: (1) Asynchronous non-blocking background logger `logEvent` writing to `/restaurants/{tenantId}/events`; (2) Live Activity feed UI subscribing to events with tables/orders/date/user search filters and category tags; (3) Interactive feedback overlays logging scored metrics (cleanliness, speed, food, staff, waiting, ambience) and customer types (solo, couple, group) to `/satisfactionRatings` collection; (4) Service Recovery tasks automatically created under `/restaurants/{tenantId}/managerReviews` for checkouts rated `Needs Attention` or `Complaint`.
- [x] Sprint 11: Billing & POS Module Integration - Completely integrated the POS & Billing Desk workspace under the existing Owner Dashboard `/dashboard/owner/billing` route. Programmed sub-tabs for Billing Queue, Open Bills, Settled Invoices, Returns & Refunds, Register Logs, and Sales Summary metrics. Added mixed payments support, customizable discount offer types, tax and service charge calculations, and supervisor PIN gates (`1234`) for high discount thresholds. Re-routed waiter floor maps and order summaries to call read-only "Request Bill" alerts, updating table states to `bill_requested` and writing logs to the Event Engine stream.
- [x] Sprint 11.1: Billing & POS final professional POS Enhancements (v1.1) - Implemented active Cash Drawer shifts (opening floats,Expected Balance tracking, closed discrepancy checks), Bill Hold / Resume checks (pause checks with custom reasons), complimentary items markdown (sets subtotal calculation to 0, audits approvals reason), invoice reprint auditing tracker copy counters, shift reports ledger listings, and role-based action locks (Owner/Admin roles only). Hooked all operations to the Event Engine loggers.












