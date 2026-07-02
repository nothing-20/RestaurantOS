# AI Developer Instructions: RestaurantOS

> [!IMPORTANT]
> **COMPULSORY PRE-FLIGHT ACTION**: Read this entire document before generating, editing, or refactoring any code in this repository. Ensure absolute compliance with the defined patterns and restrictions.

---

## 1. Project Overview & Multi-Tenant Model

**RestaurantOS** is a multi-tenant SaaS Restaurant Management System. 
- **Tenancy Architecture**: Single shared database instance utilizing **logical partitioning**. Every database collection and document representing a restaurant resource (menus, orders, tables, inventory, etc.) MUST contain a `tenantId` string field.
- **Access Scope**: The platform serves six distinct roles (Super Admin, Owner, Admin, Waiter, Kitchen, Customer) through optimized role-based dashboards in a single React SPA.

---

## 2. Current Development Metadata

- **Current Phase**: **Phase 1 Complete - Ready for Phase 2**
- **Last Completed Task**: Established complete workspace configuration layouts, path aliases, UI kit primitives, contexts, hooks, and Auth module views.
- **Current Active Task**: Awaiting feature implementation.
- **Next Developer Task**: Begin Phase 2: Implement operational dashboard features (Menu editor CRUD, tables list, and active kitchen prep queues).


---

## 3. Directory & Folder Blueprint

All code additions must fit into this feature-first directory layout:

```text
src/
├── components/            # Reusable layout and base UI primitives
│   ├── ui/                # Stateless buttons, inputs, modals (no Firestore inputs)
│   └── layout/            # Sidebar, Navbars, main dashboard shells
├── config/                # Firebase and service config initializers
├── context/               # AuthContext, TenantContext, CartContext
├── features/              # Modular business domain folders
│   ├── auth/              # Registration and login logic
│   ├── customer-portal/   # QR table ordering, cart, live status tracking
│   ├── owner-dashboard/   # Menu builder, staff directories, billing portal
│   ├── kitchen-dashboard/ # Live ticket queues, stock toggle triggers
│   ├── waiter-dashboard/  # Tablet table status grid, manual orders
│   └── super-admin/       # Tenant list, MRR metrics, billing bypass
├── hooks/                 # Custom hooks (e.g. useOrdersListener)
├── routes/                # Client-side router guards
├── services/              # External APIs (Stripe handlers)
├── types/                 # Shared TypeScript models
└── utils/                 # Pure helper functions (formatters, calculations)
```

---

## 4. Logical Firestore Schemas Summary

Always respect field definitions when writing DB adapters:
1. **`/tenants/{tenantId}`**: Core restaurant profile containing `planTier` and `stripeCustomerId`.
2. **`/users/{uid}`**: User profiles maps to Firebase Auth, containing `role` and `tenantId`.
3. **`/menus/{menuId}`**: Menus containing subcollections `categories` and `items`.
4. **`/orders/{orderId}`**: Order collection. Contains `tenantId`, `tableId`, and `items` array with customized choices and cost snapshots.
5. **`/tables/{tableId}`**: Dining table states (`empty`, `occupied`, `service_requested`, `bill_requested`).
6. **`/inventory/{ingredientId}`**: Ingredient volumes and thresholds.

---

## 5. UI & Design System Rules

- **Theme Style**: Sleek, modern dark-glass UI.
- **Primary Color Accents**: Radiant Amber (`hsl(35, 92%, 50%)`) & Emerald Glow (`hsl(142, 72%, 40%)`).
- **Core Background**: Slate Dark (`hsl(222, 47%, 11%)`) combined with glass overlay structures (`bg-slate-900/60 backdrop-blur-md border border-slate-800/50`).
- **Typography**: Outfit for headers, Inter for normal copy and input text fields.

---

## 6. Critical Rules: Things the AI Must NEVER Change

> [!WARNING]
> **Bypassing the following rules will trigger security vulnerabilities and operational failures.**

1. **Multi-Tenant Logical Queries**: You must NEVER fetch, update, or listen to collections (menus, orders, tables, etc.) without filtering by the active `tenantId`. All queries must include the `.where('tenantId', '==', tenantId)` filter.
2. **Price Unit Format**: NEVER represent currency or price values as floating-point numbers (`12.50`). All database and pricing states must utilize **integer cents** (`1250`). Price styling must be handled only at the final display render level via `formatPrice`.
3. **Firestore Security Rule Integrity**: Do not write client code that attempts to bypass Firebase role constraints (e.g. fetching items from users collections directly). All reads/writes must align with matching JWT custom claims.
4. **Docs and Logs Integrity**: Do not delete or overwrite documents in [docs/](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/) without updating the [DEVELOPMENT_LOG.md](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/DEVELOPMENT_LOG.md). Any change to schemas, APIs, or routes MUST be written to the docs folder immediately.

---

## 7. Things the AI is Allowed to Create

1. New layout wrappers and sub-components inside feature domains (`src/features/*`).
2. Stateless primitives inside UI kits (`src/components/ui/*`).
3. Custom hooks wrapping Firestore snapshots, collections caching, or window listener bindings.
4. Utility scripts for validation, tax multipliers, or Stripe checkout redirects.
5. Setup models and TS interface objects under `src/types/`.

---

## 8. Coding Standards Reference
- **Strict TypeScript**: Do not use `any`. Specify precise interfaces for all props, states, and return parameters.
- **Functional React**: Write pure, hooks-driven React components (`const Component: React.FC = () => {}`).
- **HTML Semantics**: Interactive click triggers must be `button` tags. Provide `alt` descriptions to image parameters.
- **Tailwind Class Merges**: Always wrap component tailwind class arrays with the `cn(...)` utility function to prevent duplicate styling attributes.
