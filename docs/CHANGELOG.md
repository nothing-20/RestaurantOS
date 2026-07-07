# Changelog: RestaurantOS

All notable changes to the **RestaurantOS** repository will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to Semantic Versioning.

---

## [2.0.0-rc] - 2026-07-07 (RestaurantOS v2.0 Release Candidate)

This release elevates RestaurantOS to a production-ready Commercial SaaS Release Candidate. It completes product-wide polish, interactive sandboxing controls, global workspace integrations, and unified notifications centers.

### Added
- **Global Command Palette (Ctrl+K)**: Popups an interactive keyboard-navigable command center mapping shortcuts to create orders, open kitchen queues, inventory manager, billing desks, staff roster logs, and system settings.
- **Unified Global Search**: Consolidates matches from menu items, dining tables, employee profiles, and active stock inventory into the navigation header.
- **Unified Notification Center**: Real-time alert list filtering low stock, csat warnings, and automation warnings, with action redirects and dismiss controls.
- **Chronological Decision Feed**: Live audit stream inside the Executive Dashboard mapping timestamps and category markers to events (Opened, Stock audits, Revenue pacing alerts, KDS latency warnings).
- **Interactive Demo Mode & Seeder (Italian & Japanese)**: Sandbox controllers in Settings allowing administrators to clear tenant records and seed customized presets instantly (45 items, 15 tables, 5 employees, reviews, logs).
- **EmptyState action drawers**: Added optional button triggers to shared EmptyState overlays.

## [2.2.0] - 2026-07-07 (Executive Command Center v1.0)

This release introduces the premium Business Command Center as the default landing page for every Owner (`OwnerOverview.tsx`), enabling restaurant executives to assess the overall state of the business in under 30 seconds.

### Added
- **Time-of-Day Executive greetings**: Greets the owner with Morning, Midday, or Evening summaries dynamically compiling current stats (e.g. "Revenue is 8% higher than yesterday") alongside live scrolling insights.
- **Unified Health Score circular gauge**: Displays a dynamic HSL color-coded health rating (0-100) combining CSAT, kitchen prep speed, low stocks, and waste cost indicators.
- **Financial & Operational KPI Widgets**: Real-time widgets for Live Revenue with daily trend sparkline, Average Order Value (AOV), orders in progress, table occupancy percentages, and active diners.
- **Interactive Stock & Staff Performance Panels**: Summarizes ingredient stock status (healthy, low, critical, expiring in 3 days) and staff shift performances (waiter/kitchen turnaround averages, fastest waiter, clocked-in counts).
- **Strategy & Risk Center Integration**: Houses live recommendations from the Strategy Engine with expected ROI and one-click accept execution buttons, and lists warning alerts for critical risks.
- **Opportunity & Automation Dashboard**: Built campaign opportunities panel and background runner terminal presenting real-time scheduler executions and rule sets.
- **Quick Action workspace tools**: Action drawers to quickly create purchase orders, add staff, create promotion deals, or view Billing, Inventory, KDS, and Analytics.

## [2.0.0] - 2026-07-06 (Sprints 12.1 - 12.13 — Restaurant Strategy Engine)

This release implements the RestaurantOS Strategy Engine, transforming data highlights into strategic action proposals, business goal monitors, ROI predictions, and strategy execution paths.

### Added
- **Owner Strategy Center Dashboard (`OwnerStrategyCenter.tsx`)**: Created the strategic dashboard covering goals progress bars, cost/revenue/marketing suggestions, and execution timeline history.
- **Goal progress evaluator (`strategyService.ts`)**: Tracks target metrics (daily revenue, CSAT ratings, kitchen turnaround prep times) dynamically against context values, logging Goal Achieved event logs on achievements.
- **ROI Strategy Planner Engine**: Compiles growth proposals with objectives, reasonings, cost constraints, timeline scopes, and ROI percentage formulas.
- **Dynamic Goals creator form**: Allows owners to define custom target levels.
- **Strategy execution transitions**: Accepts, starts, or completes suggested strategies with Event Engine logs.
- **Sidebar Integration**: Exposes and routes the Strategy tab in the owner navigation sidebar.

---

## [1.9.0] - 2026-07-06 (Sprints 11.1 - 11.13 — Restaurant Intelligence Engine)

This release implements the RestaurantOS Intelligence Engine, compiling business knowledge bases, memory habits patterns, rule-based operations projections, explainable decision workflows, and AI Provider placeholder adapters.

### Added
- **Intelligence Architecture (`INTELLIGENCE_ARCHITECTURE.md`)**: Documented context data flows, intelligence scoring formula, memory profiles, and AI integration plans.
- **Owner Restaurant Intelligence Dashboard (`OwnerIntelligence.tsx`)**: Created a command dashboard featuring Advisor cards, explainable insights reasons, rule-based predictions, memory profiles, and knowledge SOPs.
- **Interactive AI Playground**: Interactive sandbox allowing owners to query mock AI Provider adapters (Gemini, OpenAI, Claude, Ollama, DeepSeek) returning mock JSON latency data.
- **Context Builder Module (`contextBuilder.ts`)**: Synthesizes orders completed revenue, CSAT scores, waiter latency counts, active dining tables, and inventory low stocks.
- **Memory Patterns Engine (`memoryEngine.ts`)**: Tracks historical busiest days of week, lunch peaks time ranges, dishes demand spikes, and discount approvals.
- **Knowledge Policies Engine (`knowledgeEngine.ts`)**: Manages operating SOP targets (kitchen < 12m, waiters < 5m), recipe structures, and tax parameters.
- **Intelligence Score Engine (`intelligenceService.ts`)**: Computes a dynamic rating score (0-100) combining CSAT averages, prep speeds, safety stocks, and waste cost margins.
- **Explainability reasoning Engine**: Appends transparent rationale factors (Biryani sales, chicken stock margins) explaining recommendation decisions.
- **AI Providers Placeholder Adapters (`aiProvider.ts`)**: Establishes IAIProvider interfaces with Gemini, OpenAI, Claude, Ollama, and DeepSeek adapter classes.

---

## [1.8.0] - 2026-07-06 (Sprints 10.1 - 10.13 — Automation & Operations Platform)

This release implements the RestaurantOS Automation & Operations Platform, establishing a configurable background rules runner, central alerts manager, daily executive briefings, and automated job schedulers.

### Added
- **Owner Automation Center Dashboard (`OwnerAutomationCenter.tsx`)**: Created the command console providing widgets for scheduler runtimes, rules configurator, alert monitors, system health, and logs.
- **Scheduled Job Scheduler**: Supports daily stock safety scans, expired ingredient scans, daily briefings compiles, and data cleanup utilities, with triggers overrides.
- **Configurable Rules Runner (`automationService.ts`)**: Supports toggleable rules conditions (e.g. low stock purchase suggestions, waste spoilage caps, CSAT feedback complaints review manager tasks).
- **Executive Daily Brief Builder**: Consolidates orders counts, revenue margins, AOV, ratings, lowest stock items, waste costs, and recommendations into printable brief cards.
- **Centralized Alert Center Matrix**: Manages warning priorities (Critical, High, Medium, Low) and triggers event engine alerts.
- **Background Event Engine Integrations**: Dispatches logs automatically for job completions, failures, warning triggers, alerts creation, and reports compiled.
- **Background Tasks Listener (`DashboardLayout.tsx`)**: Installs useAutomationEngine() 60-second checker checks.

