# Changelog: RestaurantOS

All notable changes to the **RestaurantOS** repository will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to Semantic Versioning.

---

## [1.9.0] - 2026-07-05 (Staff Onboarding & Invitation Authentication Redesign)

This release implements a secure, invitation-based staff onboarding workflow:

### Added
- **Root-Level `employees` Collection**: Separated business records (`employees/`) from auth records (`users/`), allowing invitations to be created without Firebase Authentication account pre-generation.
- **Staff Account Activation Page (`/staff/activate`)**: Created a standalone page with a 3-step wizard (Verify Invite, Set Password, Activated) to look up invitation, create Firebase Authentication user, set profile doc, and link records.
- **Activation CTA**: Integrated an "Activate Staff Account" link on the `/staff/login` page.
- **Roster Management Upgrades**: Rewrote `OwnerStaffManager.tsx` with top status filtering tabs, support for all 5 statuses (Invited/Activated/Active/Suspended/Archived), actions for Suspend, Reactivate, Archive, Resend Invite, Edit, and Delete.
- **Firestore Security Rules**: Configured read/write access for root-level `/employees` collection.

## [1.8.2] - 2026-07-05 (Authentication Debugging — Root Cause Fixes)

This release fixes all observed login routing failures across B2B staff roles:

### Fixed
- **`TUserRole` Missing Roles** — `manager`, `cashier`, `reception` were absent from the TypeScript union type, causing them to silently fall back to `'customer'` role and route to the wrong dashboard or be blocked entirely.
- **JWT Claims Priority Bug** — `AuthContext` used JWT claims as the primary role source. Stale or missing claims overrode the correct Firestore role. Firestore is now the authoritative source; JWT claims are only used as a last-resort fallback.
- **Mock Session Firestore Crash** — `WorkspaceContext` attempted to look up `users/mock-uid-waiter` etc. in Firestore for dev mock sessions, producing false `user-not-found` errors. Mock sessions now build a synthetic workspace directly from the user object.
- **Hardcoded `branchId: 'main-branch'`** — All invited staff were assigned `branchId='main-branch'`, causing WorkspaceContext to look up `branches/main-branch` in Firestore which doesn't exist, triggering false `branch-disabled` errors. Now stored as empty string.
- **Missing Profile Silent Redirect** — When StaffLogin authenticated a user with no Firestore doc, it silently navigated to `/`. Now signs out immediately and shows an actionable error message.
- **PublicGuard Generic Path Bug** — Used template literal `/dashboard/${role}` which would produce wrong paths. Now uses an explicit role-to-path map.
- **WorkspaceContext Re-Validation Loop** — `useEffect([user])` fired on every render because `user` is a new object reference each time. Changed to `[user?.uid]` (stable primitive string).
- **Employee Roster UID Backfill** — After staff account activation, the employee roster doc retained `uid: ''`. StaffLogin now backfills the real Firebase UID after activation so suspend/reset flows work correctly.
- **Owner Profile Schema** — Owner's Firestore doc stored `displayName` but not `fullName`, causing blank welcome messages. Now stores both fields.
- **Firestore Rules Recursive Dependency** — `hasRole()` in users collection rules called `getUserData()` which read `users/{uid}` — recursive dependency that failed when the user doc didn't exist yet during first write. Rules now use direct `request.auth.uid == userId` check as primary condition.

## [1.8.1] - 2026-07-05 (Workspace Validation Refinements & Role Isolation)

This patch introduces security isolation and billing exceptions for the Workspace Validation layer:

### Added
- **Cross-Dashboard Role Security**: Integrated `RoleGuard.tsx` to enforce role checking on B2B sub-routes, preventing staff members from manually entering URLs to unauthorized dashboards.
- **Subscription Renewal Loop Bypass**: Enabled Owner access to `/dashboard/owner/billing` when their subscription status is `'expired'` or `'cancelled'` to allow card renewal.
- **Auto-Logout for Missing Profiles**: Triggers immediate Firebase sign-out and toast notifications if user profile lookup fails in Firestore.

## [1.8.0] - 2026-07-05 (Workspace Validation & Security Layer)

This release implements a secure, multi-tenant Workspace Validation pipeline:

