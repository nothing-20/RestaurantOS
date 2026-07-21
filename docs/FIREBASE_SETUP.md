# Firebase Configuration & Setup: RestaurantOS

This document specifies the configurations, database security setup, and hosting deployments steps for **RestaurantOS** (v2.0-rc) on Google Firebase.

---

## 1. Firebase Core Services Map

RestaurantOS relies on four core serverless Firebase services:
1. **Firebase Authentication**: Manages secure email login sessions, passwords hashing, and JWT Custom Claims mapping (tenantId, roles).
2. **Cloud Firestore**: Holds NoSQL document collections and subcollections for menu items, active table orders, seating arrangements, and inventory stock levels.
3. **Firebase Storage**: Media buckets hosting branding logos and compressed menu photos.
4. **Firebase Hosting**: Worldwide edge CDN delivering compiled React SPA static assets.

---

## 2. Configuration Setup Guide

### Step 1: Create a Project in the Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Input a project name (e.g. `restaurant-os-prod`) and complete the creation steps.
3. Navigate to **Project Settings** -> **General** -> **Your Apps** and register a Web App.
4. Copy the `firebaseConfig` object variables.

### Step 2: Enable Firebase Authentication
1. Select **Authentication** in the sidebar and click **Get Started**.
2. Select **Sign-in Method** and enable **Email/Password**.
3. (Optional) Enable **Anonymous** provider to support diner menu browsing without registration.

### Step 3: Initialize Cloud Firestore
1. Select **Firestore Database** in the sidebar and click **Create Database**.
2. Select **Start in Test Mode** (temporary to enable initial setup) and pick a database location matching your region.
3. Complete database creation.

### Step 4: Configure Environment Variables
Create a `.env` file at the root folder containing the variables copied from Step 1:
```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

---

## 3. Firestore Rules & Indexes Deployment

Deploy the multi-tenant isolation rules from the local `firestore.rules` file:

```bash
# Install Firebase CLI tools globally
npm install -g firebase-tools

# Login to your account
firebase login

# Bind the project
firebase use your-project-id

# Deploy rules and composite index setups
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 4. Seeding Demo Databases Presets

RestaurantOS includes automated presets seeders inside `seed.ts` (Italian Bistro / Japanese Ramen).

1. Log in to the Super Admin Dashboard or Owner Settings.
2. Under **Demo Mode / Presets**, select **Italian Bistro** or **Japanese Ramen** and click **Seed Preset**.
3. The client wipes operational records and writes categories, items, dining tables, employee roster details, low-stock warnings, and historical events to Firestore automatically, creating a fully functional demo sandbox environment.
