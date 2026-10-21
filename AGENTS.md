# AGENTS.md — Email System Guidelines & Architecture

Welcome to the **Email System** repository. This document defines the architectural patterns, conventions, workflows, and rules for AI agents and developers working on this codebase.

---

## 1. Project Overview & Directory Structure

This project is a decoupled full-stack platform consisting of an **Express 5 backend** and a **React 19 Vite frontend**.

```
EmailSystem/
├── AGENTS.md                 # System documentation & agent directives (this file)
├── backend/                  # Node.js + Express 5 + MySQL REST API
│   ├── src/
│   │   ├── config/           # Database pool, schema, migrations, seed, mailer
│   │   ├── controllers/      # Skinny HTTP controllers
│   │   ├── services/         # Fat business logic & database operations
│   │   ├── middlewares/      # Authentication, role authorization, Zod validation
│   │   ├── routes/           # Express endpoint routers
│   │   ├── utils/            # ErrorFactory, ResponseFactory, JWT, Crypto, Templates
│   │   ├── validations/      # Zod input schemas
│   │   ├── app.js            # Express app configuration & global middlewares
│   │   └── server.js         # Entrypoint & database connection verification
│   ├── .env.example          # Environment variable template
│   └── package.json
└── frontend/                 # React 19 + Vite 8 Single Page Application
    ├── src/
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 2. Core Backend Guidelines & Architecture

### A. Layered Architecture (Controller-Service-Repository)
- **Routes (`src/routes/`)**: Define HTTP methods, routes, and attach middleware (`validate`, `authenticateToken`, `requireRole`).
- **Controllers (`src/controllers/`)**: **Must remain skinny**. They only parse HTTP input (`req.body`, `req.ip`), invoke service methods, and pass results to `ResponseFactory`.
- **Services (`src/services/`)**: Contain all business logic, database queries, transactions, hashing, and external integrations.
- **Utils (`src/utils/`)**: Reusable helper utilities. Never write duplicate crypto, response, or error formatting logic.

### B. Standardized Responses (`ResponseFactory`)
All controllers must return responses via [src/utils/responseFactory.js](file:///Users/akshu/Developer/EmailSystem/backend/src/utils/responseFactory.js):
```javascript
// 200 OK
ResponseFactory.success(res, 'Success message', data);

// 201 Created
ResponseFactory.created(res, 'Resource created successfully', data);

