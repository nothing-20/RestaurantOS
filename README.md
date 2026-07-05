# RestaurantOS: Multi-Tenant Restaurant SaaS Platform

RestaurantOS is a production-grade multi-tenant Restaurant Management SaaS platform built with React 18, TypeScript, Vite, Tailwind CSS, and Firebase. 

---

## 1. Project Directory Structure
All client-side Firebase configurations are centralized inside the `src/firebase/` directory:
- **`config.ts`**: Initializes the Firebase app instance, Firestore, Auth, and Storage.
- **`auth.ts`**: Centralized authentication wrappers for registrations, claims checks, and persistence settings.
- **`firestore.ts`**: Reusable generic CRUD service models to manage collections with automatic multi-tenant scoping filters.
- **`storage.ts`**: Handles assets upload with fallback profiles.
- **`collections.ts`**: Houses standard paths for all merchant databases subcollections.
- **`seed.ts`**: Handles populating test environments.

---

## 2. Firebase Configurations & Setup

### Step A: Configure Environment Variables
Create a `.env` file at the project root based on `.env.example`:
```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=restaurant-os.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=restaurant-os
VITE_FIREBASE_STORAGE_BUCKET=restaurant-os.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

### Step B: Build & Local Execution
1. Install package dependencies:
   ```bash
   npm install
   ```
2. Start the local Vite development server:
   ```bash
   npm run dev
   ```
3. Compile for production distribution:
   ```bash
   npm run build
   ```

---

## 3. Firestore Collections Schema
The database uses a subcollection model nested under tenant workspaces:
- `/tenants/{tenantId}`: Platform subscription configurations, plan tier and status labels.
- `/users/{userId}`: User profile identifiers and role metadata.
- `/restaurants/{tenantId}/menu/{itemId}`: Merchant dish list definitions.
- `/restaurants/{tenantId}/orders/{orderId}`: Active dining tickets logs.
- `/restaurants/{tenantId}/tables/{tableId}`: Seating capacity parameters.
- `/restaurants/{tenantId}/employees/{employeeId}`: Role-based permissions assignments.
- `/restaurants/{tenantId}/inventory/{itemId}`: Safety levels ingredient limits.
- `/auditLogs/{logId}`: Immutable logs tracking pricing shifts or account changes.

---

## 4. Firestore Security Rules
Deploy rules from `firestore.rules` enforcing absolute tenant isolation:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isTenant(tenantId) { return isAuth() && getUserData().tenantId == tenantId; }

    match /restaurants/{tenantId}/{subcollection}/{docId} {
      allow read: if isAuth() && isTenant(tenantId);
      allow write: if isAuth() && isTenant(tenantId) && (
        getUserData().role == 'owner' || 
        getUserData().role == 'admin' ||
        (subcollection == 'orders' && (getUserData().role == 'waiter' || getUserData().role == 'kitchen' || getUserData().role == 'customer'))
      );
    }
  }
}
```

---

## 5. Instant Test Seeding
Access the **Super Admin Panel** (`/super-admin`) and enter a workspace name (e.g. `test-restaurant`) inside the **Workspace Database Seeding** panel. Clicking **Seed Tenant** instantly inserts:
- 2 branches
- 20 complete menu items (organized under Starters, Mains, Desserts, and Beverages)
- 8 dining tables
- 5 mock staff members
- 2 active orders
- Raw ingredients stock records.

---

## 6. Troubleshooting
- **Error: `Missing environment configurations`**: Double-check your `.env` formatting and confirm Vite keys are prefixed with `VITE_`.
- **Firebase Auth claims latency**: During the first sign-up, custom auth claim propagation might face Firestore latency. The system automatically falls back to Firestore database lookups to fetch roles instantly.
