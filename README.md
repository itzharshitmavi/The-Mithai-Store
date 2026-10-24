# Mithai House 🍬
### Premium Indian Sweet Shop E-commerce Platform

Mithai House is a full-stack e-commerce application for an Indian sweet shop. It combines a customer storefront with a role-protected admin dashboard for managing products, weight-based pricing, online stock allocation, orders, delivery/pickup slots, coupons, festival ordering, and shop settings.

The project is built with **Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, and Prisma ORM**. It is designed around a practical shop workflow: staff allocate a quantity for online sales while keeping other stock available for walk-in customers. The system does not automatically know about offline sales unless a POS integration sends those sales to the application.

> **Project status:** This repository is a development-stage project. It has not been independently verified as production-ready. Review the known limitations and run the QA checklist before using it for real orders or payments.

---

## Contents

- [Features](#features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Run locally on Windows with native PostgreSQL](#run-locally-on-windows-with-native-postgresql)
- [Alternative: Run PostgreSQL with Docker](#alternative-run-postgresql-with-docker)
- [Environment variables](#environment-variables)
- [Database and Prisma commands](#database-and-prisma-commands)
- [Admin setup and sample data](#admin-setup-and-sample-data)
- [How the application works](#how-the-application-works)
- [Main routes](#main-routes)
- [Payments and notifications](#payments-and-notifications)
- [POS integration notes](#pos-integration-notes)
- [Troubleshooting](#troubleshooting)
- [Testing and production checklist](#testing-and-production-checklist)
- [Deployment overview](#deployment-overview)
- [Security notes](#security-notes)
- [Future improvements](#future-improvements)
- [License](#license)

---

## Features

### Customer storefront

- Responsive homepage and product catalogue.
- Product categories, product search, product detail pages, and product variants.
- Weight-based variants such as 250 g, 500 g, and 1 kg, each with its own price.
- Cart and checkout flow.
- Customer registration and login, guest checkout, order history, and order tracking.
- Delivery or in-store pickup selection with available time slots.
- Pincode validation and configurable delivery charges/minimum order settings.
- Coupon validation, customer reviews, contact information, and corporate/bulk enquiry form.
- Optional online payment integration through Razorpay; Cash on Delivery is also represented in the order model.

### Admin dashboard

The admin area is protected by authentication and role checks. Available pages cover:

- Dashboard and sales/order summaries.
- Product and category management.
- Online inventory allocation and stock movement records.
- Order review, status updates, cancellations, and refund-related actions.
- Delivery and pickup slot management.
- Festival mode controls.
- Coupon management.
- Customer and review management.
- Shop settings, reports, and corporate enquiries.

The dashboard is intended to be usable on mobile devices, but verify every workflow on the devices and browsers your staff will use.

### Inventory allocation for offline + online sales

The `InventoryAllocation` model represents the quantity that the shop makes available to the website. It is not a live count of all physical stock.

- Staff allocate an online quantity for each product variant.
- Online orders reserve or deduct stock according to payment method and order workflow.
- Staff can adjust online allocation, add prepared stock, or mark a variant limited/sold out.
- Inventory movements provide a record of allocation and stock changes.
- A POS integration can reduce online allocation when an offline sale is reported.

**Important:** Without POS integration, the website cannot know that a walk-in customer bought the last box. Staff must update the online allocation or pause ordering when necessary.

### Festival and time-slot controls

The project includes festival-related settings and delivery/pickup slot management. Slots have order and preparation-workload limits so full slots can be closed to further bookings. Confirm the implementation against `docs/QA-CHECKLIST.md`; daily workload limits and all real-world operating-hour rules should not be assumed complete until tested.

### Order and payment workflow

Order status and payment status are separate. The schema includes order statuses such as placed, confirmed, preparing, ready for pickup, out for delivery, delivered, cancelled, and rejected. Payment states include pending, paid, failed, refunded, and refund pending.

The payment webhook route is designed to verify Razorpay signatures and process provider events idempotently. This must be tested with Razorpay test credentials before accepting payments. Never treat a frontend redirect as proof of successful payment.

---

## Technology stack

- **Application:** Next.js 14 App Router, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **ORM and migrations:** Prisma 5
- **Authentication/security utilities:** `jose`, `bcryptjs`, Zod validation
- **Email:** Nodemailer (SMTP configuration required)
- **Payments:** Razorpay SDK (credentials and webhook configuration required)
- **Development tooling:** npm, TypeScript, `tsx`

This repository currently pins Next.js `14.2.18`. Check the [Next.js support policy](https://nextjs.org/support-policy) and plan a tested upgrade to a supported version before public production deployment.

---

## Architecture

This is a **modular monolith**, not a microservices system.

```text
Browser
  |
  v
Next.js App Router
  |-- Customer pages
  |-- Admin pages
  |-- API route handlers
  |
  v
Application modules (src/lib)
  |-- Authentication and authorization
  |-- Order and inventory workflow
  |-- Validation and money helpers
  |-- Email notification handling
  |-- POS sync handling
  |
  v
Prisma ORM
  |
  v
PostgreSQL
```

The main database entities include users, addresses, categories, products, variants, inventory allocations and movements, delivery slots, orders, order items, payments, webhook events, coupons, reviews, notifications, corporate enquiries, and shop settings.

Order items store product names, variant labels, and unit prices at purchase time so later catalogue changes do not rewrite the historical order description.

---

## Requirements

For a local Windows setup:

- Windows 10/11
- Node.js **22 LTS** recommended for this dependency set
- npm (included with Node.js)
- PostgreSQL 14 or newer
- Git (if cloning the repository)
- VS Code or another code editor

Docker Desktop is optional. Use either a native Windows PostgreSQL service or the Docker Compose database, but do not try to run both on the same port at the same time.

---

## Run locally on Windows with native PostgreSQL

These instructions are for developers who have installed PostgreSQL directly on Windows and do **not** want to use Docker.

### 1. Clone or extract the project

If using Git:

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd mithai
```

If you downloaded a ZIP, extract it and open the `mithai` project folder in VS Code.

Make sure the folder contains `package.json`, `prisma/`, and `src/`.

### 2. Install dependencies

```powershell
npm install
```

If installation fails, check your internet connection and npm registry access.

### 3. Create a PostgreSQL database

Ensure the PostgreSQL Windows service is running. You can check it from PowerShell:

```powershell
Get-Service *postgres*
Test-NetConnection localhost -Port 5432
```

The connection test should show `TcpTestSucceeded : True` if the server is listening on that port.

Create a database named `mithai` in pgAdmin, or from `psql` using an account with permission to create databases:

```sql
CREATE DATABASE mithai;
```

If the database already exists, do not create it again.

### 4. Create your local environment file

```powershell
Copy-Item .env.example .env
```

Open `.env` and set `DATABASE_URL` to match your **native PostgreSQL username, password, host, port, and database name**.

Example only:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/mithai?schema=public"
```

Replace `YOUR_POSTGRES_PASSWORD` with your actual local PostgreSQL password. If your database username is not `postgres`, replace that too.

Generate a random application secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the generated value into `AUTH_SECRET` in `.env`. Set your own development admin email and password too.

### 5. Validate and migrate the database

Run:

```powershell
npx prisma format
npx prisma validate
npx prisma migrate dev --name init
```

If migration files already exist in `prisma/migrations`, use:

```powershell
npx prisma migrate dev
```

Do not create a second initial migration unnecessarily. If Prisma reports a migration-history or schema-drift issue, stop and inspect the error before resetting anything.

### 6. Seed the admin account

Configure these variables in `.env`:

```env
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="Use-A-Strong-Local-Password"
```

Then run:

```powershell
npm run db:seed
```

The seed script creates or updates the admin record according to its implementation. Keep credentials private and do not use example passwords in production.

To seed the development sample catalogue as well:

```powershell
$env:SEED_SAMPLE = "1"
npm run db:seed
Remove-Item Env:SEED_SAMPLE
```

Sample products and catalogue records are for development only. Review and replace them before a real launch.

### 7. Start the development server

```powershell
npm run dev
```

Open these local URLs:

- Customer storefront: <http://localhost:3000>
- Login: <http://localhost:3000/login>
- Admin dashboard: <http://localhost:3000/admin>
- Product catalogue: <http://localhost:3000/products>
- Cart: <http://localhost:3000/cart>
- Checkout: <http://localhost:3000/checkout>
- Order tracking: <http://localhost:3000/track>

To stop the development server, press `Ctrl+C` in the terminal.

---

## Alternative: Run PostgreSQL with Docker

Use this option only if you prefer Docker instead of the Windows PostgreSQL service.

1. Start Docker Desktop and wait for its engine to be ready.
2. Stop the native PostgreSQL service if it already occupies port `5432`, or configure a different port deliberately.
3. From the project root, run:

```powershell
docker compose up -d db
docker compose ps
docker compose logs db
```

4. Create `.env` from `.env.example` and use the Docker Compose credentials from `docker-compose.yml`:

```env
DATABASE_URL="postgresql://mithai:mithai@localhost:5432/mithai?schema=public"
```

5. Run the Prisma migration and seed commands from the previous section.

To stop the Docker database without deleting its data:

```powershell
docker compose stop db
```

To start it again:

```powershell
docker compose up -d db
```

The Docker database volume and a native Windows PostgreSQL database are separate databases. Their users, passwords, tables, and data are not shared automatically.

---

## Environment variables

The `.env.example` file lists the variables used by the application. Create `.env` locally and **never commit it**.

| Variable | Purpose | Required for |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | All database-backed features |
| `AUTH_SECRET` | Secret used by application authentication/session code | Authentication |
| `APP_URL` | Application base URL | Local URLs and provider configuration |
| `SEED_ADMIN_EMAIL` | Admin account email for seeding | Initial admin setup |
| `SEED_ADMIN_PASSWORD` | Admin password for seeding | Initial admin setup |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | Online payment setup |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret | Server-side payment operations |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify webhook signatures | Verified payment webhooks |
| `SMTP_HOST` | SMTP server hostname | Email notifications |
| `SMTP_PORT` | SMTP server port (commonly `587`) | Email notifications |
| `SMTP_USER` | SMTP username | Authenticated SMTP |
| `SMTP_PASS` | SMTP password or provider app password | Authenticated SMTP |
| `MAIL_FROM` | Sender name and email | Email notifications |
| `CRON_SECRET` | Bearer secret for scheduled maintenance endpoint | Protected scheduled task |
| `POS_API_KEY` | Bearer secret for POS sync endpoint | Optional POS integration |

Use strong, unique secrets in any deployed environment. Do not place secret values in frontend code or commit them to Git.

---

## Database and Prisma commands

| Command | Purpose |
|---|---|
| `npx prisma format` | Format the Prisma schema |
| `npx prisma validate` | Validate the schema and datasource configuration |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev --name <name>` | Create and apply a development migration |
| `npx prisma migrate dev` | Apply pending development migrations |
| `npx prisma migrate deploy` | Apply committed migrations in deployment environments |
| `npm run db:seed` | Seed the admin account and configured development data |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma Client and build the Next.js application |
| `npm run start` | Start the built production application |

Do not use development migration commands as a substitute for a reviewed production migration workflow.

---

## Admin setup and sample data

1. Configure `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env`.
2. Run `npm run db:seed`.
3. Start the app with `npm run dev`.
4. Sign in at `/login`.
5. Open `/admin`.

If login fails, verify that the app and seed script use the same `DATABASE_URL`. If the admin email already exists, inspect the seed script's upsert/update behavior rather than repeatedly creating new users.

For local development sample catalogue data, set `SEED_SAMPLE=1` in the same PowerShell session before running the seed script, as shown above. Never use development sample data as the real shop's catalogue without reviewing every product, price, image, and stock allocation.

---

## How the application works

### Product and variant pricing

A product can have multiple weight variants. Each variant has its own gram weight and price stored in paise (₹1 = 100 paise). The server should calculate order totals using database prices rather than trusting prices submitted by the browser.

### Inventory allocation

The website sells from an explicitly allocated online quantity. Staff must maintain this allocation to reflect what they are willing to sell online. The application cannot infer walk-in sales without POS integration.

For unpaid online-payment orders, stock reservations use the configured reservation window. Expiry handling is implemented in application code and should be scheduled and tested in the deployment environment. COD and online-payment flows may commit stock at different points; test cancellations, late payment events, and reservation expiry carefully before launch.

### Order management

Customers submit checkout details and choose delivery or pickup. Admin/staff users review orders and advance their statuses through the available workflow. Payment state is stored separately from fulfilment state.

### Delivery and pickup slots

Slots have a date, fulfilment type, time range, open flag, order capacity, and preparation-workload fields. Admins configure slots in the dashboard. Validate slot timezone, opening-hour restrictions, capacity race conditions, and full-slot behavior during QA.

### Coupons and reviews

Coupon validation is handled by server routes. Reviews can be submitted and managed/approved through the relevant customer/admin pages. Test expiry, usage limits, invalid values, and authorization boundaries.

### Notifications

Email delivery uses SMTP and Nodemailer when configured. Notification records are stored so failures can be inspected. Configure a real SMTP provider and test retries and failure visibility before relying on email operationally.

---

## Main routes

### Customer routes

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/products` | Product catalogue |
| `/products/[slug]` | Product detail |
| `/corporate` | Corporate/bulk enquiry |
| `/cart` | Shopping cart |
| `/checkout` | Checkout |
| `/register` | Customer registration |
| `/login` | Login |
| `/orders` | Customer order history |
| `/orders/[id]` | Order details |
| `/track` | Order tracking |
| `/contact` | Shop contact page |

### Admin routes

| Route | Purpose |
|---|---|
| `/admin` | Dashboard |
| `/admin/products` | Product management |
| `/admin/inventory` | Online stock allocation and inventory movements |
| `/admin/orders` | Order management |
| `/admin/slots` | Delivery and pickup slots |
| `/admin/festival` | Festival ordering settings |
| `/admin/coupons` | Coupon management |
| `/admin/customers` | Customer management |
| `/admin/reviews` | Review moderation |
| `/admin/reports` | Reports |
| `/admin/settings` | Shop settings |
| `/admin/corporate` | Corporate enquiries |

API routes are implemented under `src/app/api/`. Inspect each route handler before extending it or exposing it publicly.

---

## Payments and notifications

### Razorpay

Online payments require valid Razorpay credentials and a configured webhook endpoint on a publicly reachable HTTPS deployment.

1. Start with Razorpay test mode.
2. Configure the key ID, key secret, and webhook secret in server environment variables.
3. Register the deployed webhook URL: `https://YOUR_DOMAIN/api/payments/webhook`.
4. Subscribe to the payment events required by the implementation, including `payment.captured`, `order.paid`, and `payment.failed` where supported by your Razorpay setup.
5. Verify webhook signatures and test duplicate deliveries, delayed events, browser closure, failed payments, cancellation, and refund handling.

Never mark a payment as paid only because a browser says payment succeeded. Confirm the server-side webhook/payment verification behavior in the actual deployed configuration.

### Email

Configure SMTP values in `.env` or the production host's secret manager. Email delivery will not work until a valid SMTP service is configured. SMS and WhatsApp are not configured as complete delivery channels in this version.

---

## POS integration notes

The repository includes a POS sync API route at `/api/pos/sync`. The optional integration uses `POS_API_KEY` and expects an authenticated request with sales containing an external sale identifier, variant ID, and quantity.

Before connecting a real POS:

- Inspect `src/app/api/pos/sync/route.ts` and `src/lib/pos.ts`.
- Confirm the payload and authentication format with your POS provider.
- Test duplicate sale events and idempotency.
- Verify what happens if the POS sale arrives after online stock has been reserved or sold.
- Do not assume that any POS is automatically connected.

---

## Troubleshooting

### `P1001: Can't reach database server`

- Confirm PostgreSQL is running.
- Run `Test-NetConnection localhost -Port 5432`.
- Check the host and port in `DATABASE_URL`.
- Confirm Docker/native PostgreSQL are not conflicting on port `5432`.

### `P1000: Authentication failed`

- Verify the PostgreSQL username and password in `DATABASE_URL`.
- Confirm you are connecting to the intended server (native Windows PostgreSQL or Docker).
- The credentials in the Docker Compose file do not automatically apply to your native PostgreSQL installation.

### Prisma schema or migration errors

```powershell
npx prisma format
npx prisma validate
```

Read the first error carefully. Do not delete the database or run a reset command against data you need to preserve.

### Admin login fails

- Check that `npm run db:seed` completed successfully.
- Confirm the `.env` email and password match the seed inputs.
- Confirm the web app and seed command point to the same database.
- Check the terminal for server-side errors.

### `/admin` returns HTTP 500

Check the terminal where `npm run dev` is running. The stack trace identifies the failing page, API route, or database query. Fix the specific query or validation issue rather than recreating the database unless the error explicitly indicates a schema problem.

### Port 5432 is already in use

Only one PostgreSQL server can bind to the same local address and port. Stop the server you are not using or deliberately configure a different port and update `DATABASE_URL`.

---

## Testing and production checklist

A manual QA checklist is provided at [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md). No automated test suite has been verified as passing in this project snapshot.

Before taking real orders, test at least:

- Two customers attempting to purchase the final online unit simultaneously.
- Online stock allocation changes and products selling out offline.
- Full delivery/pickup slots and festival order limits.
- Invalid delivery PIN codes, closed shop days, and unavailable slots.
- Duplicate checkout submissions and order idempotency.
- Payment success when the customer closes the browser.
- Invalid and duplicate payment webhooks.
- Payment failure, late payment after reservation expiry, cancellations, and refunds.
- Failed email notifications and retry visibility.
- Authorization checks for customer, staff, and admin users.
- Upload validation and persistence of product images.
- Database backup and restore.

Also run:

```powershell
npx prisma validate
npm run build
```

A successful local development server alone is not evidence that all flows work or that the application is production-ready.

---

## Deployment overview

A production deployment needs:

1. A supported Node.js runtime and a tested, supported Next.js version.
2. A managed PostgreSQL database with backups and restricted credentials.
3. All environment variables configured through the hosting provider's secret manager.
4. HTTPS and a correct `APP_URL`.
5. Production database migrations run using `npx prisma migrate deploy`.
6. A persistent image-storage solution. The current local `public/uploads` approach needs review for serverless hosting; use durable object storage such as S3-compatible storage or a managed image service where appropriate.
7. A scheduled task calling `/api/cron/expire` every five minutes with `Authorization: Bearer <CRON_SECRET>`, if this matches the deployed route's requirements.
8. Razorpay webhook registration and testing if online payments are enabled.
9. SMTP configuration and notification testing.
10. Logs, monitoring, backups, rate limiting appropriate to the deployment, and a tested recovery plan.

The current in-memory rate limiter is not shared across multiple server instances. Use a shared store such as Redis/Upstash if deploying multiple instances. Set the server timezone to `Asia/Kolkata` where the application expects IST slot handling, and test daylight/timezone conversions explicitly.

Do not publish this project as a live shop until security review, dependency updates, migration testing, payment tests, and the full QA checklist have been completed.

---

## Security notes

- Never commit `.env`, database passwords, API keys, webhook secrets, or SMTP credentials.
- Use strong unique secrets in production; rotate any secret that was accidentally exposed.
- Use HTTPS for production authentication and payment callbacks.
- Do not trust client-supplied prices, order totals, coupon discounts, stock quantities, or payment success.
- Verify authentication and authorization on every protected server route.
- Validate and limit uploaded file types and sizes.
- Restrict access to the PostgreSQL server and take regular backups.
- Keep dependencies updated and review security advisories before launch.

---

## Future improvements

Possible next steps, after the core flows are tested:

- Automated unit, integration, and end-to-end tests.
- Upgrade to a supported Next.js major and re-test all application flows.
- Shared/distributed rate limiting.
- Durable object storage for product images.
- More robust notification retries and operational monitoring.
- POS provider integration and reconciliation.
- Batch-level stock, expiry tracking and automatic expiry write-offs.
- Loyalty programmes and customer retention features.
- SMS/WhatsApp notifications and corporate-order workflow improvements.

---

## License

No license has been specified in this repository yet. Add a `LICENSE` file before accepting external contributions or declaring the project open source. Without a license, normal copyright restrictions apply.
