# Frontend Architecture Walkthrough: Sentra AI Platform

This document provides a comprehensive code walkthrough of the Sentra AI Platform frontend repository, designed to help developers understand the overall architecture, technologies, module structure, and routing.

## 1. Project Overview and Technology Stack

The project is an enterprise-grade Angular web application (utilizing Angular v21+). It leverages modern frontend patterns, standalone components, and robust third-party libraries.

**Core Tech Stack:**
- **Framework:** Angular 21 (with Standalone Components).
- **Styling & UI Library:** [PrimeNG](https://primeng.org/) along with `primeflex` and `primeicons`. Bootstrap 5 is also included for utility layouts.
- **Data Visualization:** `chart.js`, `echarts`, and `ngx-echarts`.
- **Authentication:** Dual capability with Azure MSAL (`@azure/msal-angular`) and Okta (`@okta/okta-angular`).
- **Build & Tooling:** TypeScript 5.9, ESLint, Prettier, Vitest/Jest for testing.

## 2. Directory Structure

The source code primarily lives in the `src/` directory. Here is a high-level overview of the application's layout:

```text
src/
├── app/
│   ├── auth/            # Authentication guards and interceptors
│   ├── components/      # Main feature components (Sentra Halo, Guard, Dashboard, etc.)
│   ├── core/            # Core services, constants, and HTTP interceptors
│   ├── layout/          # Main application layout, sidebar, topbar wrapper
│   ├── oktacallback/    # OAuth callback handler for Okta integration
│   ├── app.routes.ts    # Main routing configuration
│   ├── app.config.ts    # Application-wide providers and configuration
│   └── app.ts           # Root application component
├── environments/        # Environment-specific configuration files
├── main.ts              # Application bootstrap entry point
├── styles.scss          # Global stylesheet including PrimeNG theme overrides
└── index.html           # Main HTML entry file
```

## 3. Core Architecture & Routing (`app.routes.ts`)

The application employs a role-based access control (RBAC) routing architecture with lazy-loaded components. 

### Public Routes
- **`/login`**: The authentication entry point. It utilizes the `SignIn` component and is protected by `PublicGuard`.
- **`/login/callback`**: Handles the SSO redirect callback via `Oktacallback`.

### Protected Application Routes
The core application routes are nested under a main `Layout` wrapper component. Access requires a valid session (managed by `AuthGuard`). Inside the layout, individual routes are protected by a granular `permissionGuard` ensuring the user has specific module access.

**Key Feature Modules (Lazy Loaded):**
- **Sentra Halo** (`/sentra-halo`): Centralized AI monitoring dashboard.
- **Sentra Guard** (`/sentra-guard`): AI data loss prevention and sensitive data protection.
- **Sentra Dashboard** (`/sentra-dashboard`): General Guard Dashboard.
- **Sentra Verify** (`/sentra-verify`): AI response validation and verification.
- **Sentra Trust** (`/sentra-trust`): AI governance and trust management.
- **Sentra Forge** (`/sentra-forge`): AI workflow creation and orchestration.
- **Sentra Watch** (`/sentra-watch`): Real-time AI activity monitoring.
- **Sentra Command** (`/sentra-command`): Centralized AI operations management.
- **Sentra Pulse** (`/sentra-pulse`): AI insights, analytics, and health metrics.

**Settings & Configuration Routes:**
These routes manage system configurations and RBAC policies:
- `/access-policy`: Role-based access and security policy management.
- `/pii-entity`: Personally identifiable information (PII) configuration.
- `/custom-rules`: Custom governance rules.
- `/prompt-config`: Master AI governance prompt template configuration.
- `/role-access`: Screen-level permission configurations for each role.
- `/health-sync-monitor`: Monitoring and synchronizing health data.

### Fallback Routes
- `/forbidden` & `/login-failed`: Error state pages for unauthorized access or authentication failures.
- `/**`: Catch-all wildcard leading to a 404 `NotFound` component.

## 4. Components Structure (`src/app/components/`)

The `components` directory houses individual, encapsulated features. Since the project heavily leans on Angular's modern Standalone Components architecture, each feature directory typically contains:
- The component TypeScript file (e.g., `sentra-halo.ts`).
- The component HTML template (e.g., `sentra-halo.html`).
- Component-scoped SCSS styling (e.g., `sentra-halo.scss`).
- Accompanying sub-components and localized services (if applicable).

> [!TIP]
> **Standalone Components**
> Notice that modules are loaded directly via `loadComponent` in the router (`import('./...').then(m => m.ComponentName)`). This indicates the project does away with heavy `NgModules`, promoting faster build times and better tree-shaking.

## 5. Security & Authentication (`src/app/auth/`)

The application's security posture is handled through a combination of Guards and Interceptors:

1. **`AuthGuard`**: Checks if a user is authenticated before allowing them to load the main Layout.
2. **`PublicGuard`**: Ensures authenticated users are redirected away from the login page.
3. **`permissionGuard`**: A parameterized guard (e.g., `canActivate: [permissionGuard('Dashboard')]`) that validates if the authenticated user's role has the necessary claims to access a specific screen.

## 6. Core Services (`src/app/core/`)

The `core` folder is the backbone of the application's shared logic and data fetching, acting as a singleton layer:
- **`services/`**: Contains shared business logic, HTTP client wrappers, and API services communicating with the backend.
- **`interceptors/`**: Global HTTP interceptors. For example, `loader-interceptor.ts` is used to trigger a global loading spinner (`src/app/components/loader`) during network requests.
- **`constants/`**: Application-wide constants, ENUMs, and configuration dictionaries.
- **`shared/`**: Reusable models, interfaces, and helper utility functions.

## Summary

The Sentra AI Platform frontend is a highly modular, secure, and modern Angular application. It uses a clean standalone component structure, lazy-loads its heavy features for optimal performance, and integrates deep role-based access control directly into its routing layer. Its heavy use of PrimeNG and advanced charting libraries (Echarts) positions it to deliver robust enterprise dashboards.
