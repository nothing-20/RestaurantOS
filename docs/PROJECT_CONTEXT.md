# Project Context: RestaurantOS

RestaurantOS is a production-grade, multi-tenant SaaS Restaurant Management System designed to handle end-to-end operations for restaurants of any scale. The platform utilizes logical multi-tenancy, dividing access boundaries per restaurant workspace while utilizing a shared infrastructure model powered by Firebase.

---

## 1. Project Overview & Vision

The vision of **RestaurantOS** is to serve as the unified operating system for restaurants. From the moment a customer scans a QR code to the moment an owner reviews quarterly profit reports, RestaurantOS connects every point of interaction. It reduces operational overhead, eliminates paper menus, tracks inventory in real time, and coordinates kitchen and service staff.

### Core Goals
- **Real-Time Data Sync**: Zero latency between order placement (Customer Portal/Waiter Dashboard), kitchen receipt (Kitchen Dashboard), and order fulfillment.
- **Tenant Isolation**: Complete database and file storage isolation per restaurant workspace to ensure compliance, privacy, and security.
- **Role-Based UI Experience**: Targeted application views customized for specific hardware (e.g., responsive phones for waiters/customers, large touch-screens for the kitchen, desktop screens for owners/super-admins).
- **SaaS Monetization**: A subscription billing model supporting tiered restaurant limits (number of tables, employees, and active menus).

---

## 2. Tech Stack

- **Frontend**: React (v18+), TypeScript, Vite (bundler), Tailwind CSS (styling)
- **Backend & Database**: Google Firebase
  - **Cloud Firestore**: Scalable NoSQL database with real-time listeners.
  - **Firebase Auth**: JWT-based identity and access management.
  - **Firebase Storage**: Cloud storage for menu images and restaurant logos.
  - **Firebase Hosting**: High-speed CDN for app deployment.
- **State Management**: Zustand (for lightweight global UI state) + React Context (for authentication and tenant configuration).
- **Payment Processing**: Stripe API (for SaaS subscription management and Customer Portal checkouts).

---

## 3. Directory Folder Structure

The project implements a feature-based folder structure inside React to isolate domain logic. Developers and AI assistants must follow this structure exactly:

```text
RestaurantOS/
├── docs/                      # The AI Memory & Documentation System
├── public/                    # Static assets (favicons, manifest.json)
└── src/
    ├── assets/                # Global assets (images, fonts, raw stylesheets)
    ├── components/            # Reusable UI component libraries
    │   ├── ui/                # Base primitives (Button, Input, Badge, Card, Select)
    │   ├── layout/            # Shared layouts (Shell, Navbar, Sidebar, Footer)
    │   └── common/            # Shared blocks (Modal, Toast, LoadingSpinner)
    ├── config/                # Service initialization scripts (firebase.ts, stripe.ts)
    ├── context/               # Global React Contexts (AuthContext, TenantContext)
    ├── features/              # Feature modules containing domain-specific code
    │   ├── auth/              # Registration, Login, Onboarding workflows
    │   ├── customer-portal/   # QR Menu browser, Cart, Checkout, Live Tracker
    │   ├── owner-dashboard/   # Menu Editor, Settings, Staff, Subscriptions
    │   ├── kitchen-dashboard/ # Order queues, status tickers, alarm indicators
    │   ├── waiter-dashboard/  # Table status grid, order creation, bill splitters
    │   ├── admin-dashboard/   # Multi-branch logic, deep audit trails
    │   └── super-admin/       # Tenant management, billing administration
    ├── hooks/                 # General-purpose reusable hooks (useFirestoreQuery)
    ├── routes/                # Client-side router configuration (AppRoutes, ProtectedRoute)
    ├── services/              # Shared external APIs (stripeServices.ts)
    ├── types/                 # Global TypeScript interfaces
    ├── utils/                 # General helpers (formatters, mathematical calculators)
    ├── App.tsx                # Application root component
    ├── index.css              # Styling imports and tailwind customizations
    └── main.tsx               # Bootstrap configuration
```

---

## 4. Current Development Status

- **Current Phase**: **Phase 0 - Planning & Architecture (Day 0)**
- **Completed**: Architecture validation, documentation structure, folder planning.
- **Active Focus**: Establishing the core AI documentation system.
- **Next Phase**: Initialize the React + TS project, install Tailwind CSS, and configure Firebase services.

---

## 5. Coding Standards & Naming Conventions

### TypeScript & React Guidelines
- **Strict Typing**: No usage of `any`. All properties, functions, and states must be explicitly typed.
- **Functional Components**: Write components using standard React functional syntax (`const ComponentName: React.FC<Props> = ...`).
- **Hooks over HOCs**: Implement custom hooks to isolate side effects or data fetching.
- **Component File Structure**: Each custom feature component must be in its own directory with its associated CSS or tests if applicable:
  ```text
  components/ui/Button/
  ├── Button.tsx
  ├── Button.types.ts
  └── index.ts
  ```

