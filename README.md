# Dr Mom 2.0 — Backend API

Production-ready Node.js/Express API for the **Dr Mom 2.0** online course platform. Handles authentication, course access control, Razorpay payments, Bunny CDN video delivery, and full admin management.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Database | PostgreSQL 16 via Prisma ORM |
| Auth | JWT — `accessToken` (15 min) + `refreshToken` (30 days) as httpOnly cookies |
| Passwords | bcrypt (cost 12) |
| Payments | Razorpay (order creation + HMAC verification + webhook) |
| Video | Bunny Stream (signed embed URLs + TUS direct upload credentials) |
| Validation | Zod schemas on every route |
| Rate limiting | express-rate-limit (auth, payment, contact, admin actions) |
| Security | Helmet, CORS, cookie-parser |
| Deployment | Docker + docker-compose |

---

## API Routes

Base path: `/api`

### Public

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/catalog` | Full course catalog (classes, subjects, courses, plans) |
| `POST` | `/contact` | Contact form submission |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register new user |
| `POST` | `/auth/login` | — | Login, sets httpOnly cookies |
| `POST` | `/auth/logout` | Required | Revoke refresh token, clear cookies |
| `POST` | `/auth/refresh` | Cookie | Rotate access + refresh tokens |
| `GET` | `/auth/me` | Required | Current user info |

### User

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/me` | Profile |
| `GET` | `/users/me/enrollments` | Enrolled courses |
| `GET` | `/users/me/orders` | Purchase history |
| `POST` | `/users/me/progress` | Track video progress (purchase required for locked lessons) |

### Courses

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/courses` | Optional | List all published courses |
| `GET` | `/courses/:slug` | Optional | Course detail + lessons (locked lessons hide Bunny IDs) |
| `GET` | `/courses/lessons/:id/access` | Optional | Check if user has access to a lesson |
| `GET` | `/courses/lessons/:id/playback` | Required | Get signed Bunny embed URL (enforces purchase) |

### Payments

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/orders` | Required | Create Razorpay order |
| `POST` | `/payments/verify` | Required | Verify HMAC signature + grant course access |
| `POST` | `/payments/webhook` | — (signature) | Razorpay webhook (payment.captured / payment.failed) |

### Admin (all require ADMIN role)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/dashboard` | Stats overview |
| `GET` | `/admin/catalog` | Full catalog for admin UI |
| `GET/POST` | `/admin/classes` | Class management |
| `PUT/DELETE` | `/admin/classes/:classId` | Update / delete class |
| `GET/POST` | `/admin/subjects` | Subject management |
| `PUT/DELETE` | `/admin/subjects/:subjectId` | Update / delete subject |
| `GET/POST` | `/admin/chapters` | Chapter management |
| `PUT/DELETE` | `/admin/chapters/:chapterId` | Update / delete chapter |
| `GET/POST` | `/admin/courses` | Course management |
| `PUT/DELETE` | `/admin/courses/:courseId` | Update / delete course |
| `PATCH` | `/admin/courses/:courseId/publish` | Publish / unpublish course |
| `PATCH` | `/admin/courses/:courseId/price` | Set course price |
| `POST` | `/admin/courses/:courseId/lessons` | Create lesson |
| `PUT/DELETE` | `/admin/courses/:courseId/lessons/:lessonId` | Update / delete lesson |
| `PATCH` | `/admin/lessons/:lessonId/price` | Set lesson price |
| `GET/POST` | `/admin/users` | User management |
| `PUT/DELETE` | `/admin/users/:userId` | Update / delete user |
| `GET` | `/admin/orders` | All orders |
| `GET/POST` | `/admin/enrollments` | List / grant enrollment |
| `DELETE` | `/admin/enrollments/:enrollmentId` | Revoke enrollment |
| `POST` | `/admin/bunny/videos/init` | Create Bunny video entry + return TUS credentials |
| `GET` | `/admin/bunny/videos/:guid/status` | Poll Bunny encoding status |

---

## Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or use Docker Compose)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL=postgresql://drmom:<password>@localhost:5432/drmombackend
POSTGRES_PASSWORD=<strong-random-password>

# API URLs
FRONTEND_URL=https://yourdomain.com
ADMIN_FRONTEND_URL=https://admin.yourdomain.com
CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com

# JWT — generate strong random secrets (64+ chars each)
JWT_ACCESS_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30

# Cookies
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true          # set false for local HTTP dev only

# Admin seed account — change password immediately after first login
DEFAULT_ADMIN_NAME=Admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=<strong-unique-password>

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Bunny CDN
BUNNY_STREAM_LIBRARY_ID=<your-library-id>
BUNNY_STREAM_CDN_HOST=iframe.mediadelivery.net
BUNNY_STREAM_PULL_ZONE=<your-pull-zone>
BUNNY_TOKEN_AUTH_KEY=<token-auth-key>
BUNNY_API_KEY=<api-key>

