# Security & Compliance: RestaurantOS Security System

This document specifies the security controls, access limits, Firestore database policies, and compliance guidelines of **RestaurantOS** (v2.0-rc).

---

## 1. Authentication Security

- **JWT ID Tokens**: User verification is handled via Firebase Authentication using signed JSON Web Tokens (JWT).
- **Session Expiration**: Token sessions expire automatically after 1 hour of inactivity, requiring re-validation.
- **Custom Claims Gating**: Roles (`owner`, `waiter`, `kitchen`, etc.) and `tenantId` parameters are injected as custom JWT claims. This prevents users from altering their permissions via client-side code modifications.

---

## 2. Multi-Tenant Data Isolation (Firestore Rules)

Database-level isolation is enforced via Firestore Security Rules. All database queries must validate that the authenticated user belongs to the requested workspace.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuth() {
      return request.auth != null;
    }
    
    function userExists() {
      return exists(/databases/$(database)/documents/users/$(request.auth.uid));
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isTenant(tenantId) {
      return isAuth() && userExists() && getUserData().tenantId == tenantId;
    }

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

### Key Security Layers
1. **Stateless Claims Verification**: All actions targeting subcollections under `/restaurants/{tenantId}/` verify `isTenant(tenantId)`. This prevents cross-tenant access.
2. **Immutable Audit Trails**: Actions modifying settings or user roles write records to the `/auditLogs` collection. This collection is configured as write-only, preventing updates or deletions.

---

## 3. Storage Security Rules

Menu graphics and branding assets are stored in Firebase Storage. Access is restricted using path-based rules:

```javascript
service firebase.storage {
  match /b/{bucket}/o {
    match /tenants/{tenantId}/{allPaths=**} {
      allow read: if true; // Public access to render menus
      allow write: if request.auth != null && 
                      firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.tenantId == tenantId &&
                      (firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'owner' ||
                       firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 4. Input Validation & Form Security

- **Schema Validation**: Frontend forms are validated using Zod schemas (e.g. `loginSchema`, `registerSchema` in `users/validation.ts`) to verify format correctness before submission.
- **Floating Point Safety**: Menu pricing is stored as integers in cents (`1250` for `$12.50`) instead of floating-point values to prevent decimal calculation rounding errors.
- **PIN Gating**: Modifying sensitive POS parameters (such as applying high discounts or processing cancellations) requires entering a supervisor PIN (`1234`) to verify authorization.
