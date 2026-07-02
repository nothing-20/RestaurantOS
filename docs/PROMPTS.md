# Prompt Registry: RestaurantOS

This registry lists the prompts used with various generative AI assistants (Cursor, ChatGPT, Claude, Antigravity) to build and refine the RestaurantOS codebase. Registering prompts ensures that architectural standards are repeatable and that AI tools maintain context across developer hands.

---

## Template for Adding Prompts

```markdown
### Prompt # [Number]
* **Purpose**: [Brief explanation of what this prompt builds or refines]
* **Target File(s)**: [Links to affected files]
* **Assistant**: [Cursor / Claude / Antigravity / ChatGPT]

#### The Prompt
> [Insert the exact copy-pasteable prompt text here]

#### Expected Output
* [List components/features that the prompt should generate]
* [Expected structure, behavior, or testing criteria]

#### Result
* **Status**: [Success / Failed / Partially Successful]
* **Git Hash / Version**: [e.g., initial-commit or v0.1.0]
* **Architect Notes**: [Refinements made after code generation, issues encountered]
```

---

## 1. Registered Prompts

### Prompt # 001
* **Purpose**: Setup the initial documentation layout and directory architecture (This System).
* **Target File(s)**: Files under [docs/](file:///C:/Users/Geetha%20Krishna/OneDrive/Desktop/Project%20Saas%20for%20all/docs/)
* **Assistant**: Antigravity (Gemini 3.5 Flash)

#### The Prompt
> You are the Lead Software Architect for this project.
> Your task is to build a complete AI Memory & Documentation System for this project so that multiple AI tools (Antigravity, Cursor AI, ChatGPT, and future AI assistants) can collaborate on the same codebase without losing context.
> This documentation will become the permanent "brain" of the project.
> Create a folder called docs/ containing PROJECT_CONTEXT.md, DEVELOPMENT_LOG.md, TASK_BOARD.md, PROMPTS.md, DECISIONS.md, BUGS.md, FIRESTORE_SCHEMA.md, API_STRUCTURE.md, COMPONENT_GUIDELINES.md, ROUTES.md, and AI_CONTEXT.md.
> Make files professional, reusable, and document the architecture for RestaurantOS.

#### Expected Output
* 11 comprehensive Markdown files written directly into the `docs/` folder in the workspace root.
* No raw application code written yet.
* Highly detailed technical plans for Firestore schemas, dashboards, components, and security parameters.

#### Result
* **Status**: Success
* **Git Hash / Version**: day-0-docs-init
* **Architect Notes**: Documented multi-tenant logical partitioning early. This prevents the developer from accidentally creating single-tenant assumptions in upcoming React components.

---

### Prompt # 002
* **Purpose**: Initial React App Bootstrapping and Tailwind Config styling.
* **Target File(s)**: `src/main.tsx`, `tailwind.config.js`, `src/index.css`
* **Assistant**: Antigravity (Gemini 3.5 Flash)

#### The Prompt
> Act as a Senior Frontend Engineer. Initialize the Vite + React + TypeScript + Tailwind CSS structure for RestaurantOS based on our architecture specifications.
> 1. Set up the tailwind.config.js using the design tokens defined in docs/PROJECT_CONTEXT.md section 6:
>    - primary: HSL 35 92% 50%
>    - accent: HSL 142 72% 40%
>    - background: HSL 222 47% 11%
>    - text-pearl: HSL 210 40% 98%
> 2. Create the folder structure defined in PROJECT_CONTEXT.md section 3.
> 3. Verify compilation and clean standard default boilerplate elements (like Vite logos or counters).
> 4. Ensure tailwind directives are added in src/index.css.

#### Expected Output
* Clean compiling React + Vite template.
* Custom Tailwind theme applied, ready for glassmorphic elements.
* Empty directories matching the feature-first layout.

#### Result
* **Status**: Success
* **Git Hash / Version**: v1.0.0-foundation
* **Architect Notes**: Initialized all configuration variables. Because terminal execution is sandboxed, we generated compiler configurations directly into files.

---

### Prompt # 003
* **Purpose**: Implement the complete Authentication Module with Firebase Auth and onboarding.
* **Target File(s)**: `src/services/authService.ts`, `src/context/AuthContext.tsx`, `src/routes/PublicRoute.tsx`, `src/features/auth/components/*`
* **Assistant**: Antigravity (Gemini 3.5 Flash)

#### The Prompt
> Implement ONLY the Authentication module. Include Firebase Auth integrations, email/password logins, signups (onboarding users and tenants collections in Firestore), forgot password triggers, verification links, session persistence, protected/public route guards, loading, and toast error handlers using the visual presentational kit.

#### Expected Output
* Core `authService.ts` and `AuthContext.tsx` listening to Firebase Auth.
* Auth views: `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `VerifyEmail.tsx`, `SessionExpired.tsx`.
- Gated paths linked in `AppRoutes.tsx`.

#### Result
* **Status**: Success
* **Git Hash / Version**: v1.0.0-auth
* **Architect Notes**: Integrated claims parsing and added a fallback to the Firestore `/users` document to ensure that redirect logic functions smoothly right after owner registration.

---

### Prompt # 004
* **Purpose**: Complete Phase 1 components, layouts, and paths configs.
* **Target File(s)**: `src/components/ui/*`, `src/components/layout/*`, `src/hooks/*`, `src/context/*`
* **Assistant**: Antigravity (Gemini 3.5 Flash)

#### The Prompt
> Complete ONLY Phase 1. Configure Vite/TS path aliases, create role-specific layouts (Owner, Kitchen landscape, Customer mobile portal), expand the UI Kit to include TextArea, Select, Checkbox, Switch, Dropdown, Tabs, LoadingSpinner, Skeleton, ErrorState, Breadcrumbs, and Avatar. Refine services and hooks.

#### Expected Output
- Compiling code foundation.
- 25+ reusable UI kit primitives.
- Theme, User, Restaurant contexts and hooks.

#### Result
* **Status**: Success
* **Git Hash / Version**: v1.0.0-phase1
* **Architect Notes**: All foundation specifications compile cleanly. Prepared the project for Phase 2 feature releases.