---

## [1.7.0] - 2026-07-06 (Sprints 9.1 - 9.13 — Business Intelligence Platform)

This release introduces the RestaurantOS Business Intelligence and Decisions Analytics platform, helping restaurant owners analyze historical and real-time operations, sales margins, operational speeds, customer satisfaction metrics, finances, rule-based forecasts, and smart insights.

### Added
- **Owner BI Analytics Dashboard (`OwnerAnalytics.tsx`)**: Created a fully modular analytics tab covering sales, operations, customer ratings, finances, inventory health, forecast center, and smart insights.
- **SVG Visualizations Engine**: Implemented responsive, clean, pure-SVG line charts for revenue trends, bar charts for dish velocities, and heatmaps for peak occupancy slots.
- **Aggregation Logic**: Dynamically computes Average Order Value (AOV), average kitchen turnaround preparation speed, waiter turnaround counts, table turnaround cycles, and payment mechanisms splits in-memory.
- **Dynamic Business Health Score**: Computes a trailing health score (0-100) combining CSAT star ratings, kitchen speeds, safety stock margins, waste loss factors, and cancellation rates.
- **Rule-based Predictions Forecasts**: Generates warning predictions based on trailing parameters (e.g. Biryani demand increases, chicken depletion, busy weekend dinners, CSAT warnings).
- **Automated Smart Insights**: Triggers highlighting cards dynamically (e.g. Tomato reorder warnings, highest ratings waiter Rahul, top selling dish Paneer Butter Masala).
- **Multidimensional Filters**: Supports real-time filter combinations by Date range, Waiter staff, Seating table number, Menu Category, and Payment Method.
- **Sidebar Integration**: Exposes and routes the Analytics tab from the main sidebar.

---

## [1.6.0] - 2026-07-06 (Sprints 8.1 - 8.13 — Inventory Automation & Stock Intelligence)

This release implements the automated stock intelligence and ingredient management engine for RestaurantOS, letting the kitchen automatically deduct ingredients on orders completion, restore stock on cancels/refunds, monitor expiry alerts, log waste, manage suppliers, and automatically generate purchase suggestions.

### Added
- **Ingredient Master (`types.ts`)**: Structured schemas tracking inventory stock, reorder levels, shelf limits, costs, suppliers, expiration calendars, storage units, and status metrics.
- **Recipe Configurator (`OwnerInventoryManager.tsx`)**: Connects menu items to ingredient proportions with supports for versions, yield ratios, and waste factor adjustments.
- **Transaction-Safe Stock Deductions (`inventoryService.ts`)**: Automatically calculates and subtracts recipe requirements when orders change to COMPLETED, checking locks to prevent double-processing.
- **Stock Movement Auditor**: Logs all adjustments, consumption pings, manual stockups, waste, and cancellations restocks.
- **Low Stock warning Engine**: Scans safety limits, dispatching notifications and Event Engine alerts.
- **Purchase Suggestions Builder**: Automatically generates replenishment proposals (ingredient, qty, supplier, cost) when levels reach reorder limits.
- **Waste & Spoilage logger**: Lets staff input spoiled or damaged ingredients with reasons, tracking lost value metrics.
- **Supplier Directory manager**: Manages suppliers listings, contacts, speed, and ratings.
- **Unified 9-Tab Dashboard UI (`OwnerInventoryManager.tsx`)**: Incorporates Overview metrics, Ingredients CRUD, Recipes linking, Movements history, Suppliers matrix, and suggestions dashboards.
- **Background Automation Hook (`DashboardLayout.tsx`)**: Integrates real-time order listeners tracking and processing stock updates in the background.

---

## [1.5.0] - 2026-07-06 (Sprints 7.3, 7.4, 7.5 — Dining Journey Completion)

This release completes the end-to-end customer Dining Experience Platform, integrating dining checkout verification, waiter alerts notifications, live timeline order tracking, invoicing bill settlements, simulated card/UPI payments, and ratings feedback reviews.

### Added
- **Unified Live Dining Dashboard (`OrderTracking.tsx`)**: Upgraded the tracking view into a live guest console presenting KDS prep progress stages, live clocks, custom assistance requests, running invoices, simulated checkouts, and ratings feedback.
- **Cart Checkout Verification (`CustomerMenu.tsx`)**: Integrates multi-point order validation checking active open hours, branches, tables, and item availability before generating orders.
- **Service Assistance Alert Hub**: Allows table guests to request water, spoons, waiter calls, or cleaning, routing alerts directly to the Waiter Dashboard Commands desk.
- **Simulated Payment Gateway Checkout**: Provides interactive selectors for UPI, Card, or Wallet payments, simulating processing gates and updating Firestore state.
- **Ratings & Reviews feedback**: Automatically renders a satisfaction feedback form (Excellent, Good, Complaint ratings across food, service, ambience, cleanliness stars) upon payment confirmation, logging data to `/restaurants/{tenantId}/satisfactionRatings`.
- **Session Orders History**: Fetches and renders historical order receipts placed within the same table dining session.
- **Table Clearance Auto-Automation**: Submitting reviews updates table document status to Available and deletes active local dining session codes.
- **Public Routes Exposure (`AppRoutes.tsx`)**: Exposes customer menu and tracking views publicly to bypass auth gates for anonymous QR table scans.

---

## [1.4.0] - 2026-07-06 (Sprint 7.2 — Explore Menu Experience)

This release introduces the Explore Menu experience, converting the customer portal into a high-fidelity digital catalog with search, filtering, custom notes and size customization, up-selling product bundles, and event tracking hooks.

### Added
- **Digital Menu Explorer Page (`CustomerMenu.tsx`)**: Re-coded the main menu view with Cover Header assets, horizontal scrolling category emoji chips, and mobile-first list views.
- **Rule-Based Recommendation Engine (`recommendationEngine.ts`)**: Suggests additional items ("People Also Ordered") or promotional meals ("Complete Your Meal" with custom combo discounts) dynamically.
- **Interactive Customization Modal**: Enables customers to select variant sizes (e.g. Medium, Large), toggle checkboxes for ingredients add-ons, view nutrition info or allergens, and write custom cooking requests.
- **Smart Filter Row & Sort Panel**: Restructures search matching dynamically, sorting by ratings, price, or prep time.
- **Floating Cart Basket**: A sticky bottom-right button displaying cart totals and opening cart review drawers (surviving refresh page reloads).
- **Audit Analytics Tracking**: Fires triggers for `Menu Viewed`, `Category Viewed`, `Item Viewed`, `Recommendation Viewed`, and `Item Added To Cart`.

