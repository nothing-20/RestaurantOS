# Task Board: RestaurantOS Features

This board is the canonical list of all features planned for RestaurantOS. It acts as the task backlog for developers and AI agents.

---

## Current Overall Progress: Customer Journey & Auth Flow Complete

- **Not Started**: 5%
- **In Progress**: 0%
- **Completed**: 95%
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
