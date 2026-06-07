# SMSVN

SMSVN is a full-stack SMS OTP rental platform built for reseller workflows. The application provides a customer-facing dashboard for renting phone numbers, receiving OTP messages, managing wallet balance, and reviewing transaction history. It also includes an administrator workspace for service pricing, deposit approvals, gateway settings, user management, and operational statistics.

## Overview

The project is structured as a Vite React frontend with an Express TypeScript backend. The backend integrates with a SIM/OTP provider, persists application data in MySQL, signs user sessions with JWT, and supports wallet deposits through PayOS, VietQR fallback, and USDT-oriented workflows.

## Core Features

- User registration, login, JWT authentication, and protected routes.
- SMS OTP rental flow with active rental tracking and auto-refresh.
- Wallet balance management with deposit transaction history.
- PayOS payment link generation with manual VietQR fallback.
- Administrative user management and balance adjustment.
- Service synchronization from the upstream SIM provider.
- Custom service pricing, markup configuration, and bulk price adjustment.
- Deposit approval workflow for pending payment transactions.
- Public landing page, authenticated dashboard, history, wallet, profile, support, and admin screens.
- API payload encryption middleware for application responses and encrypted request bodies.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router |
| Backend | Express, TypeScript, tsx |
| Database | MySQL 8 |
| Authentication | JWT, bcryptjs |
| Payments | PayOS, VietQR fallback, USDT workflow |
| Provider Integration | CodeSim API |
| Tooling | Docker Compose, npm, TypeScript |

## Project Structure

```text
.
|-- assets/              # Static and generated assets
|-- docker/              # Deployment-related files
|-- public/              # Public browser assets
|-- server/              # Express backend, database, workers, integrations
|-- src/                 # React frontend source
|-- docker-compose.yml   # Local MySQL service
|-- index.html           # Vite HTML entry
|-- package.json         # Scripts and dependencies
|-- tsconfig.json        # TypeScript configuration
`-- vite.config.ts       # Vite configuration and API proxy
```

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop or a local MySQL 8 instance
- CodeSim API key
- PayOS credentials, if automatic payment links are required

## Environment Variables

Create a local `.env` file from `.env.example`.

```bash
cp .env.example .env
```

Configure these values before running the backend:

| Variable | Description |
| --- | --- |
| `PORT` | Backend server port. Default is `5000`. |
| `APP_URL` | Public application URL used for payment return and cancel links. |
| `CODESIM_API_KEY` | API key for the upstream SIM/OTP provider. |
| `DB_HOST` | MySQL host. |
| `DB_PORT` | MySQL port. |
| `DB_USER` | MySQL username. |
| `DB_PASSWORD` | MySQL password. |
| `DB_NAME` | MySQL database name. |
| `PAYOS_CLIENT_ID` | PayOS client ID. |
| `PAYOS_API_KEY` | PayOS API key. |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key. |
| `PRICE_MARKUP_FLAT` | Fixed markup added to upstream service prices. |
| `PRICE_MARKUP_PERCENT` | Percentage multiplier for service price markup. |
| `JWT_SECRET` | Secret key used to sign JWT sessions. |

Do not commit `.env` or production secrets. The repository is configured to ignore `.env*` files while keeping `.env.example`.

## Local Development

Install dependencies:

```bash
npm install
```

Start MySQL with Docker Compose:

```bash
docker compose up -d
```

Start the backend API:

```bash
npm run server
```

Start the frontend development server in another terminal:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies `/api` requests to `http://localhost:5000`.

## Build

Run TypeScript validation:

```bash
npm run lint
```

Create a production frontend build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend Notes

The backend is responsible for:

- Initializing the database layer.
- Starting background workers for OTP polling and payment workflows.
- Encrypting JSON API responses through middleware.
- Handling authentication and role-based administrator access.
- Synchronizing service data from the upstream provider.
- Recording rentals, deposits, refunds, and wallet transactions.

## Deployment Checklist

- Set strong production values for `JWT_SECRET` and all provider credentials.
- Use a managed MySQL instance or a persistent Docker volume.
- Configure `APP_URL` to the deployed frontend URL.
- Configure PayOS webhook routing to `/api/payment/webhook` when PayOS is enabled.
- Keep `.env` out of version control.
- Run `npm run lint` and `npm run build` before release.

## GitHub Setup

If this folder is not already a Git repository, initialize it before the first push:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

For an existing repository, use:

```bash
git add README.md
git commit -m "Improve project README"
git push
```

## License

No license has been defined yet. Add a license before publishing the project as open source.