### Added
- **Centralized Workspace Provider**: Configured `WorkspaceContext.tsx` conducting sequential security checks on user document existence, status active checks, tenant status checks, subscription tier/status validation, branch checks, and role classification.
- **Workspace Route Guard**: Created `WorkspaceGuard.tsx` intercepting B2B dashboard and platform administration pages, displaying loader screens, and preventing direct URL access.
- **Dedicated Error Dashboard**: Built `/workspace-error` displaying premium layouts for suspended accounts, expired subscriptions, disabled branches, and unauthorized access events.
- **Super-Admin Bypass**: Configured automated validation bypass rules for B2B restaurant checks when loading platform-wide admin portals.

## [1.7.0] - 2026-07-05 (Restaurant Staff Authentication Redesign)

This release redesigns the Restaurant Staff authentication architecture:

### Added
- **Unified Staff Login Page**: Integrated a single `/staff/login` route replacing multiple separate role-based login views.
- **Auto-routing by Role**: Configured automatic routing to respective B2B dashboards based on the Firestore user profile role.
- **Account Invitation Flow**: Implemented pending invitation lookup and first-time account activation setting a password, linking Firebase UID, and creating their active user document.
- **Status Validation Checks**: Disables access to dashboards if the employee document status is not `active`, showing a helpful error alert.
- **Staff Panel Actions**: Added Invite, Suspend/Deactivate, Reactivate, and Password Reset actions to the Owner's staff manager screen.
- **Backward Compatibility Redirects**: Redirects legacy routes (`/owner/login`, `/waiter/login`, `/kitchen/login`, `/cashier/login`, and `/admin/login`) to the unified `/staff/login` page.

## [1.6.2] - 2026-07-05 (Owner Settings Integration & Bugfix)

This release resolves integration issues and compilation blocks in the Restaurant Profile & Settings module:

### Fixed
- **Missing Imports**: Added missing `LoadingSpinner` and `setDoc` imports in `OwnerSettings.tsx`.
- **Hanging Load Fallbacks**: Implemented dynamic `tenantId` fallback lookup in `users/{uid}` collection to prevent loading hangs when auth context claims are not instantly resolved.
- **Missing Document Init**: Configured Firestore to automatically write default settings if the tenant document doesn't exist, preventing runtime crashes.
- **Tab Layout Division**: Organized all settings configuration fields into 6 tab containers (Restaurant Profile, Business Hours, Branding, Business Settings, Tax & Compliance, QR & Seating).

## [1.6.1] - 2026-07-05 (Customer Dining Workflow Enhancements)

This patch introduces enhancements to the customer dining experience on the menu page and waiter dashboards:

### Added
- **Persistent Header Buttons**: Added "Track Orders", "Live Bill", and "Call Waiter" header options in `CustomerMenu.tsx`.
- **Mobile Sticky Action Bar**: Renders sticky floating bottom-tabs on mobile devices to easily access dining options.
- **Table Orders Tracking Drawer**: Renders a realtime tracking view showing all orders placed from the current table.
- **Live Running Bill Drawer**: Aggregates all items ordered from the table and calculates live subtotal, service charges, GST, and grand total.
- **Assisted Call Waiter Popup**: Provides assistance choices and creates Firestore documents under `waiterRequests/`.
- **Waiter Assistance Requests Panel**: Implemented in `WaiterAlerts.tsx` allowing waiters to accept and complete requests in real-time.
- **Diner Alert Banner**: Displays a "Waiter is on the way" alert banner to diners when a request status is accepted.

### Modified
- **Customer Checkout Success Loop**: Places orders without redirecting away, clears the cart, shows a confirmation dialog, and keeps the customer on the menu.

## [1.6.0] - 2026-07-05 (Customer Experience Redesign)

This release implements a complete redesign of the B2C Customer Experience, including restaurant discovery, details view, available seating table selection, simulated QR code scanning, menu card deck catalogs, checkout calculations (GST + Service fee), order confirmation, and real-time status tracking.

### Added
- **Restaurant Discovery Page ([RestaurantDiscovery.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/RestaurantDiscovery.tsx))**: Supports search queries, cuisine quick chips, sorting by rating, status badges, and estimated waiting times.
- **Restaurant Details Page ([RestaurantDetails.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/RestaurantDetails.tsx))**: Counts available tables and hosts the Simulated QR Scanner and manual seating grids.
- **Customer Menu Page ([CustomerMenu.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerMenu.tsx))**: Supports quick category scroll, Veg/Nonveg toggles, Offers/Popular feeds, quantity counters, and the sliding cart drawer.
- **Order Tracking Page ([OrderTracking.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/OrderTracking.tsx))**: Renders a live progress stepper subscribing to Firestore snapshots.

