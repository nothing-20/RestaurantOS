# Component Design Guidelines: RestaurantOS

To maintain frontend code cleanliness and UI consistency across the 6 dashboard systems, developers and AI agents must write React components in compliance with the following guidelines.

---

## 1. Directory Placement Rules

* **Base UI Elements (`src/components/ui/`)**: Pure stateless presentational primitives. No external data requests or Firestore imports.
  - *Examples*: Button, Input, Badges, Modals, Skeleton Loaders.
* **Layout Blocks (`src/components/layout/`)**: Application structures wrapping core views.
  - *Examples*: Sidebars, Headers, Dashboard shells.
* **Feature Elements (`src/features/{feature-name}/components/`)**: Composed components bound to a specific business area.
  - *Examples*: `features/customer-portal/components/MenuGrid.tsx`, `features/owner-dashboard/components/MenuEditorForm.tsx`.

---

## 2. Component Naming & Layout Template

- Always use **PascalCase** for folders and file names (e.g., `src/components/ui/OrderCard/OrderCard.tsx`).
- Keep interface props colocated in the same component file or in a sister file named `[ComponentName].types.ts` if the file length exceeds 150 lines.

### Example Template (`src/components/ui/Badge/Badge.tsx`)
```typescript
import React from 'react';
import { cn } from '../../../utils/cn'; // Tailwind merge utility

export interface IBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  isLarge?: boolean;
}

export const Badge: React.FC<IBadgeProps> = ({
  children,
  variant = 'muted',
  isLarge = false,
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300';
  
  const variants = {
    primary: 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm shadow-amber-500/10',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/10',
    warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-sm',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm',
    muted: 'bg-slate-800 text-slate-400 border border-slate-700/50'
  };

  const sizes = isLarge ? 'px-3.5 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes, className)}
      {...props}
    >
      {children}
    </span>
  );
};
```

---

## 3. Styling Rules & Overrides

### The `cn` Class Merge Utility
To prevent overlapping Tailwind classes when passing `className` properties down to base components, use the standard `cn` utility located in `src/utils/cn.ts` which combines `clsx` and `tailwind-merge`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Aesthetic Standards
- **Glassmorphism**: Use transparent dark backdrops combined with borders and backdrop blurs to achieve the premium design aesthetic.
  - *Standard Glass Card Class*: `bg-slate-900/60 backdrop-blur-md border border-slate-800/50 shadow-xl shadow-black/25`
- **Focus States**: Never omit interactive focus states. For forms and buttons, implement explicit styling triggers: `focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500`.

---

## 4. State Management Conventions

- **Local UI States**: Keep simple states (toggles, input buffers, local tab targets) within the component using `useState`.
- **Global Shared UI states**: Utilize **Zustand** stores inside `/src/hooks/` (e.g. `useCartStore.ts`).
- **Global System Meta Data**: Use React Context (e.g. `AuthContext`, `TenantContext`) which changes infrequently but is required throughout the view tree.

---

## 5. Accessibility (a11y) Requirements

- **HTML Semantics**: Never use `div` elements for click triggers. If it triggers an action, use a `button` tag.
- **Image Accessibility**: Every static and dynamic menu image must have descriptive `alt` text. Use the menu item name (e.g. `alt={menuItem.name}`).
- **Screen Reader Support**:
  - Interactive status panels must include appropriate labels (e.g., `aria-live="polite"` on active order queues).
  - Wrap close triggers inside modals in tags containing `aria-label="Close modal"`.
  - Use proper header tag sequencing (`h1` down to `h6`). Only one `h1` per page.
