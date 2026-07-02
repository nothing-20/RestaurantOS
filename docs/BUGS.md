# Bug Registry: RestaurantOS

This registry serves as the system bug tracker. When developers or QA engineers discover issues during coding or testing, they must record them here with reproduction steps and resolution notes.

---

## Bug Template

```markdown
### [BUG-ID]: [Short Title]
* **Priority**: [Low / Medium / High / Critical]
* **Status**: [New / Investigating / In Progress / Fixed / Closed]
* **Reporter**: [Name / AI Agent Name]
* **Date Reported**: [YYYY-MM-DD]

#### Description
[Describe the bug, user actions leading up to it, and the difference between expected and actual outcomes.]

#### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

#### Tech Details
* **Device / Browser**: [e.g., iPhone 15 Safari, Chrome v120]
* **Console Errors / Server Logs**:
  ```text
  [Insert code blocks or trace messages here]
  ```
* **Suspected Files**: [Link to files]

#### Solution / Fix
* **Developer Assigned**: [Name]
* **Resolution Description**: [Details on how the code was modified to resolve the bug]
* **PR / Commit ID**: [Git hash]
```

---

## 1. Active Bugs

*No active bugs reported. (Day 0 planning phase)*

---

## 2. Example Bug Entry (Reference Only)

### BUG-001: Real-time Kitchen Order Listener Memory Leak
* **Priority**: High
* **Status**: Fixed
* **Reporter**: Antigravity AI
* **Date Reported**: 2026-07-02

#### Description
When kitchen staff toggle between active and archive order views, multiple Firestore real-time snapshot listeners are spawned without being disposed of. This causes a memory leak, eventual page freeze on low-tier kitchen tablet hardware, and massive database read count amplification.

#### Steps to Reproduce
1. Log in to the Kitchen Dashboard.
2. Click the "Archive View" tab.
3. Click the "Active Orders" tab.
4. Repeat 20 times.
5. Inspect Firestore billing metrics / Network tab (observe duplicate database responses).

#### Tech Details
* **Device / Browser**: Android Tablet / Google Chrome v124
* **Suspected Files**: [kitchen-dashboard/OrderQueue.tsx](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/src/features/kitchen-dashboard/OrderQueue.tsx)

#### Solution / Fix
* **Developer Assigned**: Senior Frontend Engineer
* **Resolution Description**: Encapsulated the snapshot listener in a standard `useEffect` hook and returned the unsubscribing cleanup function properly. Added a ref hook to check if a listener is already active before spawning a new subscription.
* **PR / Commit ID**: `f8b2d1c`
