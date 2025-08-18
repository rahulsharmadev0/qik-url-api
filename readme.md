# Qik Url API

Qik Url is a lightweight, high-performance **Open API** for shortening long links into shareable short URLs. It supports **expiry times, analytics, one-time-use links, caching for speed, and secure deletion via tokens**.

---

## 🚀 Key Features

* 🔗 **URL Shortening** – Generate short, easy-to-share links from long URLs.
* ⏳ **Expiry Management** – Set a custom expiry (up to **1 year**).
* ⚡ **Caching** – Redis for ultra-fast redirects and reduced database load.
* 📊 **Analytics** – Track click counts for each short URL.
* 🔒 **One-Time Links** – Option to make a link valid for a single click only.
* 🗑️ **Secure Deletion** – Each link is assigned a **deletion token** for safe removal without user accounts.

---

## 🛠️ Tech Stack

* **Language:** JavaScript
* **Framework:** Node.js + Express
* **Database:** Firebase Firestore (permanent storage)
* **Cache:** Redis (fast lookups & rate limiting)
œ
---

## 📡 API Endpoints

### 1. Create Short URL

**Endpoint:** `POST /create`

**Request Body:**

```json
{
  "long_url": "https://example.com",
  "expires_at": "2025-12-31T23:59:59.999Z",
  "single_use": false
}
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

* Redirects to the original `long_url`.
* Increments the `click_count`.
* If `single_use: true`, the link is deleted/invalidated after first use.

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

* Returns server health status and service connectivity.
* Useful for monitoring and load balancer health checks.


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

| Feature | README Spec | Implementation | Status |
|---------|-------------|----------------|---------|
| URL Shortening | ✅ | ✅ | ✅ Complete |
| Expiry Management (1 year max) | ✅ | ✅ | ✅ Complete |
| Redis Caching | ✅ | ✅ | ✅ Complete |
| Analytics (click count) | ✅ | ✅ | ✅ Complete |
| One-time Links | ✅ | ✅ | ✅ Complete |
| Secure Deletion | ✅ | ✅ | ✅ Complete |
| Redirect Functionality | ✅ | ✅ | ✅ Complete |
| Error Codes (400-500) | ✅ | ✅ | ✅ Complete |
| Health Check | ✅ | ✅ | ✅ Complete |
| Rate Limiting | ✅ | ✅ | ✅ Complete |