---

## [1.3.0] - 2026-07-06 (Sprint 7.1 — Customer Dining Entry Experience)

This release implements the first customer-facing touchpoint of the RestaurantOS Dining Experience Platform: the Welcome and Dining Entry verification panel.

### Added
- **Customer Welcome Page (`CustomerWelcome.tsx`)**: Premium landing view with cover image, welcome message, local live clock, and working hours information.
- **Dynamic Branding Customization**: Injects restaurant configurations from Firestore on-load, overriding layout colors (primary/secondary) and loading custom logos dynamically.
- **Robust QR Code Verification**: Validates scanned URLs containing `r` (restaurantId), `b` (branchId), `t` (tableId), and `s` (secureToken) parameters against live database values.
- **Dining Session Management**: Creates anonymous sessions saved in Firestore subcollection (`/restaurants/{restaurantId}/diningSessions/{sessionId}`) and localStorage for page refresh recovery.
- **Unified Error View Templates**: Implements responsive error screens using the Design System for handlingClosed, Disabled, Invalid, Not Found, and Network exceptions.
- **Dynamic Language Translator**: Pre-programmed dictionary support for English, Spanish (Español), and French (Français) translations.
- **Event Engine Logs**: Records `QR Scanned` and `Dining Session Started` operational triggers.

---

## [1.2.0-refactor] - 2026-07-06 (RestaurantOS Platform Architecture v1.2 Refactor)

This release introduces the complete RestaurantOS architecture v1.2 refactoring sprint. It improves modularity, maintainability, styling configurations, and service code reuse across all portals.

### Added
- **Centralized Shared Domain**: Created `src/shared/domain/` mapping modular business rules and models for users, menus, restaurants, orders, billing, tables, staff, events, notifications, customers, and manager review tasks.
- **Unified UI Component Library**: Centralized all core presentation primitives (buttons, cards, dialogs, dropdowns, badging, inputs, pagination, skeleton tables, emptystate, loading animations, and notifications) into `src/shared/ui/` categories.
- **Decoupled Application Layouts**: Centralized sidebar and navigation frame structures (`AdminLayout`, `AuthLayout`, `CustomerLayout`, `DashboardLayout`, `KitchenLayout`, `Navbar`, `OwnerLayout`, `PublicLayout`, `Sidebar`, `SuperAdminLayout`, `WaiterLayout`) under `src/shared/ui/layouts/`.
- **Global Design System Configuration**: Integrated design system styles, colors, layouts variables, and animations inside `src/shared/design-system/`, dynamically bound to the primary stylesheet and tailwind themes configs.
- **Shared Hook Core**: Built hooks including `useFirestore`, `useRealtime`, `useCurrentUser`, `useCurrentRestaurant`, and `useCurrentBranch`.
- **Shared Business Services Layer**: Centralized API and service controllers (`menuService`, `billingService`, `tableService`, `orderService`, `notificationService`, `eventService`, `taskService`).
- **Compatibility Proxy Export Architecture**: Re-exported all centralized layouts and components in their legacy locations (`src/components/ui/` and `src/components/layout/`) to ensure complete backward-compatibility with all existing page views.

---

## [1.0.0-core] - 2026-07-05 (RestaurantOS Core Stable Release)

This is the first stable production release of the **RestaurantOS Core** platform. It consolidates all client portals, kitchen KDS operations, visual floor builders, waiter dispatch panels, POS cash drawer registers, refunds ledgers, and operational event streams into a single responsive, multi-tenant operating system.

### Key Highlights
- **Multi-Tenant Validation Security**: Checks branch status, subscriptions, roles, and status locks.
- **Visual Canvas Table Allocation**: Visual layout manager and canvas vector export QR code sheets.
- **Interactive 4-Tab KDS Desk**: Category, Station, Item queues, chef assignments, recall back-actions, and delay warnings.
- **Waiter command dispatch matrix**: Realtime pickups, customer asistencia alerts, table cleanups, and service timings.
- **POS & Billing Workspace**: Support for mixed payment splits, cash drawer floats checking, bill checks hold/resume, complimentary comps, reprints counters, and shift audits.

## [11.1.0] - 2026-07-05 (POS Enhancements: Cash Drawer, Bill Hold, Complimentary, Reprints)


This release implements advanced professional POS features in the Billing module, including active Cash Drawer shifts, Bill Hold & Resume checks, auditable complimentary items, invoice reprints tracking, and Shift Reports histories.

### Added
- **Cash Drawer & Shift closing module**: Prevents checkout payments until a shift is opened with starting float cash. Computes expected shift cash balances (Opening Cash + Cash Sales - Refunds) in real-time, requiring operator input of actual closing cash to flag discrepancies.
- **Bill Hold / Resume Workspace**: Enables pausing table checks for ordering pauses or table changes, displaying paused checks in a dedicated Held section, and resuming them with updated cart structures.
- **Complimentary Items Selection**: Allows marking individual items as free with audited reason logging, updating SUBTOTAL counts to 0 for those items, and formatting invoices to list them clearly as complimentary (₹0 / $0.00).
- **Invoice Reprint Tracking copies**: Embeds reprint audit counter prompts, incrementing and appending audit stamps (time, operator, reason) on target invoice printouts.
- **Shift Reports ledger**: Sub-tab inside Billing listing chronological cash drawer shift summaries.
- **POS Action Security gates**: Restricts shift transitions, item comps, bill voids, refunds, and invoice reprint authorizations to Owner/Admin roles.

### Changed
- **Extended Order Schema**: Extended `IOrder` and `IOrderItem` interfaces with hold reasons, reprint audit objects, and complimentary logs.

## [11.0.0] - 2026-07-05 (Billing & POS Module Integration)


This release introduces the complete POS & Billing module integrated inside the Owner Dashboard. It establishes the workspace for real-time queue processing, item modifications, discount approvals, multi-mode tax calculations, cash drawers logging, refunds management, and Event Engine sync.

### Added
- **Integrated Billing Desk (`OwnerBilling.tsx`)**: Reusable commercial POS center featuring sub-tabs for Billing Queue (real-time table requests), Open Bills (running checks), Settled Invoices log, Auditable Refunds panel, Transactions ledger, and Sales Summary charts.
- **Mixed Payment Settlement**: POS settlement selector allowing owners to distribute payment totals across Cash, UPI, Credit/Debit Cards, and Digital Wallets, validating exact totals before transaction finalization.
- **Auditable Refund Desk**: Dedicated desk facilitating partial refunds, complete returns, or invoice voids. Requires mandatory reason captures and log records.
- **Permissions Alignment**: Re-routed billing workspace accessibility solely to authorized admin and owner roles. Updated the waiter floor matrix to restrict checkout, replacing client settlements with direct "Request Bill" alerts.
- **Supervisor Security Pin Gate**: Approval credentials prompt screen (PIN `1234`) blocking high discount submissions (>20% or flat sums) until manager override is input.
- **Vector Invoicing Sheets**: Formatted professional bill layouts presenting restaurant logo, FSSAI registry, tax subdivisions, payment distributions, and QR check validators.

