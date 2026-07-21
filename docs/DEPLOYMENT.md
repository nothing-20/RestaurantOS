# Deployment Guide: Production Operations

This document specifies the compilation pipeline, edge-cache CDN hosting setups, and environment variable requirements of **RestaurantOS** (v2.0-rc).

---

## 1. Build Pipeline

The application is built using Vite.

```bash
# Clean cache and compile optimized client assets
npm run build
```

This compiles static resources (HTML, CSS, JS, compressed assets) and bundles them inside the `/dist` directory.

---

## 2. Environment Variables Integration

Create a `.env` file at the root containing the Firebase configurations:

```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=restaurantos-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=restaurantos-prod
VITE_FIREBASE_STORAGE_BUCKET=restaurantos-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

### Production Security
* **Do not commit secrets**: Ensure the `.env` file is listed in `.gitignore`.
* **CI/CD Injection**: Inject these values as environment secrets (e.g. GitHub Action Secrets) during production builds.

---

## 3. Firebase Hosting & Deployment

The static application bundles are deployed to **Firebase Hosting** for high-speed edge caching delivery.

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Authenticate and Select Project
```bash
firebase login
firebase use production-project-id
```

### Step 3: Deploy Application Assets
```bash
firebase deploy --only hosting
```

### Step 4: Deploy Security rules and indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 4. Rollback & Failover Procedures

If a production build introduces critical bugs, use the Firebase Console or CLI to roll back immediately:

### CLI Rollback (Single Command)
Roll back to a previous deployment release version:
```bash
# List recent hosting releases
firebase hosting:channel:list

# Roll back hosting release version
firebase hosting:rollback
```

### Verification Checklist
- [ ] Confirm Firestore security rules did not revert to legacy schemas.
- [ ] Clear browser cache or force-reload page to fetch the restored build.
- [ ] Verify that tableside QR portals continue resolving slug paths correctly.
