# Qik Url API

Qik Url is a lightweight, high-performance **Open API** for shortening long links into shareable short URLs. It supports **expiry times, analytics, one-time-use links, caching for speed, and secure deletion via tokens**.

---

## 🚀 Key Features

- 🔗 **URL Shortening** – Generate short, easy-to-share links from long URLs.
- ⏳ **Expiry Management** – Set a custom expiry (up to **1 year**).
- ⚡ **Caching** – Redis for ultra-fast redirects and reduced database load.
- 📊 **Analytics** – Track click counts for each short URL.
- 🔒 **One-Time Links** – Option to make a link valid for a single click only.
- 🗑️ **Secure Deletion** – Each link is assigned a **deletion token** for safe removal without user accounts.

---

## 🛠️ Tech Stack

- **Language:** JavaScript
- **Framework:** Node.js + Express
- **Database:** Firebase Firestore (permanent storage)
- **Cache:** Redis (fast lookups & rate limiting)
  œ

---

## 📡 API Endpoints

> Ultra‑fast, cache‑first URL shortening API with ephemeral storage optimization, analytics, one‑time links, secure deletion tokens, and serverless-ready architecture.

Qik Url focuses on **low latency**, **cost efficiency**, and **operational simplicity** by aggressively using Redis for primary hot-path reads while relegating only longer-lived links to Firestore. This hybrid persistence strategy minimizes write amplification and improves cold-start performance in serverless environments.

---

## 🚀 Key Features

| Category      | Feature           | Notes                                                                |
| ------------- | ----------------- | -------------------------------------------------------------------- |
| Core          | URL Shortening    | Deterministic short code derived from deletion token (UUID based)    |
| Lifecycle     | Expiry (≤ 1 year) | Auto-normalized; defaults to max (1 year) if invalid/omitted         |
| Performance   | Redis Edge Cache  | Primary store for links expiring ≤ 24h (Firestore skipped)           |
| Performance   | Lazy Re-cache     | Long-lived links cached for 24h then re-cached on access             |
| Analytics     | Click Count       | Incremented atomically (best‑effort; tolerant of transient failures) |
| Security      | One-Time Links    | Auto-invalidated & purged after first successful redirect            |
| Security      | Deletion Tokens   | Cryptographically strong UUID v4; short code is a projection         |
| Safety        | Input Validation  | Strict URL + expiry + type validation with granular error codes      |
| Reliability   | Health Endpoint   | Composite check (Firestore + Redis) with degraded state signaling    |
| Abuse Control | Rate Limiting     | 100 create requests / 60s / IP via Redis counters                    |
| Ops           | Graceful Shutdown | Closes HTTP & Redis; safe for container / serverless                 |
| Deployment    | Serverless Ready  | Service init gating per-request for cold starts (Vercel)             |
| Observability | Structured Errors | Consistent JSON error payload + mapped status codes                  |

---

## 🧱 Architecture Overview

High-level flow (Create → Redirect → Delete):

1. Client POSTs `/create` with URL + optional settings.
2. Validation layer enforces format & policy (≤1 year, valid scheme, etc.).
3. Controller derives a `deletion_code` (UUID) and creates `qik_code` (even-index chars → 12 char max) to reduce storage footprint & leak resistance.
4. Persistence strategy:
   - If expiry ≤ 24h → store **only in Redis** (ephemeral optimization).
   - If expiry > 24h → write to Firestore + cache in Redis (TTL ≤ 24h initially).
5. Redirect (`/:qik_code`) checks Redis first; if miss and Firestore doc exists, rehydrates + re-caches with remaining TTL.
6. One-time links are deleted from both stores after first successful redirect.
7. Delete (`/delete/:deletion_code`) authenticates via reversible short-code transform & removes both cache + primary store.

Key design principles:

- **Write Minimization:** Short-lived links never touch Firestore → lower cost & latency.
- **Deterministic Reverse Mapping:** `qik_code` can be recomputed from `deletion_code` without storing a secondary index.
- **Graceful Degradation:** Rate limiter failures fall back silently; redirect still functions if Firestore update fails (response priority is redirect latency).
- **Serverless Compatibility:** Lazy service initialization avoids cold-start penalties on platform boot.

---

## 🗂️ File / Module Structure

