# Architectural Decisions: RestaurantOS

This document serves as the Architectural Decision Records (ADR) registry. It catalogs key design and technology selections made by the Lead Software Architect, along with their business justifications, alternative choices considered, and long-term impacts on performance and maintenance.

---

## ADR-001: Firebase Backend Platform Choice

* **Status**: Approved
* **Date**: 2026-07-02
* **Decider**: Lead Software Architect

### Decision
Use Google Firebase (Authentication, Firestore, Storage, and Hosting) as the primary backend platform instead of building a custom Node.js/PostgreSQL backend from scratch.

### Reason
- **Speed to Market**: Firebase abstracts server maintenance, connection pooling, security token signing, and database scaling.
- **Out-of-the-box Real-time Sync**: Firestore's snapshot listeners allow instant synchronization of orders from customers to kitchen and waiter screens without setting up custom WebSockets.
- **Operational Cost**: Generous free-tier limits, scaling dynamically under pay-as-you-go, keeping startup infrastructure costs low.

### Impact
- Direct client-to-database communication secured through Firestore Security Rules.
- Frontend developers write database queries directly inside hooks, reducing the need for double-maintaining REST endpoints.
- Heavy reliance on Firebase client libraries increases the final frontend bundle size.

### Alternatives Considered
- **Custom Node.js + Express + PostgreSQL + Socket.io**: Better data relational integrity, but introduces high maintenance overhead, manual database migrations, server scaling tasks, and server hosting fees early on.

---

## ADR-002: Logical Tenant Partitioning in Firestore

* **Status**: Approved
* **Date**: 2026-07-02
* **Decider**: Lead Software Architect

### Decision
Implement Logical Multi-Tenancy by storing all restaurant tenant data in a shared Firestore collection layout where each document contains a indexed `tenantId` field. 

### Reason
- **Low Database Management Overhead**: Creating, updating, or querying across restaurants (for global super-admin stats or cross-branch metrics) is extremely simple.
- **Cost Efficiency**: Creating a separate Firestore instance or Firebase project per restaurant is highly expensive, introduces orchestration scripts, and breaks global schema updates.
- **Stripe Subscriptions**: Logical partitioning maps directly to Stripe subscriptions by checking the `tenantId` document status before allowing writes.

### Impact
- Developers must never write a Firestore query that filters on tenant collections without appending a `.where('tenantId', '==', currentTenantId)` check.
- Firestore Security Rules must act as a hard boundary to verify `request.auth.token.tenantId == tenantId` for all authenticated writes.

### Alternatives Considered
- **Physical Multi-Tenancy (Project Per Tenant)**: High security isolation, but massive configuration overhead. Not viable for a high-volume self-serve SaaS model.
- **Database Partitioning (Collection Per Tenant)**: Leads to schema fragmentation and limits Firestore scalability limits.

---

## ADR-003: Zustand for Global Client State

* **Status**: Approved
* **Date**: 2026-07-02
* **Decider**: Lead Software Architect

### Decision
Use **Zustand** for global client-side state management instead of Redux or Redux Toolkit.

### Reason
- **Minimal Boilerplate**: Zustand does not require actions, reducers, payload types, or context wrappers. A store is initialized with a simple hook.
- **Performance**: Prevents unnecessary React re-renders by default using selector-based state subscriptions.
- **Learning Curve**: Simplifies onboarding of new developers and speeds up code generation by AI assistants.

### Impact
- Avoids the nesting of context providers in `App.tsx`.
- Highly modular; we can create separate stores for `useCartStore`, `useUiStore`, and `useKitchenStore`.

### Alternatives Considered
- **Redux Toolkit**: Too heavy and verbose for a Vite/React application that relies on Firestore for real-time data persistence.
- **React Context API**: Good for static state (like themes or authentication status) but causes performance bottlenecks (re-render cascades) when dealing with fast-changing UI states (like interactive shopping carts).

---

## ADR-004: Feature-Based Code Directory Layout

* **Status**: Approved
* **Date**: 2026-07-02
* **Decider**: Lead Software Architect

### Decision
Organize code inside the `src/` folder by *feature domain* (e.g., `features/customer-portal/`, `features/kitchen-dashboard/`) rather than by technical type (e.g., `pages/`, `components/`, `api/`).

### Reason
- **Scalability**: As the app expands to include 6 distinct user portals, finding file relationships becomes difficult if all components are mixed in a global folder.
- **Code Portability**: The kitchen dashboard code is entirely isolated from the customer portal code. Removing or refactoring a single dashboard does not break other modules.
- **Collaboration**: Multiple AI agents and developers can work on separate dashboards simultaneously without merge conflicts in shared folders.

### Impact
- Component reuse across features is handled by moving items into the global `src/components/` folder.
- Developers must follow clean imports, avoiding importing components from `features/kitchen-dashboard` into `features/customer-portal`.

### Alternatives Considered
- **Standard Layered Directory (Components / Containers / Pages)**: Clutters quickly when maintaining six distinct interfaces in a single SPA.