### Changed
- **Sidebar Operations Navigation**: Renamed "SaaS Subscription" to "Billing", mapping route `/dashboard/owner/billing` to the new POS interface, and re-routing "Inventory" to `/dashboard/owner/inventory`.

## [10.0.0] - 2026-07-05 (Restaurant Event Engine & Customer Experience Intelligence)


This release implements the Restaurant Event Engine and Customer Experience Intelligence modules under Sprint 10, establishing a centralized non-blocking event-logging system and automated service recovery workflows.

### Added
- **Central Event Stream (`logEvent`)**: Centralized background logger writing events asynchronously to `/restaurants/{tenantId}/events` in Firestore, preventing any blocking delays on UI operational switches.
- **Activity Feed Component (`ActivityFeed.tsx`)**: Reusable UI component with searching and filtering options (table number, order ID, date, category toggles) subscribing to the live Firestore events collection. Integrated into `WaiterMatrix.tsx` under a new tab.
- **Customer Experience Intelligence**: Upgraded payment checkout dialog to collect operational metrics (Food Quality, Service Speed, Cleanliness, Staff Behavior, Waiting Time, Ambience) scored 1 to 5, customer type (Solo, Couple, Family, Group), visit occasion, and repeat customer status. Syncs structured reviews to `/satisfactionRatings`.
- **Service Recovery Automations**: Automatically creates high/critical priority review tasks under `/restaurants/{tenantId}/managerReviews` for checkout reviews rating customer satisfaction as `Needs Attention` or `Complaint`.
- **Operational Logs Integration**: Hooked `logEvent` triggers inside Waiter Matrix actions (shift states, diner seatings, cart ordering, task claims, resets) and KDS Queue actions (status transitions, chef assignments, recalls, pauses/resumes).

## [9.0.0] - 2026-07-05 (Waiter Final Enhancements & Complete Freeze)


This release implements the final operational enhancements for the Waiter Operations module, finalizing features for shift handovers, table assignments, and customer experience tracking. The Waiter module is now marked **FEATURE COMPLETE** and frozen.

### Added
- **Waiter Shift Handover**: Checks for pending assigned tables, ready deliveries, or diner requests on shift end, presenting a summary handover modal. Transfer to active waiters initiates a `/handovers` document.
- **Accept Shift Handover Alert**: Interactive overlay notification alert enabling receiving waiters to accept handover, triggering a Firestore transaction updating all table, order, and request assignments.
- **Table Allocation Cockpit**: Manager console containing:
  - Auto-assignment load-balancer (Round Robin and Least Loaded distribution algorithms).
  - Bulk section and floor assignment triggers.
  - Manual waiter selectors next to each visual table.
- **Diner Experience Review Prompt**: Prompt intercepting the checkout flow logging ratings (Excellent, Good, Neutral, Needs Attention, Complaint), text notes, and repeat customer markers to `/satisfactionRatings` collection before table resets.


## [8.0.0] - 2026-07-05 (Waiter Service Command Center)

This release upgrades the Waiter Dashboard into a commercial-grade Service Command Center. It introduces dynamic Shift Management, a Unified Task Engine, a Smart Priority Engine, Route Optimization, and color-coded Service Timers to streamline floor operations.

### Added
- **Shift Management Controls**: Active widgets tracking Shift Start/End, Breaks, working durations, and serving metrics.
- **Unified Task Queue**: Consolidates Deliver Orders, Customer Requests, Bill Invoices, and Table Cleaning into a single actionable feed.
- **Smart Priority Engine**: Dynamic calculation of priority tags (Critical, High, Medium, Low) based on VIP statuses, KDS delays (>5m/10m), and checkout waiting times. Supports manual waiter overrides.
- **Route Optimization (Next Best Action)**: Real-time sorting by priority index, section zones, and nearest numerical table. Highlights recommendation cards at the top.
- **Live Activity Feed**: scrolling sidebar showing chronological server event logs (e.g. Table Ready alerts, water requests).
- **Service Timers**: Second-precision timers color-coded (Green <5m, Yellow <10m, Orange <15m, Red 15m+) to indicate response age.
- **Table Notes support**: Displays prominent instructions (Allergy, VIP, Baby chair, Birthday) on table cards and task lists.


## [7.0.0] - 2026-07-05 (Waiter Operations Module)

This release implements a production-ready Waiter Operations Module as the centralized cockpit for dining floor staff, managing table assignments, QR alerts, kitchen ready orders, invoice checkouts, cleaning tasks, and waiter performance.

### Added
- **Assigned Tables (My Floor)**: Filtering of dining tables assigned to the logged-in server, supporting seating check-ins, guest count configuration, and release triggers.
- **Quick Order Creation**: Direct table-side order builder allowing waiters to search menu items, build carts, compute sub-totals, and submit tickets directly to KDS.
- **Service timelines**: Step-by-step table service visual progress indicator showing Order Received → Accepted → Preparing → Ready → Delivered → Paid checkpoints.
- **Kitchen Pickups**: Real-time pickup lists for READY orders, tracking completion speed and enabling waiter claiming and delivery handoffs.
- **Requests Hub**: Consolidated diner alerts hub handling Call Waiter, Water, Plates, Tissue, Condiments, Special Assistance, and Birthday triggers.
- **Billing Checkout**: Invoice modal calculating sub-totals, discount percent rates, 8% sales tax, and marking paid. Updates table status to cleaning.
- **Cleaning Duty Tasks**: Interactive table cleaning flow transitioning tables dirty → cleaning in progress → available/empty.
- **Live Event Alerts**: Dynamic toasted warnings for Kitchen Ready status, diner requests, tables requesting checks, and delayed pickups (>5m ready).
- **Staff Performance Stats**: Dynamic reporting of delivered orders count, average delivery speed, and resolved requests.


## [6.0.0] - 2026-07-05 (Kitchen Display System — Professional Enhancements)

This release freezes the KDS module, adding chef assignments, pause/resume mechanisms, ready-order recalls, queue reordering, and smart order priority configurations.

### Added
- **Chef Assignment**: Real-time kitchen staff selection and unassignment with timestamps mapped to `/employees`.
- **Cooking Pause/Resume**: Multi-state transitions between preparing and paused cooking phases, capturing custom reasons in the timeline.
- **Recall Order Action**: Back-transitions accidental ready marks to preparing, automatically updating active waiter dashboards.
- **Cooking Queue View**: 5th tab showing positions, estimated window times (start/finish), priority tags, and queue timeline maps.
- **Reordering Swaps**: Manual queue positioning using ▲ and ▼ controls that swap positions atomically.
- **Auto-Sort by Priority**: Batch pos updating sorting queue sequence using Smart Priority weights.
- **Smart Order Priority**: Automatic classification into Critical/High/Normal/Low based on VIP tags, large order size (>6 items), or waiting delay (>15 min).
- **Internal Note Editors**: Side-by-side display and custom editing prompts for Internal Kitchen and Chef notes.


