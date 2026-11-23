# 🚗 Turago Backend

> **Status**: Foundation — Active Development  
> A clean, scalable backend for the Turago ride-booking platform.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Documentation (Swagger)](#api-documentation)
- [API Conventions](#api-conventions)
- [Module Development Guide](#module-development-guide)
- [Provider Integration Architecture](#provider-integration-architecture)
- [MongoDB & Geospatial](#mongodb--geospatial)
- [Ride State Machine](#ride-state-machine)
- [Adding Real-Time (WebSockets / Redis)](#adding-real-time)
- [Deployment Preparation](#deployment-preparation)
- [Known Pending Decisions](#known-pending-decisions)

---

## Overview

Turago is a ride-booking platform (similar to Uber/Ola) supporting:

- **Customers** — book rides on a mobile app
- **Drivers** — accept and complete rides via a driver app  
- **Admins** — manage the platform via a web dashboard

This repository is the **Node.js backend** — a single deployable API server.

---

## Architecture

### Modular Monolith

The application is a **single deployable Node.js process** (not microservices), internally divided into independent business modules.

```
ONE process
├── Auth module
├── Users module
├── Drivers module
├── Vehicles module
├── Rides module       ← core domain
├── Fares module
├── Payments module
├── Notifications module
└── Admin module
```

**Why modular monolith?**
- Simple to develop, run, and debug locally
- No distributed system complexity
- Modules have clear boundaries — can be extracted to microservices later if needed
- Single MongoDB instance, single codebase, single deploy

### Layer pattern (per module)

```
HTTP Request
    ↓
Route (express Router)
    ↓
Validation Middleware (Joi)
    ↓
Auth Middleware (JWT verify + role check)
    ↓
Controller (HTTP concerns only)
    ↓
Service (business logic)
    ↓
Repository (database queries)
    ↓
Mongoose Model
    ↓
MongoDB
```

### Infrastructure abstraction

External services are behind provider interfaces:

```
Business Service
    ↓
Infrastructure Service (e.g. NotificationService)
    ↓
Provider Interface (e.g. SmsProvider)
    ↓
Concrete Implementation (MockSmsProvider / TwilioProvider)
```

---

## Folder Structure

```
turago-backend/
├── src/
│   ├── server.js                    # Entry point — starts HTTP server
│   ├── app/
│   │   └── app.js                   # Express app factory
│   │
│   ├── config/
│   │   ├── env.js                   # Environment variable loader + validation
│   │   ├── database.js              # MongoDB connection lifecycle
│   │   └── logger.js                # Pino structured logger
│   │
│   ├── common/
│   │   ├── constants/index.js       # All domain constants & enums
│   │   ├── errors/AppError.js       # Custom error class hierarchy
│   │   ├── middleware/
│   │   │   ├── authenticate.js      # JWT verify + role authorize
│   │   │   ├── errorHandler.js      # Global error handler
│   │   │   ├── requestId.js         # UUID request tracing
│   │   │   └── validate.js          # Joi validation middleware factory
│   │   └── utils/
│   │       ├── apiResponse.js       # sendSuccess / sendError helpers
│   │       └── asyncHandler.js      # Promise rejection forwarding
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controller/
│   │   │   ├── model/               # Otp.model.js (TTL indexed)
│   │   │   ├── repository/
│   │   │   ├── routes/
│   │   │   ├── service/             # OTP gen, bcrypt hash, JWT issuance
│   │   │   └── validation/
│   │   │
│   │   ├── users/                   # Customer profile
│   │   ├── drivers/                 # Driver profile + location + availability
│   │   ├── vehicles/                # Vehicle model
│   │   ├── rides/                   # Core ride lifecycle
│   │   │   ├── service/
│   │   │   │   ├── ride.service.js          # Lifecycle orchestration
│   │   │   │   └── driverMatching.service.js
│   │   │   └── utils/
│   │   │       ├── rideStateMachine.js      # State transition validation
│   │   │       └── rideEventPublisher.js    # Event abstraction (future WS/Redis)
│   │   ├── fares/                   # FareConfig model + FareCalculationService
│   │   ├── payments/                # Payment model
│   │   ├── notifications/           # Notification service + model
│   │   └── admin/                   # Admin model
│   │
│   ├── infrastructure/
│   │   ├── sms/                     # SmsProvider + MockSmsProvider
│   │   ├── maps/                    # MapsProvider + MockMapsProvider (Haversine)
│   │   ├── payment/                 # PaymentProvider + MockPaymentProvider
│   │   ├── storage/                 # StorageProvider + LocalStorageProvider
│   │   └── notifications/           # PushNotificationProvider + Mock
│   │
│   └── docs/
│       └── swagger.js               # OpenAPI 3.0 spec config
│
├── tests/
│   ├── health.test.js
│   ├── authValidation.test.js
│   ├── rideStateMachine.test.js
│   └── fareCalculation.test.js
│
├── .env.example
├── .gitignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── jest.config.json
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js 4 |
| Language | JavaScript (ES Modules) |
| Database | MongoDB 7 via Mongoose 8 |
| Validation | Joi |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Logging | Pino + pino-http |
| Security | Helmet + CORS + express-rate-limit |
| API Docs | swagger-jsdoc + swagger-ui-express |
| Testing | Jest + Supertest |
| Code Quality | ESLint + Prettier |
| Containers | Docker + docker-compose |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 7+ (local or Atlas)
- npm 10+

### 1. Clone and install

```bash
git clone <repo>
cd turago-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

**Minimum required for development** (all others have sensible defaults):

```env
MONGODB_URI=mongodb://localhost:27017/turago
JWT_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
```

### 3. Run locally

```bash
npm run dev
```

Server starts at `http://localhost:3000`

---

## Environment Configuration

All configuration is in `src/config/env.js` which reads from environment variables.

**Never put secrets in code** — always use `.env` (not committed).

Key variables:

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3000` | HTTP port |
| `MONGODB_URI` | `mongodb://localhost:27017/turago` | MongoDB connection |
| `JWT_SECRET` | — | **Required** — access token secret |
| `JWT_REFRESH_SECRET` | — | **Required** — refresh token secret |
| `SMS_PROVIDER` | `mock` | `mock` \| `twilio` \| `msg91` |
| `PAYMENT_PROVIDER` | `mock` | `mock` \| `razorpay` |
| `MAP_PROVIDER` | `mock` | `mock` \| `osrm` \| `google` |
| `STORAGE_PROVIDER` | `local` | `local` \| `s3` \| `cloudinary` |
| `LOG_LEVEL` | `info` | `trace` \| `debug` \| `info` \| `warn` \| `error` |

See [`.env.example`](.env.example) for the full list.

---

## Running the Application

### Development (hot reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker (all-in-one)

```bash
docker compose up
```

This starts:
- **API** at `http://localhost:3000`
- **MongoDB** at `localhost:27017`
- **Mongo Express** (DB UI) at `http://localhost:8081` (admin / password)

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Test suites:

| Suite | What it tests |
|---|---|
| `health.test.js` | Health endpoint, 404 handler |
| `authValidation.test.js` | OTP schema, phone format, role enum |
| `rideStateMachine.test.js` | All state transitions, cancellable statuses |
| `fareCalculation.test.js` | Fare formula, minimum fare, waiting charge |

---

## API Documentation

**Swagger UI** is available at:

```
http://localhost:3000/api-docs
```

All route files are auto-scanned for `@swagger` JSDoc comments.

---

## API Conventions

### Base URL

```
/api/v1/
```

### Authentication

```
Authorization: Bearer <access_token>
```

### Success Response

```json
{
  "success": true,
  "message": "Ride created successfully",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Ride not found",
  "code": "NOT_FOUND"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "pickup.latitude", "message": "latitude is required" }
  ]
}
```

### Implemented Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Health check |
| POST | `/api/v1/auth/send-otp` | — | Send OTP |
| POST | `/api/v1/auth/verify-otp` | — | Verify OTP → tokens |
| POST | `/api/v1/auth/refresh` | — | Refresh access token |
| GET | `/api/v1/users/me` | CUSTOMER | Get customer profile |
| PATCH | `/api/v1/users/me` | CUSTOMER | Update customer profile |
| GET | `/api/v1/drivers/me` | DRIVER | Get driver profile |
| PATCH | `/api/v1/drivers/me` | DRIVER | Update driver profile |
| POST | `/api/v1/drivers/location` | DRIVER | Update GPS location |
| POST | `/api/v1/drivers/go-online` | DRIVER | Set status ONLINE |
| POST | `/api/v1/drivers/go-offline` | DRIVER | Set status OFFLINE |
| POST | `/api/v1/rides` | CUSTOMER | Create ride request |
| GET | `/api/v1/rides/:rideId` | All | Get ride details |
| GET | `/api/v1/rides/:rideId/live` | CUSTOMER | Live ride state |
| POST | `/api/v1/rides/:rideId/accept` | DRIVER | Accept ride |
| POST | `/api/v1/rides/:rideId/arrived` | DRIVER | Mark arrived |
| POST | `/api/v1/rides/:rideId/start` | DRIVER | Start ride |
| POST | `/api/v1/rides/:rideId/complete` | DRIVER | Complete ride |
| POST | `/api/v1/rides/:rideId/cancel` | CUSTOMER/DRIVER | Cancel ride |

---

## Module Development Guide

When adding a new module:

1. Create `src/modules/<module-name>/`
2. Add subfolders: `controller/`, `service/`, `repository/`, `model/`, `routes/`, `validation/`
3. Create the Mongoose model (with timestamps + indexes)
4. Create the repository (database-only, no business logic)
5. Create the service (business logic only)
6. Create the controller (HTTP concerns only — call service, return `sendSuccess`)
7. Create the routes (mount middleware: `authenticate` → `authorize` → `validate` → controller)
8. Register routes in `src/app/app.js`

**Rules:**
- Controllers must not contain business logic
- Repositories must not contain business logic
- Services must not import Express `req`/`res`
- Never use `console.log` — always use the Pino logger
- Always use `asyncHandler()` to wrap async controllers

---

## Provider Integration Architecture

External services use the **Provider Pattern**:

```
Business Code  →  Service Interface  →  Concrete Provider
  RideService  →  NotificationService  →  MockPushNotificationProvider
  AuthService  →  getSmsProvider()     →  MockSmsProvider
```

### Adding a Real SMS Provider (e.g. Twilio)

1. Create `src/infrastructure/sms/TwilioSmsProvider.js`
2. Extend `SmsProvider` and implement `sendOtp()` and `sendSms()`
3. In `src/infrastructure/sms/index.js`, add `case 'twilio': _instance = new TwilioSmsProvider(...)`
4. Set `SMS_PROVIDER=twilio` in `.env`
5. Add credentials to `.env`

**No business code changes required.**

The same pattern applies to:
- Maps: `MapsProvider` → `OsmMapsProvider` / `GoogleMapsProvider`
- Payments: `PaymentProvider` → `RazorpayProvider`
- Storage: `StorageProvider` → `S3StorageProvider`
- Push: `PushNotificationProvider` → `FcmProvider`

---

## MongoDB & Geospatial

### Collections

| Collection | Model | Purpose |
|---|---|---|
| `users` | User | Customer profiles |
| `drivers` | Driver | Driver profiles + location |
| `driverDocuments` | DriverDocument | Document upload/review |
| `vehicles` | Vehicle | Vehicle registration |
| `rides` | Ride | Core ride data |
| `otps` | Otp | OTP verification (TTL) |
| `fareConfigs` | FareConfig | Configurable pricing |
| `payments` | Payment | Payment records |
| `notifications` | Notification | Notification audit trail |
| `admins` | Admin | Admin accounts |

### Geospatial Indexes

```js
// Driver current location
driverSchema.index({ location: '2dsphere' });

// Ride pickup and destination
rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ 'destination.location': '2dsphere' });
```

### Nearby Driver Query

Uses MongoDB `$nearSphere` via `DriverRepository.findNearbyAvailable()`:

```js
location: {
  $nearSphere: {
    $geometry: { type: 'Point', coordinates: [lng, lat] },
    $maxDistance: radiusMeters
  }
}
```

---

## Ride State Machine

State transitions are enforced in `src/modules/rides/utils/rideStateMachine.js`.

```
REQUESTED
    ↓
SEARCHING_DRIVER
    ↓
DRIVER_ASSIGNED
    ↓
DRIVER_ARRIVING
    ↓
DRIVER_ARRIVED
    ↓
RIDE_STARTED
    ↓
RIDE_COMPLETED

Cancellable from: REQUESTED, SEARCHING_DRIVER, DRIVER_ASSIGNED, DRIVER_ARRIVING, DRIVER_ARRIVED
```

Arbitrary status patching is **not allowed**. Use controlled operations:
- `POST /rides/:id/accept` → DRIVER_ARRIVING
- `POST /rides/:id/arrived` → DRIVER_ARRIVED  
- `POST /rides/:id/start` → RIDE_STARTED
- `POST /rides/:id/complete` → RIDE_COMPLETED
- `POST /rides/:id/cancel` → CANCELLED

---

## Adding Real-Time

Currently: **REST + polling** (MVP).

The `RideEventPublisher` in `src/modules/rides/utils/rideEventPublisher.js` is the abstraction point.

### Adding Socket.IO

1. Install: `npm install socket.io`
2. Initialize Socket.IO in `src/server.js` on the HTTP server
3. In `rideEventPublisher.js`, replace the no-op with:
   ```js
   io.to(`ride:${event.rideId}`).emit(event.type, event.payload);
   ```
4. No changes required in `ride.service.js`

### Adding Redis Pub/Sub

1. Install: `npm install ioredis`
2. Create `src/infrastructure/redis/redisClient.js`
3. In `rideEventPublisher.js`, add Redis publish alongside (or instead of) Socket.IO
4. No changes required in business services

---

## Deployment Preparation

### Docker

```bash
docker build -t turago-backend .
docker run -p 3000:3000 --env-file .env turago-backend
```

### Environment checklist for production

- [ ] Set `NODE_ENV=production`
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (32+ random chars)
- [ ] Set `MONGODB_URI` to production cluster
- [ ] Set `SMS_PROVIDER` to a real provider
- [ ] Set `PAYMENT_PROVIDER` to a real gateway
- [ ] Set `STORAGE_PROVIDER` to `s3` or `cloudinary`
- [ ] Set `PUSH_NOTIFICATION_PROVIDER` to `fcm`
- [ ] Set `MAP_PROVIDER` to `osrm` or `google`
- [ ] Restrict `CORS_ORIGINS` to production domains
- [ ] Set `LOG_LEVEL=info` (not `debug`)
- [ ] Enable MongoDB authentication
- [ ] Set up MongoDB Atlas or self-hosted replica set (required for transactions)

> **Note**: MongoDB transactions (used in ride assignment and completion) require a replica set. Standalone MongoDB does not support transactions.

---

## Known Pending Decisions

These require confirmation from the business/client team:

1. **Driver matching algorithm** — final ranking criteria (rating, acceptance rate, priority tier)
2. **Search radius** — configurable per city/zone or global?
3. **Driver accept timeout** — what happens when no driver accepts within N seconds?
4. **Fare formula** — confirmed formula for surge, waiting charge, tax structure
5. **Cancellation policy** — cancellation fees, time-based rules
6. **Payment flow** — prepaid vs postpaid, cash acceptance
7. **Document verification** — manual admin review or automated (e.g. OCR)?
8. **Admin roles** — final permission matrix for SUPER_ADMIN / ADMIN / SUPPORT
9. **Notification triggers** — which events trigger push vs SMS vs both?
10. **Phone number format** — country code requirements, validation regex for target market
11. **Rating system** — mutual rating? Rating window? Minimum rides before showing rating?
12. **Real-time tracking** — polling interval acceptable for MVP or WebSocket needed from day 1?

---

## Commands Reference

```bash
npm run dev           # Start with hot reload
npm start             # Start production
npm test              # Run tests
npm run test:coverage # Run tests with coverage
npm run lint          # Check ESLint
npm run lint:fix      # Auto-fix ESLint errors
npm run format        # Prettier format
npm run format:check  # Check Prettier

docker compose up     # Start full stack locally
docker compose down   # Stop
docker compose down -v # Stop and remove volumes
```
