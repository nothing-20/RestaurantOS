# Component Library: RestaurantOS Design System

This document specifies the design tokens, reusable UI primitives, layout shells, and styling standards of **RestaurantOS** (v2.0-rc).

---

## 1. Visual Token System (`tokens.ts`)

RestaurantOS implements a dark-glass aesthetic built on HSL design tokens integrated with Tailwind CSS configurations:

* **Background Dark**: `hsl(222, 47%, 11%)` (Slate black base)
* **Glass Panel Overlay**: `hsla(222, 47%, 11%, 0.7)` with backdrop blur (`blur-md`)
* **Primary / Accent Color**: Radiant Amber (`hsl(35, 92%, 50%)`)
* **Success Glow Accent**: Emerald Glow (`hsl(142, 72%, 40%)`)
* **Text Pearl**: `hsl(210, 40%, 98%)` (High-contrast white-silver)
* **Muted Ash Text**: `hsl(215, 20%, 65%)` (Secondary info slate gray)
* **Borders Slate**: `hsla(217, 30%, 20%, 0.5)` (Thin subtle glass partitions)

---

## 2. Reusable Primitives Directory (`src/shared/ui/`)

All base primitives are stateless, receiving callbacks and styling classes through React properties.

### Buttons (`src/shared/ui/buttons/`)
* **Button Component**: Implements a standard button with primary, secondary, danger, and outline variants.
* **Properties**:
```typescript
interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

### Cards (`src/shared/ui/cards/`)
* **Card Component**: Renders standard containers with glassmorphism backgrounds.
* **Sub-elements**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.

### Badges (`src/shared/ui/badges/`)
* **Badge Component**: Displays status indicators (e.g. priority levels, order status).
* **Styles**: Color-coded dynamically (Green for Completed/Paid, Yellow for Preparing/Pending, Red for Alert/Critical/Delayed).

### Modals & Dialogs (`src/shared/ui/dialogs/`)
* **Dialog Component**: Gated modals overlaying a dark backdrop blur (`backdrop-blur-sm`).
* **Sub-elements**: Includes header, action buttons, close controls, and auto-dismiss settings.

### Inputs & Forms (`src/shared/ui/inputs/` & `src/shared/ui/forms/`)
* **FormField**: Wraps standard input fields, handling validation messages, floating text labels, and error states.
* **DropdownSelect**: Select element supporting custom styling overrides.

### Skeletons & Loaders (`src/shared/ui/skeletons/` & `src/shared/ui/loading/`)
* **SkeletonLine**: Animates a shining pulsing bar to indicate pending content.
* **LoadingSpinner**: Standard infinite SVG rotation loading wheel.
* **EmptyState Overlay**: Displays a fallback container with icons, descriptive text, and customizable call-to-action buttons.

---

## 3. Complex Shared UI Elements

### Activity Feed (`src/shared/ui/feedback/ActivityFeed.tsx`)
* **Description**: Subscribes to `/events` and displays a chronological log of operations events.
* **Features**: Live updates, category filters, and search.

### Layout Shells (`src/shared/ui/layouts/`)
* **DashboardLayout**: Left-hand sidebar on desktop, bottom navigation on mobile. Renders sub-views inside an `<Outlet />` tag.
* **CustomerLayout**: Clean mobile viewport wrapper with sticky header and cart widgets.