## [5.0.0] - 2026-07-05 (Kitchen Dashboard — Professional Operations Suite)

This release transforms the Kitchen Display System into a commercial-grade operations platform with live performance metrics, bulk order management, per-order chronological timelines, kitchen insights, and a 5-band elapsed time color system.

### Added
- **`KitchenStatsBar`**: Fixed 8-card live performance strip displaying Active Orders, Preparing, Ready, Avg Prep Time, Delayed Orders, Completed Today, Kitchen Efficiency %, and Peak Queue (session watermark). Efficiency card includes animated bottom progress bar.
- **`BulkActionsToolbar`**: Floating glassmorphism toolbar (pinned viewport bottom) that appears on ticket selection. Supports Accept, Mark Preparing, Mark Ready, Archive actions via `writeBatch` — up to 500 documents per Firestore batch commit. Confirmation modal guards all destructive actions.
- **`OrderTimeline`**: Vertical per-order chronological event display showing type-specific icons (CircleDot → CheckCircle2 → Flame → ChefHat → UtensilsCrossed), color-coded dot connectors, ISO timestamps, performer, and description. Rendered in compact mode inside tickets.
- **`KitchenInsightsPanel`**: Collapsible real-time insights sidebar with 6 operational metrics: Longest Waiting Order, Fastest Completed, Bottleneck Station, Avg Prep Time, Avg Ticket Time, Orders > 15 min. Rows color-code by severity (normal/warn/critical).
- **`KitchenTicket`**: Enhanced ticket card with inline checkbox for bulk selection, ring-highlight for selected state, collapsible timeline, 5-band elapsed timer (Green/Yellow/Orange/Red/Critical-Pulse), estimated prep time display, and special notes section.
- **`kitchenMetrics.ts`**: Pure utility module with `calcKitchenMetrics()`, `getPrepTimeMinutes()`, `getTotalTimeMinutes()`, `getElapsedColor()`, `getElapsedSeconds()`, `formatElapsedSeconds()`, `getElapsedMinutes()`, `isToday()`, `calcBottleneckStation()`. All functions are pure and memoizable.
- **`kitchen-dashboard/types.ts`**: KDS-specific types extracted into a dedicated module: `TKdsTab`, `TOrderStatus`, `TPriority`, `IKdsOrder`, `IKdsMetrics`, `IBulkConfirmDialog`.
- **`ITimelineEvent`** type in global `types/index.ts`.
- **`updatedAt?`** and **`timeline?: ITimelineEvent[]`** added to `IOrder`.
- **Delayed Only filter toggle** in the filter panel with configurable threshold.
- **Target Prep Time selector** (10m / 15m / 20m / 30m) inline in filters — affects Efficiency %, Delayed count, and color logic.
- **Insights panel toggle** button in the toolbar — shows/hides `KitchenInsightsPanel` as a sidebar column.
- **Peak Queue tracking**: `setPeakQueue(prev => Math.max(prev, activeNow))` inside the `onSnapshot` callback — session high-watermark with no extra Firestore reads.

### Changed
- **`KitchenQueue.tsx`**: Fully refactored into a composable orchestrator. All render logic for ticket cards delegated to `KitchenTicket`. Bulk selection state (`selectedIds: Set<string>`), metrics derivation (`useMemo`), and `handleBulkStatusUpdate` (`writeBatch`) added.
- **Timeline Event Writes**: Every `handleStatusUpdate` call now also appends a `ITimelineEvent` via `arrayUnion` — conflict-safe for concurrent kitchen staff.
- **Filter Panel**: Added Category, Delayed Only toggle, and Target Prep Time controls. Result count displayed inline.
- **5-Band Elapsed Color**: Upgraded from 3-band (green/yellow/red) to 5-band (green/yellow/orange/red/critical-pulse).

### Architecture
- Single Firestore `onSnapshot` listener preserved — all 4 tabs and all metrics continue sharing the same `allOrders` state.
- `filteredOrders` converted from inline `useCallback` to `useMemo` — avoids recalculation on unrelated re-renders.
- `calcKitchenMetrics()` is a pure function called inside `useMemo` — no side effects.

---

## [4.0.0] - 2026-07-05 (Kitchen Display System — Sprint 4)

This release implements the production-ready Kitchen Display System (KDS) as the central operational hub for RestaurantOS:

### Added
- **4-Tab KDS Dashboard**: Table View (default), Category View, Station View, and Item Queue — all powered by a single shared Firestore `onSnapshot` listener, eliminating duplicate reads when switching tabs.
- **Live Elapsed Timers**: Every ticket card displays a `MM:SS` countdown ticking every second. Color changes from Green (<5m) → Yellow (5-15m) → Red blinking (>15m).
- **One-Click Status Advancement**: Ticket cards surface the correct next action button (Accept → Start Cooking → Mark Ready) mapped to the centralized order lifecycle state machine.
- **Station Metadata**: Added `station` field to `IMenuItem` type and `seed.ts` seeder to power Station View groupings.
- **Global Filter Panel**: Cross-tab filtering by Status, Priority, Station, text Search, and sortable by Arrival Time, Priority, Prep Time, or Table Number.
- **Item Queue Batching**: Aggregates identical dishes across all active tables so chefs can batch-cook at scale.

## [4.0.0-draft] - 2026-07-05 (Kitchen-Centric Operational Architecture)

This draft release reorganizes the RestaurantOS core workflow around a kitchen-centric operations model in preparation for Sprint 4:

### Changed
- **Operational Alignment**: Redefined the business logic flow to route orders dynamically through KDS (Kitchen Display System) as the central hub communicating status updates to waiter notifications, inventory hooks, and tableside ordering.
- **Unified Lifecycles**: Created the standard Order Lifecycle (`NEW -> ACCEPTED -> PREPARING -> READY -> DELIVERED -> COMPLETED -> ARCHIVED`) and conformed Table State Transitions (`Available -> Occupied -> Ordering -> Preparing -> Dining -> Bill Requested -> Cleaning -> Available`).
- **Sprint 4 Blueprinting**: Laid out database collection schema mappings, component hierarchies, state machines, and real-time listeners for the KDS module.

## [3.0.0] - 2026-07-05 (Restaurant Table Management System)

This release implements a production-ready Restaurant Table Management module under Sprint 3:

