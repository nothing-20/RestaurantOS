# Demo Guide: RestaurantOS v2.0 Sandbox

This guide outlines how to reset, configure, and demonstrate **RestaurantOS v2.0** features during sales pitches or pilot customer trials.

## Initial Setup & Demo Reset

1. Sign in to the **Owner Portal** (`/dashboard/owner`).
2. Navigate to **Settings** -> **Demo Mode**.
3. Select your desired cuisine preset:
   - **Bella Italia Bistro**: High-quality Italian menu (pizza, pasta, tiramisu).
   - **Sakura Zen Ramen**: High-quality Japanese menu (sushi, ramen, matcha).
4. Click **Reset & Seed Demo Database**.
5. Wait for the success alert. The page will auto-reload with the new, realistic sandbox dataset populated!

---

## 30-Second Owner Pitch (Executive Command Center)

- **Default Cockpit**: Point out the dynamic, time-of-day greetings card that assesses sales pacing compared to yesterday.
- **Business Health**: Showcase the circular score (0-100) aggregating customer reviews, stock counts, and kitchen speeds.
- **Decision Feed**: Walk through the real-time event logs timeline showing system sweeps, inventory audits, and sales milestones.

---

## Waiter & Floor Flow Pitch

1. Open the **Waiter Command Center** (`/dashboard/waiter`).
2. Point out **My Floor Layout** with occupied/available states.
3. Click a table and create a quick order (e.g., Spaghetti Carbonara or Tonkotsu Ramen).
4. Submit the order. Point out the live toast notification.

---

## Kitchen KDS Flow Pitch

1. Navigate to the **Kitchen Display System** (`/dashboard/kitchen`).
2. Point out the newly submitted order in the queue.
3. Assign a chef (e.g., Chef Mario).
4. Change status to **Preparing** or **Ready**.
5. Observe how the waiter cockpit and notification bell are instantly updated in real-time.

---

## Billing POS & Checkout Pitch

1. Navigate to **Billing POS Desk** (`/dashboard/owner/billing`).
2. View the outstanding checks in the queue.
3. Complete checkout, apply discounts, or mark as paid.
4. Show how the transaction is immediately logged in the Owner Overview revenue sparkline.

---

## Global Search & Keyboard palette

- Press **Ctrl + K** from any page to open the **Command Palette**.
- Type "Inventory" and press Enter to jump to the inventory manager.
- Search for a specific table or menu item using the header search box.
