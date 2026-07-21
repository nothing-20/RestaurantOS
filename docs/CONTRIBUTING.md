# Contributing Guidelines: RestaurantOS

This document specifies the Git branching workflows, pull request steps, and issue reporting standards for developers contributing to **RestaurantOS** (v2.0-rc).

---

## 1. Code Contribution Lifecycle

All developer contributions (features additions, bugfixes, refactoring, doc updates) must follow a structured workflow to maintain stability in multi-tenant environments:

```text
1. Find/Create Issue ──> 2. Create Branch ──> 3. Implement & Test ──> 4. Pull Request ──> 5. Review & Merge
```

---

## 2. Git Branching Strategy

Our repository uses a Git Flow branching model:
- **`main`**: Production release branch. Code must compile and be fully verified.
- **`develop`**: Active development branch. Daily updates merge here.
- **Feature Branches (`feature/feature-name`)**: Isolated branches created from `develop` for implementing specific features.
- **Hotfix Branches (`hotfix/hotfix-name`)**: Branches created directly from `main` to address critical production issues.

---

## 3. Commit Message Standards

Commits must follow the Conventional Commits specification to generate clean release notes:

```text
<type>(<scope>): <short description>
```

### Types
- **`feat`**: Adds a new feature (e.g. `feat(kds): add cooking pause states`).
- **`fix`**: Resolves a bug (e.g. `fix(auth): prevent custom claims overwrite race condition`).
- **`docs`**: Updates documentation (e.g. `docs(api): document tableService methods`).
- **`refactor`**: Modifies code structure without changing features or fixing bugs.
- **`test`**: Adds or updates test files.

---

## 4. Pull Request Requirements

Before opening a pull request (PR) targeting the `develop` branch, verify:
1. **Typescript Compilation**: Run `npm run build` to verify there are no TypeScript compiler warnings.
2. **ESLint Validation**: Run `npm run lint` to confirm the codebase adheres to our syntax rules.
3. **Firestore Rules Checks**: Confirm that path alterations do not bypass B2B multi-tenant boundaries checked in `firestore.rules`.
4. **Walkthrough update**: Update the `walkthrough.md` log inside the PR details to describe what was changed.