// 204 No Content
ResponseFactory.noContent(res);
```

### C. Standardized Error Handling (`ErrorFactory` & Express 5)
- **Express 5 Native Async Support**: Do **NOT** use `asyncHandler` wrappers or `try/catch` boilerplate just to pass errors to `next(err)`. Express 5 automatically forwards uncaught promise rejections from `async` route handlers directly to the global error middleware in [src/middlewares/error.middleware.js](file:///Users/akshu/Developer/EmailSystem/backend/src/middlewares/error.middleware.js).
- **Throw standard errors** using [src/utils/errorFactory.js](file:///Users/akshu/Developer/EmailSystem/backend/src/utils/errorFactory.js):
```javascript
throw ErrorFactory.badRequest('Invalid input data', errors, 'VALIDATION_ERROR');
throw ErrorFactory.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
throw ErrorFactory.forbidden('Access denied.', 'FORBIDDEN');
throw ErrorFactory.notFound('Resource not found.', 'NOT_FOUND');
throw ErrorFactory.conflict('Email address is already in use.', 'EMAIL_EXISTS');
```

### D. Input Validation (`ZodType`)
- Define all validation schemas in `src/validations/` using **Zod**.
- **Notice**: Use `import('zod').ZodType` instead of deprecated `ZodSchema`.
- Apply validation on routes using `validate(schema)` from `src/middlewares/validate.middleware.js`.

### E. Password Hashing & Sensitive Credential Security
- **Passwords**: Always hashed with **Argon2id** via `src/utils/password.js`. Never use bcrypt or plain SHA hashes.
- **Sensitive Credentials (e.g., SMTP Passwords)**: Must be encrypted before saving to MySQL using **AES-256-GCM** via `src/utils/crypto.js` and decrypted on-the-fly when dispatching emails.

---

## 3. Email Delivery & SMTP Architecture

### A. Dual SMTP Resolution (Platform Default vs. Custom Admin SMTP)
The email subsystem supports a per-admin multi-tenant model:
1. **Platform Default SMTP**: Configured via `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
   - If credentials are not set in `.env` in development, it automatically spins up an [Ethereal.email](https://ethereal.email) test inbox and logs clickable message preview URLs in the console.
2. **Custom Admin SMTP (Opt-In)**:
   - Any admin can configure their own SMTP server in the `admin_smtp_settings` table.
   - Credentials are verified before saving and encrypted with AES-256-GCM.
   - Admins can toggle between their custom SMTP and the platform default SMTP anytime.
   - When sending an email, `EmailService.sendMail({ adminId, to, ... })` automatically queries `SmtpService.getTransporterForAdmin(adminId)` to resolve the active custom transporter or smoothly fall back to the platform default.

---

## 4. Database & Migrations

### A. Database Management
- The project uses **MySQL 8** accessed via `mysql2/promise` connection pooling in [src/config/db.js](file:///Users/akshu/Developer/EmailSystem/backend/src/config/db.js).
- **Schema Source of Truth**: [src/config/schema.sql](file:///Users/akshu/Developer/EmailSystem/backend/src/config/schema.sql).
- **Run Migrations**:
  ```bash
  npm run db:init
  ```
- **Seed Super Admin**:
  ```bash
  npm run seed
  ```

### B. Core Tables
1. `admins`: Super admin and admin profiles with `role ENUM('super_admin', 'admin')`, `status`, and `created_by` foreign key.
2. `admin_tokens`: Refresh tokens, password reset tokens, and invitation tokens.
3. `admin_activity_logs`: Audit trail for admin registrations, logins, and settings updates.
4. `admin_smtp_settings`: Per-admin custom SMTP configurations, encryption, and toggle flags.
5. `email_templates`: Canonical email templates created and managed by Super Admin (`slug`, `name`, `subject`, `body_html`, `body_text`, `design_json`, `variables`, `category`, `created_by`).
6. `admin_template_customizations`: Per-admin customizations on top of canonical templates with `design_json` block state and `is_active` soft-rollback toggle.

### C. Visual Drag & Drop Builder Architecture
- **Block State & Compilation**: Visual templates store structured JSON (`design_json = { blocks: [...] }`) representing headings, paragraphs, action buttons, image banners, dividers, spacers, and 2-column sections.
- **Server & Client Compilers**: [src/utils/templateCompiler.js](file:///Users/akshu/Developer/EmailSystem/backend/src/utils/templateCompiler.js) compiles visual block trees into responsive, bulletproof inline-styled HTML and plain text for Nodemailer.
- **Frontend Studio**: Built with React 19, supporting palette drag & drop, block reordering, property inspection, test merge variables simulation, and instant live preview.

---

## 5. API Endpoints Reference

### Auth (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Log in as Super Admin or Admin | No |
| `POST` | `/api/auth/signup` | Register a new Admin account | Optional (sets `created_by` if Super Admin token provided) |
| `GET` | `/api/auth/me` | Retrieve profile of authenticated admin | Bearer Token |

### Admin Custom SMTP (`/api/admin/smtp`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/smtp` | Get current admin's SMTP status & settings | Bearer Token |
| `POST` | `/api/admin/smtp` | Save and verify custom SMTP credentials | Bearer Token |
| `POST` | `/api/admin/smtp/verify` | Test SMTP credentials without saving | Bearer Token |
| `PATCH`| `/api/admin/smtp/toggle` | Toggle between custom SMTP and platform default | Bearer Token |
| `DELETE`| `/api/admin/smtp` | Remove custom SMTP and revert to platform default | Bearer Token |

### Email Delivery & Status (`/api/emails`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/emails/smtp-status` | Check platform SMTP connectivity | Bearer Token |
| `POST` | `/api/emails/send-test` | Send a test email using active SMTP | Bearer Token |
| `POST` | `/api/emails/send-templated` | Send a templated email with dynamic variables | Bearer Token |

### Email Templates & Customization (`/api/templates`)
| Method | Endpoint | Description | Auth Required | Role |
|---|---|---|---|---|
| `GET` | `/api/templates` | List all templates with customization indicators | Bearer Token | All Admins |
| `GET` | `/api/templates/:id` | Get template (effective, default, & custom versions) | Bearer Token | All Admins |
| `POST`| `/api/templates/:id/preview` | Render preview with test variables | Bearer Token | All Admins |
| `POST`| `/api/templates` | Create a new default canonical template | Bearer Token | Super Admin Only |
| `PUT` | `/api/templates/:id` | Update default canonical template | Bearer Token | Super Admin Only |
| `DELETE`| `/api/templates/:id` | Delete default canonical template | Bearer Token | Super Admin Only |
| `POST`| `/api/templates/:id/customize` | Save/update admin's custom template version | Bearer Token | All Admins |
| `PATCH`| `/api/templates/:id/toggle` | Soft rollback/reactivate admin customization | Bearer Token | All Admins |
| `DELETE`| `/api/templates/:id/customize` | Permanently discard custom version & revert to default | Bearer Token | All Admins |


---

## 6. Frontend Guidelines & Design Standards

- **Stack**: React 19, Vite 8, Vanilla CSS / CSS Modules.
- **Design Philosophy**:
  - Deliver premium, high-craft aesthetics (dark themes, curated typography, subtle micro-animations, glassmorphism).
  - Use responsive layouts with clear visual feedback for loading, error, and success states.
  - Keep client components focused and decoupled from raw API transport details by using standard fetch services.

---

## 7. Development & Operational Commands

### Backend (`EmailSystem/backend`)
```bash
# Run server with hot-reload and .env loading
npm run dev

# Run database schema migrations
npm run db:init

# Seed initial Super Admin account
npm run seed
```

### Frontend (`EmailSystem/frontend`)
```bash
# Start Vite development server
npm run dev

# Build production bundle
npm run build
```

> [!TIP]
> **File Ownership & Sudo Permissions Fix**:
> Never run `npm` or `npm install` with `sudo`. If `node_modules` or `~/.npm` permissions become locked by `root`, restore ownership using:
> ```bash
> sudo chown -R $(whoami) ~/.npm
> sudo chown -R $(whoami) /Users/akshu/Developer/EmailSystem/frontend/node_modules
> sudo chown -R $(whoami) /Users/akshu/Developer/EmailSystem/backend/node_modules
> ```
