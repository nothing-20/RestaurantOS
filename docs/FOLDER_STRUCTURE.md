# Folder Directory Structure: RestaurantOS

This document specifies the file directory layout and codebase folder architecture of **RestaurantOS** (v2.0-rc).

---

## 1. Directory Tree Map

```text
RestaurantOS/
├── .agents/                    # Workspace agent guidelines & contexts
├── docs/                       # Project documentation & releases logs
├── public/                     # Static client files (favicons, browser manifest)
├── src/
│   ├── config/                 # Service loaders & initialization (Firebase)
│   ├── routes/                 # Routing grid & guards validation layers
│   │   ├── AdminGuard.tsx      # SaaS administrator authorization gate
│   │   ├── OwnerGuard.tsx      # Restaurant owners authentication gate
│   │   ├── WorkspaceGuard.tsx  # Workspace subscription validation gate
│   │   └── AppRoutes.tsx       # Centralized route tree matrix
│   ├── apps/                   # Gated applications page entries
│   │   ├── customer/           # Diner mobile-browser pages
│   │   │   └── pages/          # Menu, Cart, Checkout, Order Tracking
│   │   ├── owner/              # B2B dashboards pages
│   │   │   ├── kitchen/        # KDS queues, batching, stats bar
│   │   │   ├── waiter/         # Table maps, POS, pickup queue
│   │   │   └── pages/          # Overview cockpit, stock, staff roster
│   │   └── super-admin/        # SaaS administrator pages
│   └── shared/                 # Reusable cross-application library
│       ├── design-system/      # HSL design tokens & global CSS styles
│       ├── domain/             # Schema definitions and data models
│       ├── hooks/              # Custom React hooks (useFirestore query wrappers)
│       ├── services/           # Backend API adapters (Auth, menu, orders)
│       ├── ui/                 # Design system base primitives
│       │   ├── buttons/        # Stateless button classes
│       │   ├── cards/          # Glassmorphism visual card boards
│       │   ├── dialogs/        # backdrop blur modal drawers
│       │   ├── empty-states/   # fallbacks alerts screens
│       │   ├── layouts/        # AppLayout shell components (Sidebar)
│       │   └── skeletons/      # shining pulsing pending loading bars
│       └── utils/              # Price formatting helpers
├── firestore.rules             # Multi-tenant security rules
├── package.json                # Dependencies manifest
└── vite.config.ts              # Vite configuration
```

---

## 2. Directory Purpose Breakdown

### `src/apps/`
Contains page entry files partitioned by user role:
- **`customer/pages/`**: Mobile-first screens for diners tableside.
- **`owner/pages/`**: Command panels for owners to configure menus, manage staff, inspect inventory, and view analytics.
- **`owner/kitchen/`**: KDS touchscreens views.
- **`owner/waiter/`**: Waiter service command centers and POS desking tables grids.
- **`super-admin/pages/`**: SaaS platform operators overview controls.

### `src/shared/`
Shared core library:
- **`ui/`**: Stateless, presentational components (buttons, cards, dialogs, forms, badges, calendars). Decoupled from backend calls, they only receive details via props and communicate interactions via callbacks.
- **`domain/`**: Centralized typescript schemas and data validation models.
- **`services/`**: API wrapper layer connecting client portals to Firebase.
- **`hooks/`**: Custom hooks (e.g. `useCurrentUser`, `useCurrentRestaurant`).

### `src/config/`
Firebase configuration singleton scripts initializing instances of auth, firestore database, and media storage.

### `src/routes/`
Centralizes route grids and guard interceptors checking roles, active statuses, and billing tiers.
