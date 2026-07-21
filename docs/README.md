# RestaurantOS: Documentation Hub & Project Guide

Welcome to the official documentation for **RestaurantOS**—a production-grade, multi-tenant B2B/B2C Restaurant SaaS Platform. This documentation serves as a comprehensive resource for developers, operators, and administrators to understand, run, develop, and deploy the platform.

---

## 📚 Documentation Index

Use the links below to navigate the system documentation:

| Document | Description |
| :--- | :--- |
| 🏗️ [System Architecture](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/SYSTEM_ARCHITECTURE.md) | High-level system design, data flows, and sub-systems diagrams. |
| 🗄️ [Database Schema](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/DATABASE_SCHEMA.md) | Firestore collections structure, relationships, and security policies. |
| 🔌 [API Reference](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/API_REFERENCE.md) | Firestore wrapper services, parameter descriptions, and return types. |
| 🔐 [Authentication](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/AUTHENTICATION.md) | Universal login, registration, invite flows, and token claims verification. |
| 🏢 [Multi-Tenant Architecture](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/MULTI_TENANT_ARCHITECTURE.md) | Data isolation strategy, tenant-based routing, and billing limits. |
| 📱 [Customer Portal](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/CUSTOMER_PORTAL.md) | Mobile-first diner experience, ordering workflows, and table checkouts. |
| 💼 [Owner Dashboard](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/OWNER_DASHBOARD.md) | Executive cockpit, menu/table managers, inventory, and strategy panels. |
| 💁 [Waiter Dashboard](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/WAITER_DASHBOARD.md) | Handheld tablet floor maps, pickup alerts, task matrices, and POS desk. |
| 🍳 [Kitchen Dashboard](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/KITCHEN_DASHBOARD.md) | Kitchen Display System (KDS) queues, batch aggregators, and metrics. |
| 🛡️ [Super Admin Dashboard](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/SUPER_ADMIN.md) | Master SaaS control panel, tenant index, and subscriptions overrides. |
| 🎨 [Component Library](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/COMPONENT_LIBRARY.md) | Reusable design system primitives, layout shells, and theme CSS rules. |
| 🛣️ [Routing Grid](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/ROUTING.md) | AppRoutes tree, guards mapping, and page redirection matrix. |
| 💾 [State Management](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/STATE_MANAGEMENT.md) | Zustand stores, Context configurations, and realtime updates. |
| 📁 [Folder Structure](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/FOLDER_STRUCTURE.md) | Clean-code directory map and architectural layouts. |
| 📊 [Features Checklist](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/FEATURES.md) | Release features catalog (Completed, In Progress, Planned). |
| ⚠️ [Known Issues](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/KNOWN_ISSUES.md) | Active sandbox limits, debug registry, and potential fixes. |
| 📜 [Changelog](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/CHANGELOG.md) | Semantic version release history (from v1.0.0 to v2.0.0-rc). |
| 🧪 [Testing Guide](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/TESTING_GUIDE.md) | Manual verification procedures and automated test suites. |
| 🔒 [Security System](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/SECURITY.md) | Authorization controls, Firestore Security Rules, and input checks. |
| 🚀 [Deployment Guide](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/DEPLOYMENT.md) | Production build pipeline and Firebase hosting configurations. |
| 🗺️ [Roadmap](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/ROADMAP.md) | Development milestones, future integrations, and version objectives. |
| 📊 [Project Status](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/PROJECT_STATUS.md) | Detailed metrics for components, pages, routes, hooks, etc. |
| 📈 [Module Completion](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/MODULE_COMPLETION.md) | Completion status of Customer, Owner, Waiter, KDS, and Admin portals. |
| 🔥 [Firebase Setup](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/FIREBASE_SETUP.md) | Detailed project initialization, DB enabling, rules & indexing rules. |
| 🎨 [UI Guidelines](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/UI_GUIDELINES.md) | Typography, colors, breakpoints, layouts, and micro-animations rules. |
| 💻 [Coding Standards](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/CODING_STANDARDS.md) | strict TypeScript rules, component files structure, and naming conventions. |
| 🤝 [Contributing Guide](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/CONTRIBUTING.md) | Git flow branching, pull request instructions, and conventional commits. |
| 📋 [Release Checklist](file:///c:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/RELEASE_CHECKLIST.md) | pre-release checklists, tests checks, rules validations, and rollbacks. |

---

## 1. Project Overview & Vision

**RestaurantOS** is a multi-tenant B2B/B2C SaaS Restaurant Management System designed to handle end-to-end operations for restaurants of any scale. The platform operates on a shared-infrastructure model powered by Google Firebase, offering logical tenant separation to keep merchant databases isolated, secure, and compliant.

The primary vision is to serve as the unified operating system for restaurants. From the moment a customer scans a tableside QR code to browse menus to the moment an owner reviews daily analytics briefs or triggers automated business decisions, RestaurantOS connects every point of interaction in real time.

## 2. Problem Statement

Historically, hospitality operators utilize fragmented systems to manage their businesses:
- Independent marketing websites that require manual syncing.
- Traditional paper menus that waste printing costs and slow updates.
- Stationary Point-of-Sale (POS) terminal desks causing servers to sprint back and forth.
- Fragmented, noisy paper kitchen printers that jam or drop tickets.
- Offline stock ledger binders that lead to critical ingredient shortages during busy rushes.
- Detached credit card terminals that complicate reconciliation and splitting checks.

These disconnected systems increase labor overhead, extend diner waiting times, and reduce overall table turnover velocities.

## 3. Solution

RestaurantOS aggregates all operations into a single, synchronized application state:
1. **Diners (B2C)** scan a table QR code, browse a localized digital menu, place custom orders, pay via Stripe, and track cooking progress directly on their mobile browsers.
2. **Kitchen Staff (B2B)** manage cooking queues via touch-screen Kitchen Display Systems (KDS) featuring batch counters, station sorting, and priority matrices.
3. **Waiters (B2B)** use a handheld table dashboard to monitor alerts (Ready pick-ups, call waiter bells, checkout requests) and process manual checkouts.
4. **Owners (B2B)** navigate an Executive Cockpit containing real-time health gauges, daily metrics reports, calendar planners, menu managers, stock controllers, and strategic AI-driven growth recommendations.

---

## 4. Key Features

* **Logical Multi-Tenancy**: Automated workspace onboarding in under 5 minutes with sub-routing slugs and absolute Firestore validation rules.
* **Direct Real-Time Data Sync**: Firestore Snapshot listeners pushing state updates in under 200ms across customer checkouts, KDS screens, and waiter devices.
* **Command Center Cockpit**: Unified executive overview featuring daily greet metrics, an interactive Decision Feed log, and circular health scores.
* **Ctrl+K Command Palette**: A keyboard-driven global search bar matching dining tables, active menu items, ingredients, and staff.
* **Interactive 2D Table Map**: Drag-and-drop floor planners for owners with automated canvas QR code exporters.
* **SaaS Billing & Subscriptions**: Stripe payments gateway managing monthly tiers (Starter, Pro, Enterprise) linked to workspace resource limits.
* **Background Automation Runner**: Nightly stock checks, expiration notifications, daily briefings builder, and rules configurator.
* **Sandbox Demo Simulator**: Single-click seeder populating complete preset menus, inventory, staff shifts, and reviews.

---

## 5. Technology Stack

- **Frontend**: React 18, TypeScript, Vite (fast builder), Tailwind CSS (sleek dark aesthetic styling).
- **Backend Core**: Google Firebase.
  - **Cloud Firestore**: Realtime NoSQL document store with Indexing rules.
  - **Firebase Auth**: JWT authentication supporting Custom Claims mapping.
  - **Firebase Storage**: Media bucket hosting menu graphics and restaurant logos.
  - **Firebase Hosting**: High-speed globally distributed CDN edge caching.
- **State Management**: Zustand (for lightweight global UI state) + React Context (for workspace verification, active sessions, and tenant themes).
- **Payment Processing**: Stripe API (subscription plans and mobile diner element portals).

---

## 6. Installation & Running Locally

### Prerequisites
- Node.js v18 or later installed.
- npm or yarn package manager.
- A Firebase Project set up in the Firebase Console.

### Step 1: Install Dependencies
Clone the repository and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file at the project root based on `.env.example`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id_here
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` to access the application.

### Step 4: Build for Production
```bash
npm run build
```
This generates an optimized production bundle inside the `dist/` directory, ready to deploy.

---

## 7. Development Workflow

1. **Feature Layouts**: Write modular code under `src/apps/` for application pages, and place shared components inside `src/shared/ui/`.
2. **Context & Services**: Place all API wrappers inside `src/shared/services/` and database configurations under `src/firebase/`.
3. **Typing**: Avoid using `any`. Write custom TypeScript interfaces under `src/shared/domain/` to model database schemas.
4. **Commits**: Follow conventional commits naming rules (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 8. License & Contributors

* **Contributors**: Lead Software Architect, Antigravity AI Partner.
* **License**: Private Commercial Software. All rights reserved.