### Modified
- **AppRoutes Config ([AppRoutes.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/AppRoutes.tsx))**: Registered new paths for the customer pages.
- **Diner Redirects ([PublicGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/PublicGuard.tsx), [CustomerLogin.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerLogin.tsx))**: Changed default routes to `/customer/restaurants`.
- **Database Seeder ([seed.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/firebase/seed.ts))**: Automatically seeds cover images, cuisines, descriptions, logos, ratings, and phone numbers.
- **Customer Portal ([CustomerPortal.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerPortal.tsx))**: Aligned checkout pricing fields (GST 5% + Service Charge 5%).
- **Customer Home ([CustomerHome.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerHome.tsx))**: Refactored to act as a router-level redirect.

## [1.5.1] - 2026-07-05 (Customer Auth Race Condition & Route Guards Refactoring)

This release implements decoupled route guards and addresses race conditions and rules crashes for Customer registration.

### Added
- **OwnerGuard ([OwnerGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/OwnerGuard.tsx))**: Decoupled route guard for merchant-specific and branch operational pages.
- **AdminGuard ([AdminGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/AdminGuard.tsx))**: Gated route guard for SaaS super-admin pages.
- **CustomerGuard ([CustomerGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/CustomerGuard.tsx))**: Gated route guard for Diner pages.
- **PublicGuard ([PublicGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/PublicGuard.tsx))**: Replaces `PublicRoute.tsx` to handle public/auth redirects and routes customer users to `/customer/home`.

### Fixed
- **Auth Context Race Condition**: Refactored `AuthContext.tsx` with localized try-catch blocks and a default `'customer'` role fallback.
- **Rules Exception Handling**: Updated `firestore.rules` helpers `hasRole()` and `isTenant()` with defensive `userExists()` checks to avoid security rules evaluator crashes.
- **Mock Developer Override**: Fixed `AuthContext.tsx` initialization early-return so mock developer sessions do not block real Firebase logins or deactivate auth state listener updates.

## [1.5.0] - 2026-07-04 (Complete Customer Authentication Flow)

This release implements a secure B2C Customer journey using live Firebase Auth and Firestore profiles.

### Added
- **Customer Registration Page ([CustomerRegister.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerRegister.tsx))**: Forms for Full Name, Email, Password, Confirm Password, and Phone Number.
- **Firebase Auth Persistence**: Binds customer logins, handles credentials lookups, and auto-populates diner names in checkouts.

### Fixed
- **Routing Protection**: Configured `ProtectedRoute` to redirect unauthenticated diners to `/customer/login`.
- **Diner Credentials validation**: Returns "Account not found" and register buttons during login errors.

---

## [1.4.0] - 2026-07-04 (B2B/B2C Entry Experience)

This release ships the dual-experience Landing Page and customer portals routes, separating the Diner ordering flows from Merchant SaaS onboarding.

### Added
- **Dual experience Landing Page ([LandingPage.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/landing-page/LandingPage.tsx))**: Supports theme switching, and B2B/B2C action cards with animations.
- **Customer Sign In page ([CustomerLogin.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerLogin.tsx))** and Home portal ([CustomerHome.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerHome.tsx)).

---

## [1.3.0] - 2026-07-03 (Automated Data Seeder Integration)

This release integrates the automated data seeder that sets up a complete test environment upon new owner signup or trigger.

