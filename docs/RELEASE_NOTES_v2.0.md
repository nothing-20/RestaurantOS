# Release Notes: RestaurantOS v2.0 (Release Candidate)

We are proud to present **RestaurantOS v2.0**, a complete, enterprise-grade multi-tenant operating system for modern dine-in establishments. This release elevates the project into a commercially viable SaaS product ready for customer pilot deployments and sales presentations.

## Major Enhancements

### 1. Executive Command Center v1.0
- Refactored `/dashboard/owner` to serve as the default executive cockpit.
- **Dynamic Greetings Card**: Generates customized assessments (Morning/Midday/Evening) comparing real-time metrics with trailing thresholds.
- **circular Health gauge**: Combines review counts, stock, and preparation latency into a single unified rating (0-100).
- **Decision Feed**: Interactive timeline card showing real-time event logs (Shift openings, low stock checks, cooking delays, strategy proposals).

### 2. SaaS Control & Search Primitives
- **Ctrl+K Command Palette**: A keyboard-driven command box allowing owners and managers to jump to POS desks, KDS, inventory, or employees sheets.
- **Unified Global Search**: Consolidates matches from menu items, table seating maps, employee logs, and current inventory stock metrics into the header.
- **Bell Notification Center**: Streams warnings and critical warnings from the alerts collection with support for dismissing or resolving issues with one click.

### 3. Sandbox Demo Mode & Seeders
- Implemented **Demo Mode** under Owner Settings, letting managers clear active databases and re-seed presets:
  - **Italian Bistro**: Bella Italia Bistro (featuring pizza, pasta, appetizers, desserts, and custom inventory).
  - **Japanese Ramen**: Sakura Zen Ramen (sushi, signature bowls, matchas, and active warnings).
  - Generates 45 menu items, 15 dining tables, 5 employees, low stock/expiring items, reviews, pending recoveries, and event log records automatically.

### 4. Code & Presentation Refactoring
- Upgraded the shared `EmptyState` overlay component to support custom call-to-action buttons.
- Audited settings panels (Business Hours, Branding, Taxes, Currency timezone, Language).
- Optimized all real-time listeners and memoized heavy array calculations to maximize rendering speeds.

---

*RestaurantOS v2.0 is FEATURE COMPLETE and certified for customer sandbox trials.*
