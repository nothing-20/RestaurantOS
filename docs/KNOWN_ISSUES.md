# Known Issues & Technical Debt: RestaurantOS

This document specifies the sandbox limitations, known bugs, performance considerations, and technical debt markers of **RestaurantOS** (v2.0-rc).

---

## 1. Active Sandbox Limitations

The following mock limitations apply to the v2.0 sandbox environment:

- **Offline WebSockets Mocking**: Firestore's offline persistence handles local connection losses and queues database updates. However, certain realtime features may temporarily suspend sync actions until a stable network connection is restored.
- **Image CDNs Blocks**: Presets seeders load images from public CDNs (e.g. Unsplash, Picsum). If the local network blocks public CDNs, menu graphics and branding logos may render as generic placeholders.
- **Stripe Subscriptions**: Payment profiles utilize mock parameters (`cus_placeholder`, `sub_placeholder`) in development. Activating real payments requires updating the configuration keys and deploying serverless functions.
- **Employee Credentials**: The demo seeder generates 5 mock employees. Signing in as a mock employee requires registering their email in Firebase Auth or using simulated sessions.
- **Thermal Printing Drivers**: Printing receipts triggers printing log logs in the database, but direct physical thermal print drivers must be configured on local devices.

---

## 2. Technical Debt & Code Cleanup Area

- **Direct Firestore Imports**: In some legacy dashboard pages, Firestore functions are imported directly rather than calling methods in `src/shared/services/`. These should be refactored to use the unified services layer.
- **State Selection**: Some heavy dashboard pages subscribe to the entire Zustand store rather than using selector slices (`useCartStore(state => state.items)`). This can cause unnecessary component re-renders when unrelated state variables update.
- **Denormalized Redundancy**: Menu item pricing is denormalized directly inside the `orders` document to protect against future price changes. This is standard practice, but updates to active items in progress must be handled carefully.

---

## 3. Potential Improvements & Optimization Checklist

- **Dynamic Lazy Loading**: B2B dashboards are currently bundled together. Lazy-loading dashboards via `React.lazy()` would decrease the initial JS bundle size and improve page load speeds on mobile waiter devices.
- **IndexedDB Sync Warnings**: A warning toast should be added if database writes are stuck in the offline queue for over 60 seconds, helping staff identify Wi-Fi connectivity drops.
- **Image Compressors**: Implementing client-side WebP compressors would ensure uploaded menu images do not exceed the 150KB size cap.