### Added
- **Expanded Seed Script ([seed.ts](file:///C:/Users/Geetha%2520Krishna/OneDrive/Desktop/Project%2520Saas%2520for%2520all/src/firebase/seed.ts))**: Added 25 menu items, 8 Free tables, 6 employee roles, 10 active/completed sample orders, and 20 raw inventory items.
- **Auto-Trigger Signup**: Automatically executes the data seeder for fresh tenants upon owner registration, with duplicates collision protection.

---

## [1.2.0] - 2026-07-03 (Firebase SDK & Modular Services Integration)

This release connects the application to Firebase services, shifting from hardcoded mock values to real-time collections with safety rules.

### Added
- **Centralized Firebase Structure**: Created `src/firebase/` directory containing config initializations, auth handlers, firestore CRUD classes, and collection paths helpers.
- **Environment variables mapping ([.env.example](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/.env.example))**: Ensures secure modular SDK executions.
- **Interactive database seeding ([seed.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/firebase/seed.ts))**: Single-click Gourmet Palace seeding panel mounted inside the Super Admin dashboard.
- **Firestore Security Rules ([firestore.rules](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/firestore.rules))**: Absolute multi-tenant tenant isolation and role-based permissions gates.
- **Guide documentation ([README.md](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/README.md))**.

---

## [1.1.0] - 2026-07-02 (Phase 2 & 3 Complete - Operational & SaaS Platform)

This release ships the complete merchant operational engines (Menu CRUD, Diner Scan pages, local cart persistent queues, real-time Kitchen tickets preparer boards, and Waiter seating grids) alongside the global SaaS Super Admin platform.

### Added
- **SaaS Platform Command Deck ([SuperAdminOverview.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/super-admin/components/SuperAdminOverview.tsx))**: Supports platform MRR/ARR aggregations, support tickets queue resolution, feature flags toggling, platform settings overrides, and security logs auditing.
- **Merchant Workspace Manager ([SuperAdminTenants.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/super-admin/components/SuperAdminTenants.tsx))**: Supports tenant creation, updates, suspensions/activations, plan tier changes, and expiration monitoring.
- **Waiter delivery matrices ([WaiterMatrix.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/waiter-dashboard/components/WaiterMatrix.tsx))** and alerts hubs ([WaiterAlerts.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/waiter-dashboard/components/WaiterAlerts.tsx)).
- **Real-time Kitchen Prep ticketing board ([KitchenQueue.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/kitchen-dashboard/components/KitchenQueue.tsx))**.
- **Owner Dashboard KPIs ([OwnerOverview.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerOverview.tsx))**, employee CRUD rosters ([OwnerStaffManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerStaffManager.tsx)), table layout maps ([OwnerTablesManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerTablesManager.tsx)), and inventory low-stock alarms ([OwnerInventoryManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerInventoryManager.tsx)).
- **Zod Resolvers**: Programmed a custom [zodResolver.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/utils/zodResolver.ts) for validation.

### Fixed
- **Missing Imports**: Added missing `SearchBar` import statement in [OwnerInventoryManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerInventoryManager.tsx).
- **TypeScript definitions**: Aligned `IOrder` interface status fields inside [index.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/types/index.ts) to match active kitchen/waiter order tickets.

---

## [1.0.0-phase1] - 2026-07-02 (Phase 1 Baseline Complete)

This release establishes the complete system foundation, configuration, routing architecture, global providers, UI kit components library, and the fully-integrated Authentication module.

### Added
- **Configuration Layers**: Enabled `@/*` path alias mapping in `tsconfig.json` and resolved URL routing configurations in `vite.config.ts`.
- **System Contexts**: Integrated `ThemeProvider`, `UserProvider`, `RestaurantProvider`, and Firebase-backed `AuthProvider`.
- **Custom Hooks**: Created `useTheme`, `useRestaurant`, `usePermissions`, and `useLocalStorage`.
- **Routing & Guards**: Set up client routing matrix in `AppRoutes.tsx` including `/maintenance`, `/unauthorized`, and `/session-expired` routes, secured with `ProtectedRoute` and `PublicRoute` guards.
- **Visual Dashboard Layouts**: Developed role-based shell structures for Customer, Kitchen, Waiter, Owner, Manager, and Super Admin views.
- **Shared UI Kit**: Implemented 20+ stateless accessible components:
  - Form Fields: `Button`, `Input`, `TextArea`, `Select`, `Checkbox`, `Switch`.
  - Indicators: `Badge`, `Avatar`, `Skeleton`, `LoadingSpinner`.
  - Content Frames: `Card`, `Table`, `Pagination`, `Tabs`, `Breadcrumb`, `EmptyState`, `ErrorState`.
  - Modals & Triggers: `Modal`, `Dialog` (Confirmation), `Dropdown`, `ToastContainer`.
- **Services Wrappers**: Added Firebase SDK stubs (`dbService.ts`, `storageService.ts`) and completed the Firebase Authentication manager (`authService.ts`).

### Modified
- Swapped out temporary mock context providers for real-time Firebase Auth listeners that resolve custom JWT claims and execute Firestore collection lookups on state change.
- Re-routed authorization entry points to redirect logged-in users back to their default dashboard shells.
