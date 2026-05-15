# StellarHaul

![Stellar](https://img.shields.io/badge/Stellar-Network-blue?logo=stellar)
![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![License](https://img.shields.io/badge/License-MIT-yellow)

Smart logistics matching platform built on Stellar and Soroban that connects farmers, transporters, and buyers through decentralized delivery coordination, escrow payments, and on-chain reputation.

## Overview

StellarHaul enables secure produce transportation, transparent logistics tracking, and trustless payments for emerging market supply chains. Farmers post cargo jobs, transporters accept and fulfill deliveries, and buyers confirm receipt — all coordinated through Soroban smart contracts with XLM escrow payments and on-chain reputation scores.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Mobile                      │
│                    Next.js 14 Frontend                       │
│   Freighter Wallet ──► Zustand Store ──► REST API calls      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼──────────────────────────────────┐
│                   Express.js Backend (Node 20)               │
│   Routes: jobs · users · escrow · ratings · analytics        │
│   Services: Stellar SDK · Geo (Haversine) · Validation       │
│   Database: PostgreSQL 16                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ Stellar SDK / Soroban RPC
┌──────────────────────────▼──────────────────────────────────┐
│                  Stellar Network (Testnet / Mainnet)         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│   │ Job Contract │  │   Escrow     │  │  Reputation      │  │
│   │  (Soroban)   │  │  Contract    │  │  Contract        │  │
│   └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **Job Marketplace** — Farmers post cargo delivery jobs with pickup/dropoff coordinates, cargo description, and XLM price
- **Transporter Matching** — Geo-based nearby job discovery using Haversine distance filtering
- **Escrow Payments** — XLM held in Soroban escrow contract; released only when both buyer and farmer confirm delivery
- **Dispute Resolution** — Admin-mediated dispute flow with on-chain resolution
- **On-chain Reputation** — Immutable rating system; aggregate scores visible per wallet address
- **Real-time Tracking** — Job status lifecycle: Open → Accepted → In Transit → Delivered → Completed
- **Freighter Wallet** — Browser wallet integration for signing Stellar transactions
- **Role-based Access** — Farmer, Transporter, and Buyer roles with appropriate permissions
- **Analytics Dashboard** — Platform-wide delivery stats and revenue metrics
- **Admin Panel** — Dispute management and platform oversight
- **Rate Limiting & Helmet** — Production-grade API security

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| State Management | Zustand with persistence |
| Maps | Leaflet / React-Leaflet |
| Charts | Recharts |
| Backend | Node.js 20, Express.js, TypeScript |
| Database | PostgreSQL 16 |
| Blockchain | Stellar Network, Soroban smart contracts |
| Wallet | Stellar Freighter browser extension |
| Smart Contracts | Rust, soroban-sdk 20 |
| Testing | Jest, ts-jest, Supertest, Soroban test env |
| Containerisation | Docker, Docker Compose |

## Smart Contracts

### Job Contract (`contracts/job`)

Manages the full lifecycle of a delivery job on-chain.

| Function | Description |
|---|---|
| `create_job(farmer, buyer, coords, cargo, price)` | Creates a new open job, returns job ID |
| `accept_job(job_id, transporter)` | Transporter claims an open job |
| `start_transit(job_id, transporter)` | Marks job as in-transit |
| `complete_delivery(job_id, transporter)` | Marks job as delivered |
| `cancel_job(job_id, caller)` | Farmer or buyer cancels an open/accepted job |
| `get_job(job_id)` | Returns full job state |
| `get_jobs_by_farmer(farmer)` | Returns list of job IDs for a farmer |

### Escrow Contract (`contracts/escrow`)

Holds XLM in escrow and releases funds based on delivery confirmation.

| Function | Description |
|---|---|
| `initialize(job_id, buyer, farmer, transporter, amount, admin)` | Sets up escrow for a job |
| `deposit(job_id, from)` | Buyer deposits XLM into escrow |
| `confirm_delivery(job_id, confirmer)` | Buyer or farmer confirms; auto-releases when both confirm |
| `release(job_id)` | Releases funds to transporter (called internally) |
| `dispute(job_id, caller)` | Any party raises a dispute |
| `resolve_dispute(job_id, admin, release_to_transporter)` | Admin resolves dispute |
| `get_escrow(job_id)` | Returns escrow state |

### Reputation Contract (`contracts/reputation`)

Stores immutable on-chain ratings per wallet address.

## Getting Started

### Prerequisites

- Node.js 20+
- Rust + `wasm32-unknown-unknown` target
- Soroban CLI: `cargo install --locked soroban-cli`
- PostgreSQL 16 (or Docker)
- [Freighter wallet](https://www.freighter.app/) browser extension

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/CargoSoroban.git
   cd CargoSoroban
   ```

2. **Install backend dependencies**
   ```bash
   cd backend && npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend && npm install
   ```

4. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values (see Environment Variables section)
   ```

5. **Run database migrations**
   ```bash
   cd backend && npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 — backend
   cd backend && npm run dev

   # Terminal 2 — frontend
   cd frontend && npm run dev
   ```

   Backend: http://localhost:4000  
   Frontend: http://localhost:3000

## Smart Contract Deployment

1. **Set up a testnet account**
   ```bash
   bash scripts/setup-testnet.sh
   ```
   Copy the printed keys into `backend/.env`.

2. **Deploy contracts to testnet**
   ```bash
   bash scripts/deploy-contracts.sh
   ```
   Contract IDs are saved to `.env.contracts`. Copy them into `backend/.env`.

3. **Add Rust wasm target** (first time only)
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

## API Reference

All endpoints return `{ success: boolean, data?: any, error?: string }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Health check |
| GET | `/api/jobs` | — | List jobs (filter by `status`, `lat`, `lng`, `radius_km`) |
| POST | `/api/jobs` | ✓ | Create a job |
| GET | `/api/jobs/nearby` | — | Jobs near coordinates |
| GET | `/api/jobs/:id` | — | Get job by ID |
| PUT | `/api/jobs/:id/accept` | ✓ | Accept a job as transporter |
| PUT | `/api/jobs/:id/status` | ✓ | Update job status |
| GET | `/api/users/:address` | — | Get user profile |
| POST | `/api/users` | ✓ | Create/update user profile |
| GET | `/api/ratings/:address` | — | Get ratings for address |
| GET | `/api/ratings/:address/score` | — | Get aggregate score |
| POST | `/api/ratings` | ✓ | Submit a rating |
| GET | `/api/escrow/:job_id` | — | Get escrow state |
| POST | `/api/escrow/initialize` | ✓ | Initialize escrow |
| GET | `/api/analytics/summary` | — | Platform statistics |
| GET | `/api/admin/disputes` | ✓ | List disputed jobs |

Auth: requests must include `x-wallet-address` header with a valid Stellar public key.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/stellarhaul` |
| `PORT` | Server port | `4000` |
| `STELLAR_NETWORK` | Network name | `TESTNET` |
| `STELLAR_HORIZON_URL` | Horizon API URL | `https://horizon-testnet.stellar.org` |
| `STELLAR_SECRET_KEY` | Signing key for server-side transactions | `S...` |
| `STELLAR_PUBLIC_KEY` | Corresponding public key | `G...` |
| `JOB_CONTRACT_ID` | Deployed job contract ID | `C...` |
| `ESCROW_CONTRACT_ID` | Deployed escrow contract ID | `C...` |
| `REPUTATION_CONTRACT_ID` | Deployed reputation contract ID | `C...` |

### Frontend (`.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network | `TESTNET` |

## Testing

### Backend tests

```bash
cd backend
npm test
```

Runs Jest tests for:
- `jobs.test.ts` — CRUD and accept job routes
- `ratings.test.ts` — Rating submission and retrieval
- `geo.test.ts` — Haversine distance and ETA calculation

### Frontend tests

```bash
cd frontend
npm test
```

Runs Jest/jsdom tests for:
- `wallet.test.ts` — Freighter wallet integration

### Smart contract tests

```bash
cd contracts
cargo test
```

Runs Soroban native unit tests for escrow and job contracts.

## Docker

Run the full stack with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Services:
- **postgres** — PostgreSQL 16 on port 5432
- **backend** — Express API on port 4000
- **frontend** — Next.js on port 3000

## Security

- **Helmet.js** — Sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS** — Configurable origin allowlist
- **Rate Limiting** — 100 requests per 15 minutes per IP
- **Input Validation** — Joi schema validation on all POST/PUT endpoints
- **Auth Middleware** — Wallet address verification on protected routes
- **Soroban `require_auth()`** — All contract mutations require caller authentication
- **Escrow Safety** — Funds only released when both parties confirm or admin resolves
- **Parameterised Queries** — All database queries use `$1` placeholders to prevent SQL injection

## License

MIT © 2026 StellarHaul Contributors
