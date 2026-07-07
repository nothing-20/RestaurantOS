# Known Limitations: RestaurantOS v2.0 Release Candidate

The following limitations are present in the **RestaurantOS v2.0** Release Candidate sandbox environment:

## 1. Network Offline Mocking
- The offline state component handles connection loss alerts and provides a retry control.
- However, since Firebase requires active websocket ports, certain updates might queue locally until a stable internet connection is restored (Firestore Offline Persistence is enabled by default).

## 2. Image Asset Hosting
- Demo presets (menu items, branding, categories) use random images from Unsplash and Picsum.
- These require active internet access to render, and may fail if the user's connection blocks public CDNs.

## 3. Stripe Billing Integration
- Stripe customer and subscription parameters are mock placeholders (`cus_placeholder`, `sub_placeholder`) in sandbox databases. Real payment gateways require activating stripe configurations in backend functions.

## 4. Roster Employee Authentication
- Employees are seeded under `/employees` collection for roster and KDS assignment.
- Signing in as seeded mock employees (like Mario or Peter) requires registering their credentials in Firebase Auth manually, or simulating their sessions.

## 5. Automated Print Audits
- Invoice printing actions generate print stream logs inside the Event Engine database, but physical thermal print drivers must be configured locally.
