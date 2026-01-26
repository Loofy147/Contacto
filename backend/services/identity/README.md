# Identity Service 🚀

## Overview

The **Identity Service** is the cornerstone of the Contacto platform, responsible for user authentication, authorization, and lifecycle management. It is designed for high performance, security, and scalability.

## 🚀 Strategic Optimizations (Applied January 2026)

This service has been optimized by the **Contacto Strategic Identities**:

-   🔧 **Tuber (Data Layer):** Implemented Prisma query performance monitoring. Slow queries (>100ms) are automatically logged for optimization.
-   ⚡ **Bolt (Performance):** Integrated Redis-based caching for high-frequency endpoints like `/users/me`. Expecting 30-50% reduction in database load.
-   🛡️ **Sentinel (Security):** Enhanced JWT verification with token blacklisting, stricter error handling, and security event logging.
-   🔮 **Oracle (Architecture):** Robust event-driven integration via Kafka for `USER_REGISTERED`, `USER_LOGGED_IN`, and `EMAIL_VERIFIED` events.

## Core Responsibilities

-   **Authentication:** Registration, Login (JWT + Refresh Tokens), 2FA (TOTP).
-   **Security:** Password hashing (bcrypt), Token blacklisting (Redis), Rate limiting.
-   **Lifecycle:** Email verification, Password reset, Session management.
-   **Profile:** Core user profile management and caching.

## Tech Stack

-   **Runtime:** Node.js + TypeScript
-   **Framework:** Express.js
-   **ORM:** Prisma (PostgreSQL)
-   **Cache:** Redis
-   **Events:** Kafka
-   **Security:** Helmet, CORS, Express-Rate-Limit, Speakeasy (2FA)

## API Endpoints (v1)

### Auth
- `POST /api/v1/auth/register` - New user registration
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/logout` - Invalidate session & blacklist token
- `POST /api/v1/auth/refresh` - Rotate access/refresh tokens
- `POST /api/v1/auth/forgot-password` - Initiate reset flow
- `POST /api/v1/auth/reset-password` - Complete reset flow
- `POST /api/v1/auth/verify-email` - Confirm email address

### 2FA
- `POST /api/v1/auth/2fa/setup` - Generate TOTP secret
- `POST /api/v1/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/v1/auth/2fa/disable` - Disable 2FA

### Users
- `GET /api/v1/users/me` - Get current user profile (Cached)

## Events Published (Kafka)

- `USER_REGISTERED`: When a new user creates an account.
- `USER_LOGGED_IN`: When a user successfully authenticates.
- `EMAIL_VERIFIED`: When a user confirms their email address.

## Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start in development mode
npm run dev

# Run tests
npm test
```
