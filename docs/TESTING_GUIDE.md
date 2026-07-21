# Testing Guide: RestaurantOS Verification Manual

This document details the manual and automated testing procedures to verify the features, user flows, database constraints, and routing of **RestaurantOS** (v2.0-rc).

---

## 1. Owner Workspace Flow Tests

### Test Case: Restaurant Seeder & Demo Sandbox
1. Navigate to `/login` and authenticate using Owner credentials.
2. Select **Settings** in the left sidebar and scroll to the **Demo Mode** panel.
3. Click **Seed Italian Bistro Preset**.
4. **Verification**:
   - The screen displays a loading spinner: "Initializing Bella Italia...".
   - Navigate to the **Menu** tab; verify 45 menu items (pizza, pasta, desserts) populate under correct category tabs.
   - Navigate to the **Tables** tab; verify a seating grid layout mounts with 15 tables on 2 floors.
   - Navigate to **Inventory**; verify 20 raw stock items display with low stock warnings.

### Test Case: 2D Drag-and-Drop Seating Editor
1. Access `/dashboard/owner/tables` and click **Edit Floor Layout**.
2. Drag Table 3 from its current position to another quadrant on the grid canvas.
3. Reload the browser page.
4. **Verification**: Verify Table 3 mounts at its new coordinate position. (Confirm position updates were committed to `/restaurants/{tenantId}/tables` in Firestore).

---

## 2. Customer tableside flow tests

### Test Case: QR Landing page
1. Navigate to `/r/bella-italia/table-4` directly in a mobile browser simulator.
2. **Verification**:
   - The system parses tenant `bella-italia` and table `4`.
   - The portal loads the brand theme colors and displays Table 4 at the top.
   - The shopping cart is initialized to Table 4.

### Test Case: Order Checkout & Stripe Checkout
1. Browse categories and add 2 Pizzas and a Drink to the cart.
2. Click the floating basket icon and click **Checkout & Pay**.
3. Input card details in the Stripe Elements form and submit.
4. **Verification**:
   - The cart drawer closes and displays an "Order Submitted Successfully!" splash page.
   - Verify a document was created under `/restaurants/bella-italia/orders/` with status `'placed'` and paymentStatus `'paid'`.

---

## 3. Kitchen Display System (KDS) tests

### Test Case: Ticket Queue Synchronization
1. Keep the Kitchen Dashboard (`/dashboard/kitchen`) open on one monitor, and the Customer Portal checkout page on another.
2. Place a paid tableside order from the Customer Portal.
3. **Verification**:
   - A new ticket card populates the KDS **Table View** queue within 500ms without manual page refreshes.
   - Verify the elapsed relative timer chimes green and starts incrementing every second.

### Test Case: Status Advance & Waiter alerts
1. On the ticket card in KDS, click **Start Preparing**.
2. **Verification**: The ticket status transitions to `Preparing` in Firestore.
3. Click **Mark Ready**.
4. **Verification**:
   - The ticket shifts out of the active cooking queue.
   - Open the Waiter Alerts panel (`/dashboard/waiter/alerts`); verify Table 4 flashes in the **Pickup Alerts** queue.

---

## 4. Waiter Command Center tests

### Test Case: Seating Map requests
1. In the Customer Portal Tracking view, click **Call Waiter** and select **Request Water**.
2. Open the Waiter Floor Seating map (`/dashboard/waiter`).
3. **Verification**:
   - Table 4 flashes red on the floor map.
   - Open **Alerts Hub**; verify the request displays with an elapsed duration counter.
4. Click **Accept Alert**; verify status transitions to `Accepted`.
5. Click **Complete Alert**; verify the request is cleared and the table card returns to blue (occupied) status.