### Added
- **Visual Floor Map**: Built a draggable 2D floor grid designer permitting owners to rearrange table positions (`positionX`, `positionY`) and rendering circle/square/rectangle shapes styled by live status colors.
- **Table Operations Drawer**: Added quick-access action triggers for reserving, releasing, marking occupied, cleaning, or toggling active/disabled table status.
- **Floors & Sections Management**: Built inline layouts configuration managers to add, rename, or delete floors and sections.
- **Canvas QR Card Exporter**: Generates custom table ordering cards combining app metadata parameters drawn on a canvas for high-res PNG download, printed layout grids, and regenerating code signatures.
- **Tables Seeder**: Updated `seed.ts` to populate default floors, sections, and structural table arrangements with initial coordinates and shapes.

## [2.2.0] - 2026-07-05 (RestaurantOS Firestore Architecture v1.0)

This release finalizes the Firestore database architecture for RestaurantOS, cleaning up redundant nesting levels and laying placeholder frameworks:

### Added
- **Finalized Menu Paths**: Refactored paths to `/menu/default/categories/{categoryId}` and `/menu/default/items/{itemId}`, removing duplicate path segments.
- **Architectural Placeholders**: Prepared schema collections for `/menu/default/variants`, `/menu/default/addons`, and `/menu/default/combos` without impacting runtime flows.
- **Dual Legacy Migration Handler**: Enhanced the automated mounting migration script to identify and consolidate documents from both V1 (`/menu/categories/categories`) and V2 (`/menu/menu/categories`) legacy systems.
- **Service Alignment**: Re-routed `FirestoreService` singletons and seeder modules.

## [2.1.0] - 2026-07-05 (Menu Firestore Architecture Migration)

This release migrates the Menu database structure from deep subcollections to a cleaner, non-nested architecture:

### Added
- **Streamlined Firestore Paths**: Migrated categories path to `menu/menu/categories/{categoryId}` and items path to `menu/menu/items/{itemId}`, eliminating redundant subcollection nesting.
- **Automated Client-Side Migration**: Implemented a mounting script in `MenuManagement.tsx` that copies legacy category and item documents to the new paths and deletes old documents, guaranteeing data integrity.
- **Service & Component Alignment**: Updated `collections.ts` helper paths, `FirestoreService` singletons in `firestore.ts`, `seed.ts` seeding loops, and `CustomerMenu.tsx`/`CustomerPortal.tsx` consumers.

## [2.0.0] - 2026-07-05 (Menu Management System Foundation)

This release introduces a robust, multi-tenant Menu Management system featuring five specialized operations areas under `Menu Engine`:

### Added
- **Interactive Multi-Tab Workspace**: Rewrote `MenuManagement.tsx` to support a high-fidelity workspace with five main tabs: Categories, Menu Items, Availability Switchboard, Pricing Adjustments, and Customer Menu Preview.
- **Nested Category Management**: Supports category creation, editing, reordering (with Display Order adjustment), status toggling, and deletion. Categories are persisted at `restaurants/{tenantId}/menu/categories/categories/`.
- **Comprehensive Menu Item CRUD**: Adds, edits, deletes, duplicates, and archives menu items. Items are persisted at `restaurants/{tenantId}/menu/items/items/`.
- **Search, Filter, and Sort Controls**: Enabled live searching, category filtering, vegetarian status filters, availability filters, and sort controls (A-Z, Z-A, Price, Newest).
- **Availability Switchboard**: Provided a high-fidelity workspace for instantly toggling the in-stock status of categories and items.
- **Pricing Adjustments Grid**: Created a dense list of menu items permitting instant updates to base price and discount prices with strict inline validation saving on input blur.
- **Customer Menu Preview**: Built a fully responsive, read-only customer-facing layout showing how items appear table-side.
- **Strict Validation Layer**: Implemented checks for duplicate category names, duplicate item names in the same category, negative prices, and negative prep times.

## [1.9.0] - 2026-07-05 (Staff Onboarding & Invitation Authentication Redesign)

This release implements a secure, invitation-based staff onboarding workflow:

### Added
- **Root-Level `employees` Collection**: Separated business records (`employees/`) from auth records (`users/`), allowing invitations to be created without Firebase Authentication account pre-generation.
- **Staff Account Activation Page (`/staff/activate`)**: Created a standalone page with a 3-step wizard (Verify Invite, Set Password, Activated) to look up invitation, create Firebase Authentication user, set profile doc, and link records.
- **Activation CTA**: Integrated an "Activate Staff Account" link on the `/staff/login` page.
- **Roster Management Upgrades**: Rewrote `OwnerStaffManager.tsx` with top status filtering tabs, support for all 5 statuses (Invited/Activated/Active/Suspended/Archived), actions for Suspend, Reactivate, Archive, Resend Invite, Edit, and Delete.
- **Firestore Security Rules**: Configured read/write access for root-level `/employees` collection.

## [1.8.2] - 2026-07-05 (Authentication Debugging — Root Cause Fixes)

This release fixes all observed login routing failures across B2B staff roles:

### Fixed
- **`TUserRole` Missing Roles** — `manager`, `cashier`, `reception` were absent from the TypeScript union type, causing them to silently fall back to `'customer'` role and route to the wrong dashboard or be blocked entirely.
- **JWT Claims Priority Bug** — `AuthContext` used JWT claims as the primary role source. Stale or missing claims overrode the correct Firestore role. Firestore is now the authoritative source; JWT claims are only used as a last-resort fallback.
- **Mock Session Firestore Crash** — `WorkspaceContext` attempted to look up `users/mock-uid-waiter` etc. in Firestore for dev mock sessions, producing false `user-not-found` errors. Mock sessions now build a synthetic workspace directly from the user object.
- **Hardcoded `branchId: 'main-branch'`** — All invited staff were assigned `branchId='main-branch'`, causing WorkspaceContext to look up `branches/main-branch` in Firestore which doesn't exist, triggering false `branch-disabled` errors. Now stored as empty string.
- **Missing Profile Silent Redirect** — When StaffLogin authenticated a user with no Firestore doc, it silently navigated to `/`. Now signs out immediately and shows an actionable error message.
- **PublicGuard Generic Path Bug** — Used template literal `/dashboard/${role}` which would produce wrong paths. Now uses an explicit role-to-path map.
- **WorkspaceContext Re-Validation Loop** — `useEffect([user])` fired on every render because `user` is a new object reference each time. Changed to `[user?.uid]` (stable primitive string).
- **Employee Roster UID Backfill** — After staff account activation, the employee roster doc retained `uid: ''`. StaffLogin now backfills the real Firebase UID after activation so suspend/reset flows work correctly.
- **Owner Profile Schema** — Owner's Firestore doc stored `displayName` but not `fullName`, causing blank welcome messages. Now stores both fields.
- **Firestore Rules Recursive Dependency** — `hasRole()` in users collection rules called `getUserData()` which read `users/{uid}` — recursive dependency that failed when the user doc didn't exist yet during first write. Rules now use direct `request.auth.uid == userId` check as primary condition.

## [1.8.1] - 2026-07-05 (Workspace Validation Refinements & Role Isolation)

This patch introduces security isolation and billing exceptions for the Workspace Validation layer:

