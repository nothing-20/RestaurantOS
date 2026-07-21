# Roadmap & Product Vision: RestaurantOS

This document specifies the development milestones, future integrations, and version objectives of **RestaurantOS** (v2.0-rc).

---

## 1. Timeline Overview

```mermaid
gantt
    title RestaurantOS Product Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1: Core Foundation
    Auth & Role Guards             :done,    des1, 2026-07-01, 2026-07-03
    Base UI & Seeding              :done,    des2, 2026-07-03, 2026-07-04
    section Phase 2: Operations Sync
    KDS Real-time Queue            :done,    des3, 2026-07-04, 2026-07-05
    Waiter Table alerts            :done,    des4, 2026-07-05, 2026-07-06
    section Phase 3: SaaS Release
    Billing & Shifts POS           :done,    des5, 2026-07-06, 2026-07-07
    Release Candidate 2.0-rc       :active,  des6, 2026-07-07, 2026-07-10
    section Phase 4: Expansion
    Native App launch              :todo,    des7, 2026-07-10, 2026-08-30
```

---

## 2. Version Release History

### Core Version 1.0 (Completed)
- **Role Routing**: Implemented universal login portals (`/staff/login`) and custom claim route guards.
- **Menu and Seating managers**: Built alternating-subcollection Category/Item CRUD editors and drag-and-drop 2D floor table canvas coordinate designers.
- **Diner tableside portal**: Integrated tableside anonymous QR scan redirects (`/r/:tenantId/table/:tableId`), persistent carts, and simulated card checkouts.
- **KDS Cooking display**: Real-time preparing tickets list queues with ticking elapsed time counters.
- **Waiter matrix**: Real-time table occupancy maps and waiter alerts pickup list dashboard.
- **Super-admin platform**: SaaS metrics console with suspend toggles and plan tier overrides.

---

### Platform Version 2.0 (Release Candidate - Current Focus)
- **Executive Command Center Cockpit**: Upgraded the owner dashboard with daily greeting pacing stats, circular health scores, and operational Sparklines graphs.
- **Decision Feed & Action Feed**: Added a real-time event log timeline (`/events`) monitoring shifts, delays, and recommendations.
- **Ctrl+K Command Palette**: Implemented keyboard-driven navigation with global search matching menus, tables, employees, and inventory stock.
- **Bell Notifications**: Added real-time notifications for low stock alerts and CSAT warnings.
- **Demo Mode Seeder**: Added Italian Bistro and Japanese Ramen presets to assist with B2B sales demonstrations.

---

## 3. Remaining Modules & Future Roadmap

- **Thermal Printer Integrations**: Support direct tableside printing using local drivers.
- **Multi-Branch syncing**: Aggregate inventory, menus, and staff across secondary locations.
- **Native iOS & Android apps**: Build wrappers using React Native.
- **SMS Status Notifications**: Send Twilio status updates directly to diners when orders are ready.
