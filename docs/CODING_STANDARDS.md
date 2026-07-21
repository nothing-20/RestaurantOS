# Coding Standards & Conventions: RestaurantOS

This document specifies the TypeScript code quality guidelines, naming conventions, directory rules, and import patterns of **RestaurantOS** (v2.0-rc).

---

## 1. TypeScript & Code Quality Rules

- **Strict Typing**: Set `"strict": true` in `tsconfig.json`. The usage of `any` is strictly prohibited. All props, callback variables, and states must have explicit TypeScript types.
- **Null Safety**: Always use optional chaining (`?.`) and nullish coalescing (`??`) when reading Firestore document parameters to prevent app crashes if values are missing.
- **Interfaces Prefix**: Interface definitions should prefix with `I` (e.g. `interface IMenuItem`) and custom type declarations with `T` (e.g. `type TTableStatus`).

---

## 2. Naming Conventions

The codebase implements strict naming conventions:

* **React Components**: PascalCase (e.g. `KitchenQueue.tsx`, `OwnerSettings.tsx`).
* **Source Directories**: lowercase-kebab-case (e.g. `customer-portal`, `design-system`).
* **Custom Hooks**: camelCase starting with `use` (e.g. `useCurrentUser.ts`, `useRealtime.ts`).
* **Variables & Functions**: camelCase (e.g. `const subtotalAmount = calculateTotal()`).
* **Constants**: UPPER_SNAKE_CASE (e.g. `const TAX_RATE_PERCENTAGE = 5.0`).
* **CSS Classes**: standard Tailwind CSS utility classes.

---

## 3. Directory Layout Guidelines

Maintain feature-based folder organization inside React to isolate domain logic:
```text
src/
├── apps/               # Portals pages entries
│   ├── customer/       # Diner mobile pages
│   └── owner/          # B2B dashboards pages (KDS, Waiter maps)
└── shared/             # Cross-application shared folder
    ├── domain/         # Schemas definitions & data validation types
    ├── ui/             # Reusable UI primitives
    └── services/       # Unified API services wrappers
```

### Component Placement Rule
Components inside a feature folder (e.g., KDS ticket card) must never import components directly from another feature folder (e.g., Waiter map). Shared elements must be placed in `src/shared/ui/` to ensure modularity.

---

## 4. Clean Imports Order

Organize file imports using a consistent structure:
1. React core libraries and third-party packages (e.g., `react`, `react-router-dom`, `firebase/auth`).
2. Config files and singleton loaders (e.g., `src/config/firebase`).
3. Shared contexts and custom hooks (e.g., `src/shared/hooks/useFirestore`).
4. Reusable UI components and visual assets.
5. Typings and formatting helpers.