```
src/
├── config/
│   ├── env.js              # Env loading + required var enforcement
│   ├── firebase.js         # Firestore initialization + health doc write
│   └── redis.js            # Redis client lifecycle + reconnection logic
├── middlewares/
│   ├── validation.js       # Input validation & token format guards
│   └── errorHandler.js     # Central error & 404 + rate limiter
├── controller.js           # Core business logic (create, redirect, delete, health)
├── routes.js               # Express route bindings
├── utils.js                # Helpers: expiry normalization, errors, token math
└── server.js               # App bootstrap, init orchestration, graceful shutdown
api/index.js                # Vercel entrypoint exporting Express app
docker-compose.yml          # Dev Redis + Firestore emulator
test/                       # Jest + Supertest integration style tests
```

---

## �️ Tech Stack

| Layer      | Choice              | Reason                                                    |
| ---------- | ------------------- | --------------------------------------------------------- |
| Runtime    | Node.js (ESM)       | Modern module semantics; broad ecosystem                  |
| Framework  | Express 5           | Minimal, stable, flexible middleware model                |
| Cache      | Redis               | Ultra-fast lookups, TTL support, counters (rate limiting) |
| Database   | Firestore           | Managed, scalable, document store for long-lived links    |
| Security   | Helmet              | Sensible HTTP security headers                            |
| Test       | Jest + Supertest    | Fast HTTP contract verification                           |
| Deployment | Vercel / Containers | Serverless + traditional parity                           |

### NPM Packages (Runtime)

| Package        | Purpose                                    |
| -------------- | ------------------------------------------ |
| express        | HTTP routing & middleware                  |
| firebase-admin | Firestore access & server-side credentials |
| redis          | Redis client with async API                |
| helmet         | Security headers                           |
| dotenv         | Local env var management                   |

### Dev / Test

| Package   | Purpose                                     |
| --------- | ------------------------------------------- |
| jest      | Test runner                                 |
| supertest | HTTP request simulation against Express app |

---

## 🔐 Token & Code Strategy

1. `deletion_code`: 32 hex chars (UUID v4 without dashes) → high entropy.
2. `qik_code`: Derived by taking even-index characters of `deletion_code`, then truncating to 12 chars. Effective length typically 12 (alphanumeric hex). Collision probabilities remain extremely low; Firestore write path could be extended with pre-existence checks if scaling demands.
3. Reverse derivation: Given `deletion_code`, `qik_code` is deterministic; system never stores a separate mapping document.

---

## 🧮 Caching & Persistence Strategy

| Scenario                   | Firestore             | Redis                        | Rationale                                             |
| -------------------------- | --------------------- | ---------------------------- | ----------------------------------------------------- |
| Expiry ≤ 24h               | ❌ (skipped)          | ✅ (TTL = expiry)            | Avoid unnecessary durable writes for short-lived data |
| Expiry > 24h (on create)   | ✅                    | ✅ (TTL = 24h)               | Reduce repeated Firestore reads; keep cache hot       |
| Redirect (long-lived miss) | Already present       | Re-cached with remaining TTL | Maintains cache freshness without full-day TTL resets |
| One-time access            | Deleted post-redirect | Deleted post-redirect        | Ensures immediate invalidation                        |

Failure tolerance: If Redis is down, Firestore still serves long-lived links; short-lived links (<24h) become unavailable (acceptable trade-off). Rate limiting silently degrades if Redis errors (availability > enforcement).

---

## 🛡️ Validation & Error Handling

| Concern       | Guard                                                               |
| ------------- | ------------------------------------------------------------------- |
| URL format    | WHATWG URL parse + http/https scheme enforcement                    |
| Expiry        | Must be future date ≤ 1 year from now                               |
| single_use    | Must be boolean if provided                                         |
| qik_code      | Length 6–12, alphanumeric only (invalid → 404 to avoid enumeration) |
| deletion_code | Minimum length 20, else 401                                         |

Central error middleware normalizes outbound JSON: `{ "error": "..." }` with mapped status codes (400/401/404/410/429/500). Unexpected errors are logged (server-side only) and surfaced as 500.

---

## 🌐 API Endpoints (Detailed)

### Create Short URL

`POST /create`

Request Body:

```
{
  "long_url": "https://example.com",
  "expires_at": "2025-12-31T23:59:59.999Z",   // optional (ISO); normalized if invalid
  "single_use": false                            // optional
}
```

Response (201):