### Naming Conventions
- **Files & Components**: PascalCase (e.g., `OrderSummaryCard.tsx`, `useAuth.ts` is camelCase since it's a hook).
- **Hooks**: Prefix with `use` (e.g., `useTenantData`).
- **Variables & Functions**: camelCase (e.g., `const totalCartAmount = calculateTotal()`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `const MAX_TABLE_LIMIT = 50`).
- **Types & Interfaces**: PascalCase. Prefix interface names with `I` (e.g., `interface IOrderDetails {}`) and types with `T` if needed.
- **CSS Classes**: Tailwind standard utility classes or lowercase-kebab-case if writing raw CSS.

---

## 6. Color Palette & UI Guidelines

To match a modern, premium dark-glass aesthetic, RestaurantOS relies on a curated HSL color palette.

### Design Tokens (Tailwind Config Reference)
- **Primary / Accent**: Radiant Amber (`hsl(35, 92%, 50%)`) & Emerald Glow (`hsl(142, 72%, 40%)`)
- **Backgrounds**: Slate Dark (`hsl(222, 47%, 11%)`) and Glass Overlay (`hsla(222, 47%, 11%, 0.7)`) with backdrop blur (`blur-md`).
- **Text**: Bright Pearl (`hsl(210, 40%, 98%)`) and Muted Ash (`hsl(215, 20%, 65%)`).
- **Borders**: Slate Border (`hsla(217, 30%, 20%, 0.5)`).

### Visual Standards
- **Typography**: Outfit (Headers) and Inter (Body, Inputs).
- **Interactive States**: Smooth transition timings (`transition-all duration-300 ease-in-out`) on all hoverable elements.
- **Borders & Shadows**: `border-slate-800/50 backdrop-blur-md shadow-lg shadow-black/20` for premium cards.

---

## 7. Roles & Permissions

| Role | Scope | Key Permissions | Allowed Dashboards |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Platform-wide | Manage tenants, view SaaS revenue, override settings | Super Admin Dashboard |
| **Owner** | Single Tenant | Full access to tenant configuration, reports, bills, menus | Owner, Admin, Kitchen, Waiter, Customer |
| **Admin** | Single Tenant | Manage menu items, view local reports, manage staff schedules | Admin, Kitchen, Waiter, Customer |
| **Waiter** | Single Tenant | Create orders, update table status, process payments | Waiter Dashboard, Customer Portal |
| **Kitchen** | Single Tenant | Mark order steps (Preparing, Ready), manage menu stock | Kitchen Dashboard |
| **Customer** | Single Tenant | Browse menu, customize cart, checkout, view order status | Customer Portal |

---

## 8. Firebase Rules Summary

To secure the logical multi-tenancy model, all Firestore documents must contain a `tenantId`.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Check if user is logged in
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user belongs to the requested tenant
    function belongsToTenant(tenantId) {
      return isAuthenticated() && request.auth.token.tenantId == tenantId;
    }
    
    // Check if user has specific tenant-scoped role
    function hasRole(tenantId, role) {
      return belongsToTenant(tenantId) && request.auth.token.role == role;
    }

    // Tenant Profile
    match /tenants/{tenantId} {
      allow read: if true; // Publicly readable for customer routing
      allow write: if hasRole(tenantId, 'owner') || request.auth.token.role == 'super-admin';
    }

    // Menus
    match /menus/{menuId} {
      allow read: if true; // Public access for ordering
      allow write: if hasRole(resource.data.tenantId, 'owner') || hasRole(resource.data.tenantId, 'admin');
    }

    // Orders
    match /orders/{orderId} {
      allow read: if isAuthenticated() && (resource.data.tenantId == request.auth.token.tenantId || resource.data.customerId == request.auth.uid);
      allow create: if true; // Anyone can place order via QR
      allow update: if isAuthenticated() && (resource.data.tenantId == request.auth.token.tenantId);
    }
  }
}
```

---

## 9. Development Workflow

### AI Collaboration Strategy
1. **Context Initialization**: Every AI session must begin with reading `AI_CONTEXT.md`.
2. **Reviewing Code**: Run builds and validation before marking a task as `Completed`.
3. **Document Updates**: When modifying API routes, Firestore schemas, or routes, the AI *must* immediately update the corresponding `.md` documentation file in `docs/` and log the edit in `DEVELOPMENT_LOG.md`.
4. **Pull Requests**:
   - Commits should follow conventional commit style (`feat:`, `fix:`, `docs:`, `refactor:`).
   - The file changes must match the architecture plans outlined in `docs/DECISIONS.md`.
