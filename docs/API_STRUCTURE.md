# API Structure & Services: RestaurantOS

RestaurantOS utilizes direct client-side database connections secured through client SDK parameters and Firebase security rules, combined with serverless functions for critical operations like Stripe processing.

---

## 1. Firebase Services Core (`src/services/`)

These modules wrap the Firebase JS SDK to provide structured, typed API helpers.

### `authService.ts`
Manages user authentication states, login/logout, and reads custom JWT tokens.
```typescript
export interface IAuthService {
  loginWithEmail(email: string, password: string): Promise<UserCredential>;
  logoutUser(): Promise<void>;
  registerOwner(email: string, password: string, name: string): Promise<UserCredential>;
  resetPassword(email: string): Promise<void>;
  getUserClaims(): Promise<{ role?: string; tenantId?: string }>;
}
```

### `dbService.ts`
Generic Firestore CRUD utilities that enforce typescript types and handle error logs.
```typescript
export interface IDbService {
  getDocument<T>(collectionPath: string, docId: string): Promise<T | null>;
  addDocument<T>(collectionPath: string, data: T): Promise<string>; // Returns docId
  setDocument<T>(collectionPath: string, docId: string, data: T): Promise<void>;
  updateDocument<T>(collectionPath: string, docId: string, data: Partial<T>): Promise<void>;
  deleteDocument(collectionPath: string, docId: string): Promise<void>;
}
```

### `storageService.ts`
Handles uploading menu and restaurant photos, with compression rules.
```typescript
export interface IStorageService {
  uploadImage(file: File, path: string): Promise<string>; // Returns public downloadURL
  deleteImage(url: string): Promise<void>;
}
```

---

## 2. React Context Providers (`src/context/`)

These contexts maintain global React state and inject configurations downstream.

### `AuthContext.tsx`
* **Exposes**:
  - `user`: Authenticated User object or `null`.
  - `role`: Role string cached from JWT custom claims.
  - `tenantId`: Tenant ID parsed from user profile claims.
  - `isLoading`: Boolean state for loading screen.
* **Usage**: Wrap application layouts to verify user identity.

### `TenantContext.tsx`
* **Exposes**:
  - `tenant`: The current `ITenant` configuration document.
  - `isLoadingTenant`: Boolean.
  - `error`: If tenant slug is invalid or suspended.
* **Usage**: Scans path parameter `/r/:tenantId` (Customer Portal) or user claims (dashboard) to inject tenant configuration (e.g. logos, business hours, menu styling).

### `CartContext.tsx`
* **Exposes**:
  - `cartItems`: Array of active items, customized choices, and quantities.
  - `addItem(item, customization, quantity)`: Appends or updates items.
  - `removeItem(cartId)`: Removes specific customization block.
  - `cartTotal`: Computed sum in cents.
  - `clearCart()`: Deletes cart memory.
* **Usage**: Customer portal shopping experience.

---

## 3. Custom React Hooks (`src/hooks/`)

Reusable functional hooks encapsulating real-time listener setups and cache rules.

### `useOrdersListener(tenantId: string, statusFilter?: string[])`
* **Purpose**: Subscribes to the `orders` collection, matching tenant boundaries.
* **Behavior**:
  - Returns `orders: IOrder[]` array.
  - Returns `isLoading: boolean`.
  - Cleans up subscription on component unmount.
* **Used In**: Kitchen order queue, waiter dashboards, and owner active trackers.

### `useTableStatus(tenantId: string)`
* **Purpose**: Listens to the `tables` collection to sync waiter table grid layouts.
* **Exposes**:
  - `tables: ITable[]`
  - `updateTableStatus(tableId, status)`: Sets table state (e.g. "bill_requested").

### `useMenuFetcher(tenantId: string, menuId?: string)`
* **Purpose**: Fetches menu layout categories and associated items.
* **Features**: Implements in-memory state caching to avoid duplicate Firestore read hits when flipping screens.

---

## 4. Utilities (`src/utils/`)

Pure helper functions to standardize formats.

### `formatPrice(priceInCents: number): string`
* **Input**: `1250`
* **Output**: `"$12.50"` (Localized for regional currencies based on tenant config).

### `dateHelpers.ts`
* `formatTimestamp(isoString: string): string` -> (e.g. `"02 Jul 2026, 21:58"`)
* `getElapsedMinutes(isoString: string): number` -> Calculates time delta for kitchen ticket duration metrics.

---

## 5. Stripe Shared Services (`src/services/stripe.ts`)

Encapsulates cloud function API calls to Stripe.

### `createSaaSCheckout(priceId: string, tenantId: string): Promise<void>`
Triggers cloud billing function and redirects the Restaurant Owner to the Stripe checkout gateway.

### `createOrderPaymentSession(order: IOrder): Promise<void>`
Initializes a customer tableside order checkout and returns Stripe checkout keys.