```
{
  "qik_code": "abc123",
  "long_url": "https://example.com",
  "expires_at": "2025-12-31T23:59:59.999Z",
  "deletion_code": "<secure-token>",
  "click_count": 0,
  "single_use": false,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

Errors: 400 (validation), 429 (rate limit), 500.

### Redirect

`GET /:qik_code`

Behavior: 302 redirect to `long_url`. Increments `click_count` (best effort). One-time links produce 410 after first use. Expired or invalid codes → 404.

### Delete

`DELETE /delete/:deletion_code`

Behavior: Validates deletion token → removes Redis key + Firestore doc (if present). Returns 200 with confirmation. Invalid token → 401.

### Health

`GET /health`

Returns composite status. If either dependency is down → HTTP 503 + `{ status: "degraded" }`.

### Error Payload Schema

```
{ "error": "<message>" }
```

---

## ❌ Standard Error Matrix

| Status | Meaning                                       | Example                                                         |
| ------ | --------------------------------------------- | --------------------------------------------------------------- |
| 400    | Bad Request / validation failure              | `{ "error": "Invalid request. Please provide a valid URL." }`   |
| 401    | Deletion token invalid                        | `{ "error": "Unauthorized. Invalid deletion token." }`          |
| 404    | Not found / expired / obfuscated invalid code | `{ "error": "Short URL not found or expired." }`                |
| 410    | One-time link already used                    | `{ "error": "This link has already been used." }`               |
| 429    | Rate limit exceeded                           | `{ "error": "Rate limit exceeded. Try again later." }`          |
| 500    | Internal error                                | `{ "error": "Internal server error. Please try again later." }` |

---

## ⚙️ Environment Variables

| Variable                            | Required           | Description                                                    |
| ----------------------------------- | ------------------ | -------------------------------------------------------------- |
| PORT                                | Local only         | HTTP port (ignored in Vercel)                                  |
| REDIS_HOST                          | Yes                | Redis connection URL (e.g. `redis://:password@localhost:6379`) |
| REDIS_PASSWORD                      | Optional           | Redis auth (if separate from URL)                              |
| REDIS_USERNAME                      | Optional           | ACL user (if enabled)                                          |
| FIREBASE_PROJECT_ID                 | Yes                | Firebase project / emulator project id                         |
| FIRESTORE_EMULATOR_HOST             | Dev optional       | Enables emulator mode (`host:port`)                            |
| GOOGLE_APPLICATION_CREDENTIALS_JSON | Prod (serverless)  | Inlined service account JSON for Firebase Admin                |
| FIREBASE_SERVICE_ACCOUNT_KEY_PATH   | Prod alternative   | Path to service account key file                               |
| VERCEL                              | Auto in deployment | Signals serverless mode (init strategy changes)                |

Loading logic: `.env` (development) or `.env.production` (production non-serverless). Missing required variables trigger startup failure.

---

## 🧪 Testing

Lightweight integration tests (Jest + Supertest) exercise creation, redirection (tolerant to transient Firestore update issues), deletion, one-time semantics, and health. Run:

```
npm install
docker compose up -d   # start Redis + Firestore emulator
npm test
```

---

## 🗜️ Rate Limiting

Simple fixed-window counter:

- Key: `rl:<ip>`
- Window: 60 seconds
- Limit: 100 create requests
- Failure mode: Redis error ⇒ limiter skipped (fails open) to preserve availability.

Can be extended to sliding window or token bucket without architectural change.

---

## 📊 API Compliance Matrix

### 1. Create Short URL

**Endpoint:** `POST /create`

**Request Body:**

```json
{
  "long_url": "https://example.com",
  "expires_at": "2025-12-31T23:59:59.999Z",
  "single_use": false
}
| Ephemeral Optimization (≤24h) | ✅ | ✅ | ✅ Complete |
| Serverless Init Safety | ✅ | ✅ | ✅ Complete |
| Graceful Shutdown | ✅ | ✅ | ✅ Complete |
| Security Headers (Helmet) | ✅ | ✅ | ✅ Complete |
| Input Validation Hardening | ✅ | ✅ | ✅ Complete |

---

## 🧭 Operational & Scaling Notes

| Aspect | Current Approach | Next Step (Optional) |
|--------|------------------|----------------------|
| Collision Handling | Rely on UUID entropy | Add existence check + retry loop |
| Analytics | Simple counter | Add per-day buckets or event stream |
| Rate Limiting | Fixed window | Sliding window / user-tier limits |
| Observability | Console logs | Structured JSON + tracing (OTel) |
| Security | Token-based deletion | Optional HMAC signing / abuse monitoring |
| Cache Invalidation | TTL + delete | Pub/Sub for multi-region cache purge |

---

## 🛠️ Local Development Quickstart

1. Clone & install: `npm install`
2. Start services: `docker compose up -d`
3. Create `.env`:
```

PORT=3000
REDIS_HOST=redis://:1234@localhost:6379
FIREBASE_PROJECT_ID=qik-url-firestore-emulator
FIRESTORE_EMULATOR_HOST=localhost:8200

