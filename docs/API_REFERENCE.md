# API Reference: RestaurantOS Service Layer

This document details the frontend service APIs of **RestaurantOS** (v2.0-rc). These APIs wrap Firebase Client SDK operations to provide robust, typed methods for interacting with Firestore, Authentication, and Storage.

---

## 1. Authentication Service (`authService`)

Handles credential validation, password resets, registrations, and custom claims verification.

### Method: `signInWithEmail`
Authenticates B2B staff members or customers using credentials.
* **Input**:
  - `email`: string
  - `password`: string
  - `rememberMe`: boolean
* **Output**: `Promise<UserCredential>`
* **Errors**: Throws Firebase authentication errors (e.g. `auth/invalid-credential`, `auth/user-not-found`).

### Method: `signUpOwner`
Registers a new tenant restaurant owner and automatically triggers default database presets seeding.
* **Input**:
  - `email`: string
  - `password`: string
  - `displayName`: string
  - `restaurantName`: string
* **Output**: `Promise<UserCredential>`
* **Errors**: Throws validation exceptions if parameters are empty or email already exists.

### Method: `getUserClaims`
Retrieves decrypted custom JWT claims (role and tenantId boundaries) from the active token session.
* **Input**: `user: User` (Firebase Auth User)
* **Output**: `Promise<{ role?: TUserRole; tenantId?: string }>`
* **Errors**: Returns empty object on decoding failure.

---

## 2. Menu Management Service (`menuService`)

Wraps CRUD operations for menu categories and menu items.

### Method: `getItems`
Fetches all menu items matching the active tenant workspace.
* **Input**: `tenantId?: string`
* **Output**: `Promise<IMenuItem[]>`

### Method: `createItem`
Creates a menu item in Firestore.
* **Input**: `data: Omit<IMenuItem, 'id'>`, `tenantId?: string`
* **Output**: `Promise<string>` (Generated document ID)

### Method: `updateItem`
Updates specified fields of a menu item.
* **Input**: `id: string`, `data: Partial<IMenuItem>`, `tenantId?: string`
* **Output**: `Promise<void>`

---

## 3. Order Processing Service (`orderService`)

Manages customer table orders and kitchen preparing queues.

### Method: `createOrder`
Submits a table checkout order to Firestore. Computes totals, taxes, and adds snapshot timestamps.
* **Input**: `data: Omit<IOrder, 'id'>`, `tenantId?: string`
* **Output**: `Promise<string>` (Document ID)

### Method: `updateOrder`
Updates order status or payment conditions.
* **Input**: `id: string`, `data: Partial<IOrder>`, `tenantId?: string`
* **Output**: `Promise<void>`

### Real-Time Listener: `useOrdersListener`
Subscribes to orders matching the tenantId.
* **Input**: `tenantId: string`, `callback: (orders: IOrder[]) => void`
* **Output**: `Unsubscribe` function to clean up connection.

---

## 4. Seating & Floor Service (`tableService`)

Coordinates room tables arrangements coordinates and active occupancy flags.

### Method: `updateTableCoordinates`
Persists X/Y coordinate drag positions to Firestore.
* **Input**: `tableId: string`, `coordinates: { positionX: number; positionY: number }`, `tenantId: string`
* **Output**: `Promise<void>`

### Method: `updateTableStatus`
Sets status indicators (e.g. occupied, dirty, service_requested).
* **Input**: `tableId: string`, `status: TTableStatus`, `tenantId: string`
* **Output**: `Promise<void>`

---

## 5. Inventory & Stock Service (`inventoryService`)

Handles raw stock increments, expirations warnings, recipes linking, and waste logs.

### Method: `deductRecipeStock`
Asynchronously subtracts raw ingredients from inventory when an order ticket is completed by KDS.
* **Input**: `orderId: string`, `tenantId: string`
* **Output**: `Promise<void>`
* **Errors**: Logs warnings in Event Engine if ingredients drop below critical thresholds.

### Method: `logWaste`
Logs spoiled or wasted ingredients to help track cost leakages.
* **Input**: `ingredientId: string`, `quantity: number`, `reason: string`, `tenantId: string`
* **Output**: `Promise<void>`

---

## 6. Automation & Jobs Scheduler (`automationService`)

Runs background jobs checks (safety stock scans, CSAT alerts, briefings compiles).

### Method: `runBackgroundJobs`
Scans database metrics and fires notifications/suggestions.
* **Input**: `tenantId: string`
* **Output**: `Promise<{ success: boolean; logId: string }>`
* **Schedulers**:
  1. **Daily Stock Auditor**: Scans levels against safety reorder thresholds.
  2. **Expiration Monitor**: Flags items expiring in 3 days.
  3. **Briefings Compiler**: Assembles operations report cards nightly.

---

## 7. Point-of-Sale Desk Service (`billingService`)

Coordinates active register cash drawers shifts and watermarked printing controls.

### Method: `openShiftDrawer`
Opens a register float session, locking operations until completed.
* **Input**: `openingFloat: number` (in cents), `userId: string`, `tenantId: string`
* **Output**: `Promise<string>` (Generated shift document ID)

### Method: `holdCheck`
Temporarily suspends a checkout check under "Paused checks".
* **Input**: `orderId: string`, `reason: string`, `tenantId: string`
* **Output**: `Promise<void>`
