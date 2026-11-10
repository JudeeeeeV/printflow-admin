# PrintFlow - Administrator Portal

## 1. Project Description

This separate React application is used by authorized PrintFlow administrators to review platform activity, shop verification, payment disputes, administrator accounts, and registered printer agents through the NestJS backend.

Access uses backend-enforced authorization and TOTP two-factor authentication. Browser route guards are not the authorization boundary; student/shop accounts do not grant administrator access.

## 2. Features and Responsibilities

- Protected administrator sign-in, TOTP enrollment, and verification.
- Platform overview and shop-verification decisions.
- Receipt-dispute review under backend payment, lifecycle, and refund rules.
- Administrator management and printer-agent visibility.
- Authenticated requests, administrator sessions, and audit workflows.

Shop-permit AI suggestions are optional and backend-controlled; they do not replace an administrator's decision. Disputes do not provide an unrestricted override of closed-order rules.

| Important path                | Responsibility                                          |
| ----------------------------- | ------------------------------------------------------- |
| `src/main.tsx`, `src/App.tsx` | Startup and login/protected routing.                    |
| `src/pages/auth/`             | Login, TOTP setup, and verification.                    |
| `src/pages/dashboard/`        | Overview, administrators, disputes, and printer agents. |
| `src/layouts/`                | Authentication and authenticated workspace shells.      |
| `src/config/runtime.ts`       | Backend URL and derived `/admin` API prefix.            |

## 3. Technology Stack

| Area        | Technologies                                           |
| ----------- | ------------------------------------------------------ |
| Application | React 19, TypeScript, Vite 8, React Router.            |
| UI          | Tailwind CSS 4, Carbon icons, Framer Motion, Recharts. |
| API         | Axios and the shared NestJS administrator endpoints.   |
| Validation  | TypeScript build, ESLint, Node regression tests.       |

The admin bundle does not initialize a Supabase client or require a privileged Supabase key. The backend manages Supabase access and encrypted TOTP data.

## 4. Prerequisites

- Git, npm, and **Node.js `>=24.14.1 <25`**.
- A compatible [backend](https://github.com/JudeeeeeV/printflow-backend#5-installation-and-local-setup) using the team's initialized development Supabase project.
- A maintainer-provisioned administrator account and TOTP authenticator application.
- The backend's stable `TOTP_ENCRYPTION_KEY` and required administrator/session migrations.

There are no default administrator credentials or public administrator signup. A maintainer provisions the first account; subsequent accounts use the administrator-management workflow. Do not embed credentials, TOTP seeds, or enrollment QR images in documentation.

## 5. Installation and Local Setup

```bash
git clone https://github.com/JudeeeeeV/printflow-admin.git
cd printflow-admin
npm install
```

Create a local `.env` in the repository root using the inline configuration in Section 6. If it already exists, update only the required settings; do not overwrite unrelated values. Keep this local file out of Git.

Set `VITE_API_URL=http://localhost:3000`. Start the backend separately with `ADMIN_URL=http://localhost:3001`, then run:

```bash
npm run dev
```

Open [http://localhost:3001/login](http://localhost:3001/login). [`vite.config.ts`](vite.config.ts) reserves **port 3001** with `strictPort: true`; startup fails if the port is occupied. Complete TOTP enrollment or verification when prompted.

## 6. Environment Variables

Create your local `.env` using this inline example:

```dotenv
# Backend origin only; the app appends /admin.
VITE_API_URL=http://localhost:3000
```

| Variable       | Requirement and purpose                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL` | Set explicitly for development/deployment. Backend origin, such as `http://localhost:3000`, **without `/admin`**; runtime configuration appends that prefix. |

Without an explicit value, the runtime falls back to the configured deployed API. Set the development origin before starting local work to avoid targeting production.

`VITE_` settings are public browser/build values. Never include JWT/agent signing secrets, TOTP encryption keys, privileged Supabase keys, passwords, or Microsoft provider secrets. Restart the development server after edits and rebuild/redeploy for production changes.

Backend `ADMIN_URL` must match the exact portal origin and allow credentialed requests. Changing the browser API URL does not change backend cookie, CORS, or origin configuration.

## 7. Running and Building the Application

| Command                          | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                    | Vite on strict port 3001.                                               |
| `npm run build`                  | TypeScript checks and production output in `dist/`.                     |
| `npm run preview -- --port 4174` | Preview separately from the main frontend; not a production/API server. |
| `npm test`                       | Existing dispute-review regressions.                                    |
| `npm run lint`                   | ESLint validation.                                                      |

```bash
npm run build
npm run preview -- --port 4174
```

For authentication from preview, configure the backend's `ADMIN_URL` for the preview origin. A successful static build does not create administrator accounts, install migrations, or configure TOTP.

## 8. Deployment

- **Administrator portal:** production URL awaiting team confirmation. A Render service name alone does not establish its final public hostname.
- **Configured backend:** [PrintFlow API](https://printflow-backend-wen3.onrender.com); awaiting confirmation as the official production endpoint.
- **Student/shop portal:** [Open PrintFlow](https://printflow-frontend-aje0.onrender.com/index.html).

[`render.yaml`](render.yaml) defines a **Render Static Site**, Node.js 24.14.1, `npm ci && npm run build`, `dist` publishing, and SPA rewrites to `/index.html`.

Set `VITE_API_URL` in Render before building. Configure backend `ADMIN_URL` for the actual HTTPS portal origin, retain the TOTP/session migrations, and review the site's Content-Security-Policy `connect-src` when changing API hosts. Deploy compatible API/client revisions together.

## 9. Related Repositories

- [Project overview](https://github.com/JudeeeeeV/printflow)
- [Student and shop frontend](https://github.com/JudeeeeeV/printflow-frontend)
- [Backend API and Windows printer agent](https://github.com/JudeeeeeV/printflow-backend)
- [Administrator portal](https://github.com/JudeeeeeV/printflow-admin)

## Contributors

- Jude Mikael Valencia
- Karol Vincent Bebedor
- Noeh Arbee Boiser
- Aldrin Suse
