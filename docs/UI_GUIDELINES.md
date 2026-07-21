# UI & Design System Guidelines: RestaurantOS

This document specifies the typography, dark-glass aesthetics, component styles, animations, and responsive layout constraints of **RestaurantOS** (v2.0-rc).

---

## 1. Design Aesthetic: Dark Glassmorphism

RestaurantOS implements a premium, dark-glass visual standard tailored to high-end dine-in establishments. It utilizes HSL tailored colors and backdrop blur filters (`backdrop-blur-md`) to build depth and focus.

```text
Visual Stack:
┌────────────────────────────────────────┐
│ Interactive View Layer (Outfit/Inter)  │
├────────────────────────────────────────┤
│ Glass Overlay Container (slate-900/70) │
├────────────────────────────────────────┤
│ Backdrop Blur Filter (blur-md)         │
├────────────────────────────────────────┤
│ Dark Base Canvas (Slate-950)           │
└────────────────────────────────────────┘
```

---

## 2. Typography & Color Palettes

### Fonts
- **Headers & Display Titles**: `Outfit` (sans-serif, weights: 700, 800, 900) - provides a bold, professional B2B look.
- **Body, Inputs & Labels**: `Inter` (sans-serif, weights: 400, 500, 600) - ensures readability on tablet screens.

### Harmonious Color Token Palette
- **Background Slate**: `hsl(222, 47%, 11%)` (Deep slate black base)
- **Glass Panel**: `hsla(222, 47%, 11%, 0.7)` with `border-slate-800/50`
- **Primary Amber**: `hsl(35, 92%, 50%)` (Used for primary action highlights)
- **Success Emerald**: `hsl(142, 72%, 40%)` (Used for completed orders, active alerts)
- **Text Pearl**: `hsl(210, 40%, 98%)` (High-contrast text)
- **Muted Ash**: `hsl(215, 20%, 65%)` (Secondary descriptions)

---

## 3. Responsive Layout Grid Breakpoints

RestaurantOS is responsive, supporting three device profile configurations using Tailwind layout rules:

| Profile | Target Hardware | Target Width | Layout Behavior |
| :--- | :--- | :--- | :--- |
| **Mobile** | Diners mobile browser | `< 768px` | Single-column stack, sticky bottom carts bar, floating buttons, compact headers |
| **Tablet** | Kitchen touch KDS, Waiter tablet | `768px - 1024px` | ticket grids, touch cards, expandable side drawers, sticky table status matrices |
| **Desktop** | Owner executive console | `> 1024px` | Left-hand sidebar, tabular grids, complex SVG analytics panels, settings forms |

---

## 4. Micro-Animations & Interactivity

To keep the interface responsive and dynamic, the following guidelines apply:
- **Hover Transitions**: Apply transitions (`transition-all duration-300 ease-in-out`) to all links and buttons. Hover actions trigger subtle scaling (`hover:scale-[1.02]`) and brightness enhancements.
- **Pulsing Warnings**: Active delayed KDS tickets or critical notifications trigger pulsing animations (`animate-pulse`) to immediately catch staff attention.
- **Framer Motion**: Page transitions and drawer slide-overs are animated using Framer Motion to ensure smooth visual entry states.
