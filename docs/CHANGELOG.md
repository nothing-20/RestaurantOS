# Changelog: RestaurantOS

All notable changes to the **RestaurantOS** repository will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to Semantic Versioning.

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