# Course access duration (0 = perpetual, >0 = days until expiry)
COURSE_ACCESS_DAYS=0
```

### 3. Database setup

**With Docker Compose (recommended):**
```bash
docker compose up -d db
```

**Or** connect to an existing PostgreSQL instance and update `DATABASE_URL`.

### 4. Apply migrations and seed

```bash
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
```

Seeding creates the admin user (from `.env` values) and 2 starter courses with sample lessons.

**Change the admin password immediately after first login.**

### 5. Start

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

### 6. Docker Compose (full stack)

```bash
docker compose up -d
```

Starts backend + PostgreSQL. Backend available on port `28100`.

---

## Database Schema

| Table | Purpose |
|---|---|
| `User` | Students, parents, and admins |
| `RefreshToken` | Hashed refresh tokens (rotated on each use) |
| `Course` | Course catalogue |
| `Lesson` | Lessons within a course (stores Bunny video ID + embed URL) |
| `Order` | Razorpay orders (`CREATED` → `PAID` / `FAILED`) |
| `UserCourseAccess` | Purchased/granted course access with optional expiry |
| `VideoProgress` | Per-user lesson watch progress |
| `AuditLog` | Contact form submissions and admin actions |

---

## Authentication Flow

1. Login → `accessToken` (15 min) + `refreshToken` (30 days) set as `httpOnly` cookies
2. Every authenticated request sends `accessToken` cookie automatically
3. On `401`, client calls `POST /auth/refresh` → both tokens rotate
4. Refresh tokens are stored **hashed** (SHA-256) in the DB — compromised tokens can be revoked
5. Deleted/deactivated users are rejected at the DB-lookup step on every request (no stale JWT issue)

---

## Payment Flow

1. `POST /payments/orders` → creates Razorpay order + local `Order` row (status: `CREATED`)
2. Frontend opens Razorpay Checkout with the `razorpayKeyId` from the response
3. `POST /payments/verify` → backend verifies `HMAC-SHA256(keySecret, orderId|paymentId)`
4. On valid signature: order → `PAID`, `UserCourseAccess` row created (inside a DB transaction)
5. `POST /payments/webhook` → `payment.captured` grants access as a safety net; `payment.failed` marks order `FAILED`

Frontend payment success alone **never** grants access.

---

## Bunny CDN Integration

### Signed playback URLs

Tokens: `SHA256(tokenAuthKey + videoId + expires)` — 1-hour window. Set `BUNNY_TOKEN_AUTH_KEY` to enable; omit for unsigned URLs.

### Direct video upload (TUS)

Videos upload browser → Bunny directly (zero VM bandwidth):
1. `POST /admin/bunny/videos/init` → creates Bunny entry, returns 1-hour TUS credentials
2. Browser uploads with `tus-js-client` to `https://video.bunnycdn.com/tusupload`
3. `GET /admin/bunny/videos/:guid/status` → poll until status `4` (Ready)

---

## Database Backup

A clean production-ready database export is at `database/clean-demo-db.sql`.

**Restore:**
```bash
docker exec -i <db-container> psql -U drmom -d drmombackend < database/clean-demo-db.sql
```

**Contents:** 1 admin user · 2 published courses · 3 lessons (1 with Bunny video linked for demo) · no test data.

---

## Security

- Passwords: bcrypt cost 12
- JWT secrets: environment variables only — never hardcoded
- Refresh tokens: stored hashed in DB, rotated on every use
- Admin routes: `ADMIN` role enforced server-side on every request
- Payment verification: HMAC server-side — frontend result is never trusted
- Locked lessons: Bunny video IDs never returned in public API responses
- Rate limiting: auth 10/15 min · payment 15/15 min · contact 5/hr · admin actions 30/hr
- IP spoofing: rate limiter keys on socket IP (not `X-Forwarded-For`)
- Input validation: Zod schema on every route
- Error handling: Prisma internals never exposed in responses
- ORM: Prisma — no raw SQL, no injection surface
- Headers: Helmet

---

## Production Checklist

- [ ] Change admin password from seed default immediately
- [ ] Set `COOKIE_SECURE=true`
- [ ] Configure HTTPS + real domain (Let's Encrypt via Certbot)
- [ ] Set real Razorpay production keys
- [ ] Register Razorpay webhook: `https://api.yourdomain.com/api/payments/webhook` (events: `payment.captured`, `payment.failed`)
- [ ] Update Nginx `server_name` from placeholder to real domain
- [ ] Set `CORS_ORIGIN` to exact frontend + admin panel domains
- [ ] Set `COOKIE_DOMAIN` to root domain
- [ ] Rebuild frontend + admin with `VITE_API_BASE_URL=https://api.yourdomain.com/api`
