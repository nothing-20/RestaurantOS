# Multi-Tenant Architecture: RestaurantOS

This document specifies the multi-tenant isolation, routing structures, database scoping, and subscriptions management model of **RestaurantOS** (v2.0-rc).

---

## 1. Tenancy Model Overview

RestaurantOS implements a **logical multi-tenancy model** using a shared database instance model. Rather than provisioning separate database clusters or dedicate servers per tenant (which complicates updates and aggregation metrics), all merchant records co-exist in shared collections.

```mermaid
graph TD
    subgraph Client Routing slugs
        URL1[app.restaurantos.com/r/bella-italia/table-4]
        URL2[app.restaurantos.com/r/sakura-ramen/table-2]
    end

    subgraph Logical Partitions (Firestore collections)
        DB[(Firestore Cloud DB)]
        Tenant1[/tenants/bella-italia]
        Tenant2[/tenants/sakura-ramen]
        
        SubColl1[(/restaurants/bella-italia/orders)]
        SubColl2[(/restaurants/sakura-ramen/orders)]
    end

    URL1 -->|Resolves tenantId| Tenant1
    URL2 -->|Resolves tenantId| Tenant2
    Tenant1 -->|CRUD Scoped| SubColl1
    Tenant2 -->|CRUD Scoped| SubColl2
```

### Purpose
Logical multi-tenancy simplifies SaaS billing aggregations, decreases client onboarding times, and eliminates infrastructure scaling overhead.

---

## 2. Workspace & Data Isolation

Data isolation is guaranteed through database structures and rule validations:

### Firestore Path Structures
All operational records are nested under a primary `/restaurants/{tenantId}` path.
- **Menu Items**: `/restaurants/{tenantId}/menu/default/items/{itemId}`
- **Active Orders**: `/restaurants/{tenantId}/orders/{orderId}`
- **DINING Tables**: `/restaurants/{tenantId}/tables/{tableId}`

### Firestore Security Rules Enforcement
Database access rules validate user alignment:
```javascript
function isTenant(tenantId) {
  return isAuth() && userExists() && getUserData().tenantId == tenantId;
}

match /restaurants/{tenantId}/{subcollection}/{docId} {
  allow read: if isAuth() && isTenant(tenantId);
  allow write: if isAuth() && isTenant(tenantId) && (
    getUserData().role == 'owner' || 
    getUserData().role == 'admin'
  );
}
```
If a staff member tries to execute a query or load a document belonging to another restaurant, Firestore throws a security exception client-side.

---

## 3. Subdomain & Tenant Routing Namespaces

Tenant identity is parsed dynamically from the browser address slug:
- **Diner URL**: `/r/:tenantId/table/:tableId` (e.g. `/r/bella-italia/table-5`)
- **Customer Pages**: `/customer/restaurant/:tenantId/menu`

Upon URL access:
1. `TenantContext.tsx` extracts `tenantId` from the route parameter.
2. It fetches the restaurant metadata profile (`/tenants/{tenantId}`) to check if the workspace status is `active`.
3. If active, it binds the restaurant's settings (currency symbols, tax rates) and injects the branding theme colors dynamically.

---

## 4. SaaS Subscription Quota Caps

RestaurantOS scales pricing tiers based on resource usage. Quota checks run inside `WorkspaceContext.tsx` and platform hooks.

| Subscription Tier | Monthly Price | Seating Table limit | Employee Roster Limit | Active Branch locations |
| :--- | :--- | :--- | :--- | :--- |
| **Starter** | $49 | Up to 10 tables | Up to 5 employees | 1 location |
| **Pro** | $149 | Up to 50 tables | Up to 20 employees | Up to 3 locations |
| **Enterprise** | $390+ | Unlimited | Unlimited | Unlimited |

### Enforcement Logic
- When an owner tries to create a new dining table or invite a staff member, the frontend queries the current size of the collection and compares it against the active `planTier` limits fetched from `/tenants/{tenantId}`.
- If the limits are exceeded, the dashboard displays a premium upgrade banner and blocks the creation form.
- If a tenant's subscription status changes to `'suspended'` or `'expired'`, the `WorkspaceGuard` redirects staff to the renewal panel to prevent unpaid usage.