### Added
- **Cross-Dashboard Role Security**: Integrated `RoleGuard.tsx` to enforce role checking on B2B sub-routes, preventing staff members from manually entering URLs to unauthorized dashboards.
- **Subscription Renewal Loop Bypass**: Enabled Owner access to `/dashboard/owner/billing` when their subscription status is `'expired'` or `'cancelled'` to allow card renewal.
- **Auto-Logout for Missing Profiles**: Triggers immediate Firebase sign-out and toast notifications if user profile lookup fails in Firestore.

## [1.8.0] - 2026-07-05 (Workspace Validation & Security Layer)

This release implements a secure, multi-tenant Workspace Validation pipeline:

### Added
- **Centralized Workspace Provider**: Configured `WorkspaceContext.tsx` conducting sequential security checks on user document existence, status active checks, tenant status checks, subscription tier/status validation, branch checks, and role classification.
- **Workspace Route Guard**: Created `WorkspaceGuard.tsx` intercepting B2B dashboard and platform administration pages, displaying loader screens, and preventing direct URL access.
- **Dedicated Error Dashboard**: Built `/workspace-error` displaying premium layouts for suspended accounts, expired subscriptions, disabled branches, and unauthorized access events.
- **Super-Admin Bypass**: Configured automated validation bypass rules for B2B restaurant checks when loading platform-wide admin portals.

## [1.7.0] - 2026-07-05 (Restaurant Staff Authentication Redesign)

This release redesigns the Restaurant Staff authentication architecture:

### Added
- **Unified Staff Login Page**: Integrated a single `/staff/login` route replacing multiple separate role-based login views.
- **Auto-routing by Role**: Configured automatic routing to respective B2B dashboards based on the Firestore user profile role.
- **Account Invitation Flow**: Implemented pending invitation lookup and first-time account activation setting a password, linking Firebase UID, and creating their active user document.
- **Status Validation Checks**: Disables access to dashboards if the employee document status is not `active`, showing a helpful error alert.
- **Staff Panel Actions**: Added Invite, Suspend/Deactivate, Reactivate, and Password Reset actions to the Owner's staff manager screen.
- **Backward Compatibility Redirects**: Redirects legacy routes (`/owner/login`, `/waiter/login`, `/kitchen/login`, `/cashier/login`, and `/admin/login`) to the unified `/staff/login` page.

## [1.6.2] - 2026-07-05 (Owner Settings Integration & Bugfix)

This release resolves integration issues and compilation blocks in the Restaurant Profile & Settings module:

### Fixed
- **Missing Imports**: Added missing `LoadingSpinner` and `setDoc` imports in `OwnerSettings.tsx`.
- **Hanging Load Fallbacks**: Implemented dynamic `tenantId` fallback lookup in `users/{uid}` collection to prevent loading hangs when auth context claims are not instantly resolved.
- **Missing Document Init**: Configured Firestore to automatically write default settings if the tenant document doesn't exist, preventing runtime crashes.
- **Tab Layout Division**: Organized all settings configuration fields into 6 tab containers (Restaurant Profile, Business Hours, Branding, Business Settings, Tax & Compliance, QR & Seating).

## [1.6.1] - 2026-07-05 (Customer Dining Workflow Enhancements)

This patch introduces enhancements to the customer dining experience on the menu page and waiter dashboards:

### Added
- **Persistent Header Buttons**: Added "Track Orders", "Live Bill", and "Call Waiter" header options in `CustomerMenu.tsx`.
- **Mobile Sticky Action Bar**: Renders sticky floating bottom-tabs on mobile devices to easily access dining options.
- **Table Orders Tracking Drawer**: Renders a realtime tracking view showing all orders placed from the current table.
- **Live Running Bill Drawer**: Aggregates all items ordered from the table and calculates live subtotal, service charges, GST, and grand total.
- **Assisted Call Waiter Popup**: Provides assistance choices and creates Firestore documents under `waiterRequests/`.
- **Waiter Assistance Requests Panel**: Implemented in `WaiterAlerts.tsx` allowing waiters to accept and complete requests in real-time.
- **Diner Alert Banner**: Displays a "Waiter is on the way" alert banner to diners when a request status is accepted.

### Modified
- **Customer Checkout Success Loop**: Places orders without redirecting away, clears the cart, shows a confirmation dialog, and keeps the customer on the menu.

## [1.6.0] - 2026-07-05 (Customer Experience Redesign)

This release implements a complete redesign of the B2C Customer Experience, including restaurant discovery, details view, available seating table selection, simulated QR code scanning, menu card deck catalogs, checkout calculations (GST + Service fee), order confirmation, and real-time status tracking.

### Added
- **Restaurant Discovery Page ([RestaurantDiscovery.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/RestaurantDiscovery.tsx))**: Supports search queries, cuisine quick chips, sorting by rating, status badges, and estimated waiting times.
- **Restaurant Details Page ([RestaurantDetails.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/RestaurantDetails.tsx))**: Counts available tables and hosts the Simulated QR Scanner and manual seating grids.
- **Customer Menu Page ([CustomerMenu.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerMenu.tsx))**: Supports quick category scroll, Veg/Nonveg toggles, Offers/Popular feeds, quantity counters, and the sliding cart drawer.
- **Order Tracking Page ([OrderTracking.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/OrderTracking.tsx))**: Renders a live progress stepper subscribing to Firestore snapshots.

### Modified
- **AppRoutes Config ([AppRoutes.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/AppRoutes.tsx))**: Registered new paths for the customer pages.
- **Diner Redirects ([PublicGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/PublicGuard.tsx), [CustomerLogin.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerLogin.tsx))**: Changed default routes to `/customer/restaurants`.
- **Database Seeder ([seed.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/firebase/seed.ts))**: Automatically seeds cover images, cuisines, descriptions, logos, ratings, and phone numbers.
- **Customer Portal ([CustomerPortal.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerPortal.tsx))**: Aligned checkout pricing fields (GST 5% + Service Charge 5%).
- **Customer Home ([CustomerHome.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerHome.tsx))**: Refactored to act as a router-level redirect.

## [1.5.1] - 2026-07-05 (Customer Auth Race Condition & Route Guards Refactoring)

This release implements decoupled route guards and addresses race conditions and rules crashes for Customer registration.

### Added
- **OwnerGuard ([OwnerGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/OwnerGuard.tsx))**: Decoupled route guard for merchant-specific and branch operational pages.
- **AdminGuard ([AdminGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/AdminGuard.tsx))**: Gated route guard for SaaS super-admin pages.
- **CustomerGuard ([CustomerGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/CustomerGuard.tsx))**: Gated route guard for Diner pages.
- **PublicGuard ([PublicGuard.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/routes/PublicGuard.tsx))**: Replaces `PublicRoute.tsx` to handle public/auth redirects and routes customer users to `/customer/home`.

