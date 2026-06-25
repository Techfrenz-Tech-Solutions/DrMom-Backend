# Database Backup

## Files

- `clean-demo-db.sql` — Clean production-ready database export (2026-06-25)

## Contents

- 1 ADMIN user: admin@drmom.local (password must be changed before go-live)
- 2 published courses: Grade 1 + Grade 2 Mathematics Foundation
- 3 lessons: Counting to 100 (preview, Bunny video linked), Addition Basics (locked), Subtraction Basics (locked)
- 0 test users, 0 test data, 0 stale sessions

## Restore

```bash
docker exec -i <db-container> psql -U drmom -d drmombackend < clean-demo-db.sql
```

## After restore

1. Change admin password via admin panel → Users
2. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET in .env
3. Set COOKIE_SECURE=true and configure HTTPS
4. Rebuild frontend/admin with VITE_API_BASE_URL set to real domain