```
4. Run dev server: `npm run dev`
5. Test: `npm test`

---

## 🔒 Security Considerations

* No user authentication: deletion secured via high-entropy token (keep confidential).
* Short code enumeration hardened: invalid formats return 404, not 400.
* Helmet sets baseline headers (XSS, MIME sniffing mitigation, etc.).
* Rate limiter reduces automated abuse (extend with CAPTCHA / IP reputation if public at scale).

---

## 📦 Deployment

### Vercel
* `api/index.js` exports the Express app (no `listen`).
* Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret & Redis URL env.

### Container / VM
* Use `npm start` (production) after providing `.env.production`.
* Graceful SIGTERM/SIGINT shutdown ensures clean Redis disconnect.

---

## 🧩 Future Enhancements (Backlog Ideas)
* Custom aliases (vanity codes) with collision checks.
* Bulk API (batch shorten) with idempotency keys.
* Per-link analytics breakdown (UA, geo) via edge logging pipeline.
* Signed temporary preview endpoint (e.g., HEAD metadata).
* Admin dashboard + revoke UI.
* Multi-region Redis + eventual consistency fallback.

---

## ✅ Summary

Qik Url delivers a **lean, cache-first URL shortener** with strong fundamentals (validation, security headers, rate limiting, deterministic reversible mapping) while remaining easily extensible for advanced analytics or enterprise features. The design intentionally optimizes the common path (fast redirect) and reduces operational cost by skipping durable writes for short-lived links.

---

MIT License
```

**Response:**

```json
{
  "qik_code": "abc123",
  "long_url": "https://example.com",
  "expires_at": "2025-12-31T23:59:59.999Z",
  "deletion_code": "xyzSecretToken",
  "click_count": 0,
  "single_use": false
}
```

---

### 2. Redirect to Original URL

**Endpoint:** `GET /:qik_code`

**Behavior:**

- Redirects to the original `long_url`.
- Increments the `click_count`.
- If `single_use: true`, the link is deleted/invalidated after first use.

---

### 3. Delete a Short URL

**Endpoint:** `DELETE /delete/:deletion_code`

**Response:**

```json
{
  "message": "Short URL deleted successfully."
}
```

### 4. Health Check

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

**Behavior:**

- Returns server health status and service connectivity.
- Useful for monitoring and load balancer health checks.

---

## ❌ Error Responses

| Status Code                   | Meaning                                              | Example Response                                                |
| ----------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| **400** Bad Request           | Invalid or missing parameters (e.g., malformed URL). | `{ "error": "Invalid request. Please provide a valid URL." }`   |
| **401** Unauthorized          | Missing/invalid `deletion_code` for deletion.        | `{ "error": "Unauthorized. Invalid deletion token." }`          |
| **404** Not Found             | Short URL does not exist or has expired.             | `{ "error": "Short URL not found or expired." }`                |
| **410** Gone                  | One-time-use link already used.                      | `{ "error": "This link has already been used." }`               |
| **429** Too Many Requests     | Rate limit exceeded.                                 | `{ "error": "Rate limit exceeded. Try again later." }`          |
| **500** Internal Server Error | Unexpected server issue (DB/Redis failure).          | `{ "error": "Internal server error. Please try again later." }` |

---

**File Structure:**

```
src/
├── middlewares/
│   ├── validation.js
│   └── errorHandler.js
├── config/
│   ├── firebase.js
│   └── redis.js
├── utils.js
├── controller.js
├── routes.js
└── server.js
```

**Objective:** MVC architecture, code organization, separation of concerns

## 📊 API Compliance Matrix

| Feature                        | README Spec | Implementation | Status      |
| ------------------------------ | ----------- | -------------- | ----------- |
| URL Shortening                 | ✅          | ✅             | ✅ Complete |
| Expiry Management (1 year max) | ✅          | ✅             | ✅ Complete |
| Redis Caching                  | ✅          | ✅             | ✅ Complete |
| Analytics (click count)        | ✅          | ✅             | ✅ Complete |
| One-time Links                 | ✅          | ✅             | ✅ Complete |
| Secure Deletion                | ✅          | ✅             | ✅ Complete |
| Redirect Functionality         | ✅          | ✅             | ✅ Complete |
| Error Codes (400-500)          | ✅          | ✅             | ✅ Complete |
| Health Check                   | ✅          | ✅             | ✅ Complete |
| Rate Limiting                  | ✅          | ✅             | ✅ Complete |