### Fixed
- **Auth Context Race Condition**: Refactored `AuthContext.tsx` with localized try-catch blocks and a default `'customer'` role fallback.
- **Rules Exception Handling**: Updated `firestore.rules` helpers `hasRole()` and `isTenant()` with defensive `userExists()` checks to avoid security rules evaluator crashes.
- **Mock Developer Override**: Fixed `AuthContext.tsx` initialization early-return so mock developer sessions do not block real Firebase logins or deactivate auth state listener updates.

## [1.5.0] - 2026-07-04 (Complete Customer Authentication Flow)

This release implements a secure B2C Customer journey using live Firebase Auth and Firestore profiles.

### Added
- **Customer Registration Page ([CustomerRegister.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerRegister.tsx))**: Forms for Full Name, Email, Password, Confirm Password, and Phone Number.
- **Firebase Auth Persistence**: Binds customer logins, handles credentials lookups, and auto-populates diner names in checkouts.

### Fixed
- **Routing Protection**: Configured `ProtectedRoute` to redirect unauthenticated diners to `/customer/login`.
- **Diner Credentials validation**: Returns "Account not found" and register buttons during login errors.

---

## [1.4.0] - 2026-07-04 (B2B/B2C Entry Experience)

This release ships the dual-experience Landing Page and customer portals routes, separating the Diner ordering flows from Merchant SaaS onboarding.

### Added
- **Dual experience Landing Page ([LandingPage.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/landing-page/LandingPage.tsx))**: Supports theme switching, and B2B/B2C action cards with animations.
- **Customer Sign In page ([CustomerLogin.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerLogin.tsx))** and Home portal ([CustomerHome.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/customer-portal/components/CustomerHome.tsx)).

---

## [1.3.0] - 2026-07-03 (Automated Data Seeder Integration)

This release integrates the automated data seeder that sets up a complete test environment upon new owner signup or trigger.

### Added
- **Expanded Seed Script ([seed.ts](file:///C:/Users/Geetha%2520Krishna/OneDrive/Desktop/Project%2520Saas%2520for%2520all/src/firebase/seed.ts))**: Added 25 menu items, 8 Free tables, 6 employee roles, 10 active/completed sample orders, and 20 raw inventory items.
- **Auto-Trigger Signup**: Automatically executes the data seeder for fresh tenants upon owner registration, with duplicates collision protection.

---

## [1.2.0] - 2026-07-03 (Firebase SDK & Modular Services Integration)

This release connects the application to Firebase services, shifting from hardcoded mock values to real-time collections with safety rules.

### Added
- **Centralized Firebase Structure**: Created `src/firebase/` directory containing config initializations, auth handlers, firestore CRUD classes, and collection paths helpers.
- **Environment variables mapping ([.env.example](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/.env.example))**: Ensures secure modular SDK executions.
- **Interactive database seeding ([seed.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/firebase/seed.ts))**: Single-click Gourmet Palace seeding panel mounted inside the Super Admin dashboard.
- **Firestore Security Rules ([firestore.rules](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/firestore.rules))**: Absolute multi-tenant tenant isolation and role-based permissions gates.
- **Guide documentation ([README.md](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/README.md))**.

---

## [1.1.0] - 2026-07-02 (Phase 2 & 3 Complete - Operational & SaaS Platform)

This release ships the complete merchant operational engines (Menu CRUD, Diner Scan pages, local cart persistent queues, real-time Kitchen tickets preparer boards, and Waiter seating grids) alongside the global SaaS Super Admin platform.

### Added
- **SaaS Platform Command Deck ([SuperAdminOverview.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/super-admin/components/SuperAdminOverview.tsx))**: Supports platform MRR/ARR aggregations, support tickets queue resolution, feature flags toggling, platform settings overrides, and security logs auditing.
- **Merchant Workspace Manager ([SuperAdminTenants.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/super-admin/components/SuperAdminTenants.tsx))**: Supports tenant creation, updates, suspensions/activations, plan tier changes, and expiration monitoring.
- **Waiter delivery matrices ([WaiterMatrix.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/waiter-dashboard/components/WaiterMatrix.tsx))** and alerts hubs ([WaiterAlerts.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/waiter-dashboard/components/WaiterAlerts.tsx)).
- **Real-time Kitchen Prep ticketing board ([KitchenQueue.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/kitchen-dashboard/components/KitchenQueue.tsx))**.
- **Owner Dashboard KPIs ([OwnerOverview.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerOverview.tsx))**, employee CRUD rosters ([OwnerStaffManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerStaffManager.tsx)), table layout maps ([OwnerTablesManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerTablesManager.tsx)), and inventory low-stock alarms ([OwnerInventoryManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerInventoryManager.tsx)).
- **Zod Resolvers**: Programmed a custom [zodResolver.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/utils/zodResolver.ts) for validation.

### Fixed
- **Missing Imports**: Added missing `SearchBar` import statement in [OwnerInventoryManager.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/owner-dashboard/components/OwnerInventoryManager.tsx).
- **TypeScript definitions**: Aligned `IOrder` interface status fields inside [index.ts](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/types/index.ts) to match active kitchen/waiter order tickets.

---

## [1.0.0-phase1] - 2026-07-02 (Phase 1 Baseline Complete)

This release establishes the complete system foundation, configuration, routing architecture, global providers, UI kit components library, and the fully-integrated Authentication module.

### Added
- **Configuration Layers**: Enabled `@/*` path alias mapping in `tsconfig.json` and resolved URL routing configurations in `vite.config.ts`.
- **System Contexts**: Integrated `ThemeProvider`, `UserProvider`, `RestaurantProvider`, and Firebase-backed `AuthProvider`.
- **Custom Hooks**: Created `useTheme`, `useRestaurant`, `usePermissions`, and `useLocalStorage`.
- **Routing & Guards**: Set up client routing matrix in `AppRoutes.tsx` including `/maintenance`, `/unauthorized`, and `/session-expired` routes, secured with `ProtectedRoute` and `PublicRoute` guards.
- **Visual Dashboard Layouts**: Developed role-based shell structures for Customer, Kitchen, Waiter, Owner, Manager, and Super Admin views.
- **Shared UI Kit**: Implemented 20+ stateless accessible components:
  - Form Fields: `Button`, `Input`, `TextArea`, `Select`, `Checkbox`, `Switch`.
  - Indicators: `Badge`, `Avatar`, `Skeleton`, `LoadingSpinner`.
  - Content Frames: `Card`, `Table`, `Pagination`, `Tabs`, `Breadcrumb`, `EmptyState`, `ErrorState`.
  - Modals & Triggers: `Modal`, `Dialog` (Confirmation), `Dropdown`, `ToastContainer`.
- **Services Wrappers**: Added Firebase SDK stubs (`dbService.ts`, `storageService.ts`) and completed the Firebase Authentication manager (`authService.ts`).

### Modified
- Swapped out temporary mock context providers for real-time Firebase Auth listeners that resolve custom JWT claims and execute Firestore collection lookups on state change.
- Re-routed authorization entry points to redirect logged-in users back to their default dashboard shells.
