# Authentication & Access Control: RestaurantOS

This document details the authentication models, credentials verification pathways, role mapping, and route guards of **RestaurantOS** (v2.0-rc).

---

## 1. Authentication Pipelines

RestaurantOS implements dual authentication paths using Firebase Authentication:
1. **B2B Staff Portals (`/staff/login`)**: Universal login page verifying credentials (email/password). JWT ID tokens carry custom claims mapped from the Firestore `/users/{uid}` document to authenticate access to operational dashboards.
2. **B2C Customer Portal (`/customer/login`)**: Handled via email logins. Allows diners to log in or register to track checkouts history, accumulate loyalty points, and redeem rewards coupons.

---

## 2. Dynamic Session Setup & User Registration

```mermaid
graph TD
    Owner[Owner Registers via /register] --> CreateAuth[Create Firebase Auth User]
    CreateAuth --> CreateUserDoc[Create /users/{uid} document with role: 'owner']
    CreateUserDoc --> SeedDatabase[Trigger database seeder for restaurant presets]
    
    Invite[Owner invites staff via Staff Manager] --> CreateInviteDoc[Create /employees/{employeeId} invitation document]
    CreateInviteDoc --> ActivateWizard[Employee navigates to /staff/activate]
    ActivateWizard --> VerifyEmail[Wizard verifies email is invited]
    VerifyEmail --> CreateStaffAuth[Employee registers password]
    CreateStaffAuth --> CreateStaffUserDoc[Create /users/{uid} document with role]
    CreateStaffUserDoc --> LinkRoster[Update employee roster doc status to active]
```

### Owner Registration
- Owners register using their email, name, and restaurant name at `/register`.
- The frontend calls `authService.signUpOwner`. This creates the Firebase Auth user, writes a `/users/{uid}` profile, sets up the `/tenants/{tenantId}` profile, and triggers `seed.ts` to populate default menus, tables, and inventory.

### Employee Onboarding Activation
- Traditional manual staff creation by owners is decoupled to prevent password sharing.
- **Invite**: Owners input employee names and emails in `OwnerStaffManager.tsx`. This creates a document under the root `/employees` collection with status `'invited'`.
- **Activation Wizard (`/staff/activate`)**: Employees search for their invitation using their email. The wizard validates the code, prompts them to enter their password, executes `createUserWithEmailAndPassword`, writes the corresponding `/users/{uid}` document, and links the Firebase UID back to the employee roster.

---

## 3. Custom Claims Roles Matrix (RBAC)

User privileges are governed by Role-Based Access Control (RBAC). Roles are encoded into JWT Custom Claims for stateless backend evaluation inside Firestore Security Rules.

| Role | Scope | Key Permissions | Dashboard Path |
| :--- | :--- | :--- | :--- |
| `super-admin` | Platform-wide | Suspends tenants, overrides billing quotas, views platform MRR | `/super-admin` |
| `owner` | Single tenant | Modifies tax rates, manages billing, triggers database seeds | `/dashboard/owner` |
| `admin` | Single tenant | Modifies menu categories, edits inventory thresholds, edits tables | `/dashboard/owner` (restricted) |
| `manager` | Single tenant | Manages tables allocations, checks shift logs | `/dashboard/manager` |
| `waiter` | Single tenant | Takes manual tableside orders, splits bills, processes checkouts | `/dashboard/waiter` |
| `kitchen` | Single tenant | Updates prepare/ready tickets status, modifies menu availability | `/dashboard/kitchen` |
| `customer` | Tenant scope | Browses digital menu, places cart checkout orders, tracks status | `/customer/home` |

---

## 4. Front-End Guards Interceptors

Gating is enforced at the React Router layer using specialized wrapper components in `src/routes/`:

### `ProtectedRoute` / `PublicRoute`
* **`ProtectedRoute`**: Rejects unauthenticated users and redirects them to the universal login.
* **`PublicRoute`**: Intercepts authenticated users trying to access login pages and routes them to their respective dashboards.

### `WorkspaceGuard`
* **Purpose**: Sequentially validates the workspace configuration before mounting B2B dashboard pages.
* **Steps**:
  1. Checks if the `/users/{uid}` document exists in Firestore.
  2. Verifies that the employee status is `'active'`.
  3. Verifies that the parent `/tenants/{tenantId}` document is active.
  4. Bypasses lockouts for owners targeting `/dashboard/owner/billing` if their subscription status is `'expired'` or `'cancelled'`.

### `RoleGuard`
* **Purpose**: Checks the user's role against the route's `allowedRoles` array.
* **Redirection**: Redirects unauthorized staff members to `/unauthorized` to prevent transversal navigation.

---

## 5. Session Persistence & Security Controls

- **Local Persistence**: Staff sessions are configured to use `localStorage` (`browserLocalPersistence`) to keep employees logged in across device restarts on POS tablet terminals.
- **Claims Stale Prevention**: If custom claims are empty during startup (e.g. immediately after registration before functions execute), the client queries the `/users/{uid}` Firestore document directly as a fallback, ensuring seamless, zero-downtime logins.
