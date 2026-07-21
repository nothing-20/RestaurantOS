# Release Checklist: RestaurantOS Deployment Protocol

This document specifies the validation checklist, testing checks, and deployment steps required before certifying a release of **RestaurantOS** (v2.0-rc).

---

## 1. Pre-Release Code Integrity Checkpoints
- [ ] **TypeScript Builds**: Run `npm run build` locally to confirm there are no TypeScript compiler warnings.
- [ ] **ESLint Verification**: Run `npm run lint` to confirm code style compliance.
- [ ] **Dependencies Check**: Verify there are no unused packages or vulnerability warnings.
- [ ] **JSDoc Audit**: Confirm all new shared hooks, contexts, and API functions have descriptive JSDoc comments.

---

## 2. Multi-Tenant Database Audits
- [ ] **Security Rules Simulation**: Run Firestore rules test suites to verify that `request.auth.token.tenantId` is checked on all read/write actions under `/restaurants/{tenantId}`.
- [ ] **Composite Indexes**: Verify that any custom filters (such as KDS queues sorted by `createdAt`) have matching index rules in `firestore.indexes.json`.
- [ ] **Bypass Rules Verification**: Confirm that owners can still access the `/dashboard/owner/billing` path even if their restaurant subscription status is `'expired'` or `'suspended'`.

---

## 3. Operations User Journey verifications
- [ ] **Customer Ordering**: Scan tableside QR, add modifiers, calculate cart service charges/GST, verify Stripe checkout completes successfully, and verify status moves to KDS.
- [ ] **Kitchen Prep**: Verify orders populate on the KDS Table queue, elapsed timers tick live, and advancing state updates the diner tracker.
- [ ] **Waiter Alerts**: Verify completed KDS tickets route to wait staff alert hubs, call waiter water/bill bells trigger table red flashing indicators, and checkout updates table status to dirty.
- [ ] **SaaS Billing**: Verify that subscription upgrades dynamically adjust tables and employee invite limits.

---

## 4. Production Deployment & Rollbacks
- [ ] **Deploy Assets**: Run `firebase deploy --only hosting` to update hosting assets.
- [ ] **Deploy Database Configs**: Run `firebase deploy --only firestore:rules,firestore:indexes`.
- [ ] **Cache Flush**: Verify hosting CDN headers are configured properly to prevent browsers caching stale index.html files.
- [ ] **Rollback verification**: Perform a rollback check inside the Firebase Console to verify build rollbacks function successfully in case of emergency.
