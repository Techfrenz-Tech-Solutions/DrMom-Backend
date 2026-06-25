# drmombackend

Backend scaffold for the Dr Mom online course platform.

## Frontend review summary

The current frontend and admin panel are both Vite + React applications using `react-router-dom`.

Website repo findings:
- Framework: Vite + React 18
- Routing: `BrowserRouter` in `src/App.jsx`
- Current pages: `/`, `/about`, `/classes`, `/classes/:classId`, `/contact`, `/login`, `/payment`
- Auth: mock `localStorage` user in `src/utils/auth.js`
- API integration: none yet; pages still use local dummy data and `setTimeout` placeholders
- Data source: hardcoded `CLASSES`, `SUBJECTS`, `VIDEOS_DATA`, `SUBSCRIPTION_PLANS`
- Locked lessons: frontend-only via `isLocked`
- Payment: mock checkout UI only, no gateway integration

Admin repo findings:
- Framework: Vite + React 18
- Routing: protected `BrowserRouter` layout in `src/App.jsx`
- Current pages: dashboard, classes, subjects, courses, chapters, lesson, pricing, users, login
- Auth: mock `localStorage` token (`authToken`)
- State management: a single `AppContext` with in-memory mock CRUD
- API integration: none yet

Security/architecture issues in the current frontend:
- auth is stored in `localStorage`
- course access is enforced only in UI
- payment success is simulated client-side
- video URLs are directly embedded from mock data
- no backend verification for lesson access or purchases

This backend fixes those gaps by making payment verification, access control, and video playback authorization server-side.

## Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT access/refresh cookies
- bcrypt password hashing
- Razorpay order creation + verification + webhook handling
- Bunny Stream metadata gated by backend

## Implemented modules

- Authentication
  - register
  - login
  - logout
  - refresh session
  - current user
- Users
  - profile
  - enrolled courses
  - purchase history
- Courses
  - list published courses
  - get course by slug
  - lesson access check
  - lesson playback details
- Payments
  - create Razorpay order
  - verify payment
  - Razorpay webhook
  - grant course access only after verification
- Admin
  - create/update/delete/publish courses
  - create/update/delete lessons
  - attach Bunny Stream IDs / embed URLs
  - list orders
  - list enrollments

## API routes

Base path: `/api`

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`

### Users

- `GET /users/me`
- `GET /users/me/enrollments`
- `GET /users/me/orders`

### Courses

- `GET /courses`
- `GET /courses/:slug`
- `GET /courses/lessons/:lessonId/access`
- `GET /courses/lessons/:lessonId/playback`

### Payments

- `POST /payments/orders`
- `POST /payments/verify`
- `POST /payments/webhook`

### Admin

- `GET /admin/courses`
- `POST /admin/courses`
- `PUT /admin/courses/:courseId`
- `DELETE /admin/courses/:courseId`
- `PATCH /admin/courses/:courseId/publish`
- `POST /admin/courses/:courseId/lessons`
- `PUT /admin/courses/:courseId/lessons/:lessonId`
- `DELETE /admin/courses/:courseId/lessons/:lessonId`
- `GET /admin/orders`
- `GET /admin/enrollments`

### Health

- `GET /health`

## Database tables

- `User`
- `Course`
- `Lesson`
- `Order`
- `Payment`
- `UserCourseAccess`
- `VideoProgress`
- `RefreshToken`
- `AuditLog`

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Update `.env` values, especially:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `BUNNY_STREAM_LIBRARY_ID`
- `CORS_ORIGIN`

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Apply migrations:

```bash
npm run prisma:deploy
```

6. Seed admin account and starter course:

```bash
npm run prisma:seed
```

7. Start locally:

```bash
npm run dev
```

## Default admin

Seed uses:
- email: `DEFAULT_ADMIN_EMAIL`
- password: `DEFAULT_ADMIN_PASSWORD`

Change these in `.env` before seeding production.

## Bunny Stream handling

Each lesson can store either:
- `bunnyVideoId`
- `bunnyEmbedUrl`

Playback flow:
1. frontend requests lesson access from backend
2. backend checks preview status or purchased access
3. backend returns Bunny embed details only when access is valid

Current implementation builds:

```text
https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
```

If your Bunny setup requires signed playback tokens or custom pull-zone delivery, add that logic in `src/utils/bunny.js`.

## Razorpay flow

1. authenticated user calls `POST /api/payments/orders`
2. backend creates Razorpay order and local order row
3. frontend opens Razorpay checkout
4. frontend submits `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature` to `POST /api/payments/verify`
5. backend verifies signature and grants access
6. webhook also verifies independently for server-side reconciliation

Frontend success alone must never unlock lessons.

## Deployment notes for AWS Lightsail

Recommended MVP layout:
- frontend website on one domain/subdomain
- admin panel on another subdomain if preferred
- backend on `api.yourdomain.com`
- PostgreSQL on the same VM for MVP

### Example server packages

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib
```

### Run backend with PM2

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx

Use `nginx/drmombackend.conf` as the reverse-proxy starting point.

### TLS

Use Certbot after DNS is pointed:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

## Frontend integration notes

Minimal frontend changes needed:

Website repo:
- replace `src/utils/auth.js` localStorage flow with cookie-based auth calls
- replace mock login/register `setTimeout` in `src/pages/Login/Login.jsx`
- replace `VIDEOS_DATA` usage in `VideoContent.jsx` with `/api/courses/:slug`
- call `/api/courses/lessons/:lessonId/access` before rendering locked lessons
- call `/api/courses/lessons/:lessonId/playback` before loading Bunny iframe
- replace `Payment.jsx` mock submit with Razorpay checkout + `/api/payments/orders` and `/api/payments/verify`

Admin repo:
- replace `AppContext` mock CRUD with admin API calls
- replace localStorage-only login with `/api/auth/login`
- use `/api/admin/courses`, `/api/admin/orders`, `/api/admin/enrollments`

## Assumptions / missing config

- Razorpay credentials are not set yet
- Bunny Stream library ID and lesson video IDs are not set yet
- frontend repos have not been modified in this backend workspace
- refresh tokens are stored in DB for revocation support
- PostgreSQL is the chosen DB for deployment
