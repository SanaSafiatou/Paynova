# CHANGELOG — PayNova

## [Unreleased]

### Step 0 — Project Initialization ✅
- [x] Initialize `mobile/` (Expo SDK 57, TypeScript)
- [x] Verify `npx expo start` → Metro Bundler on port 8081 ✅
- [x] Initialize `backend/` (NestJS 11, TypeScript)
- [x] Verify `npm run start:dev` → NestJS app on port 3000 ✅
- [x] Initialize `admin/` (Next.js 16, TypeScript, Turbopack)
- [x] Verify `npm run dev` → Next.js dev on port 3000 ✅

### Working Commands (validated 2026-08-17)
```bash
# Every command must prefix with:
source ~/.nvm/nvm.sh && nvm use 22 &&

# Mobile (port 8081)
cd mobile && npm install && npx expo start

# Backend (port 3000)
cd backend && npm install && npm run start:dev

# Admin (port 3000)
cd admin && npm install && npm run dev
```

---

### Feature 1 — Inscription + Verification OTP ✅ (2026-08-17)

#### Backend
- **PostgreSQL + Prisma ORM** installed and configured
  - Database: `paynova` (PostgreSQL 16)
  - User model: `id`, `phone` (unique), `role` (enum), `phoneVerified`, timestamps
  - Prisma 5.22.0 (downgraded from 7.x for NestJS CJS compatibility)
- **Redis** installed and configured for OTP storage (5-minute TTL)
- **Auth module** (NestJS):
  - `POST /auth/register` → creates user, generates 6-digit OTP, logs to console
  - `POST /auth/verify-otp` → validates OTP, marks phone verified
  - ValidationPipe with whitelist + forbidNonWhitelisted
  - CORS enabled
  - Server listens on `0.0.0.0:3000`

#### Mobile
- **Expo Router** configured (file-based routing)
- **Screens**:
  - `app/auth/phone.tsx` → Phone number input (E.164 format)
  - `app/auth/otp.tsx` → 6-digit OTP entry
  - `app/auth/success.tsx` → Verification confirmation
- **API client** (`src/api/client.ts`): `register()`, `verifyOtp()`, SecureStore helpers

#### Infrastructure
- `docker-compose.yml` (PostgreSQL 16 + Redis 7) for future Docker use
- `.env` files with all secrets (never committed)
- Prisma schema at `backend/prisma/schema.prisma`

#### Tests Passed (all verified)
| # | Test | Result |
|---|------|--------|
| 1 | Register new phone → user created in DB | ✅ |
| 2 | OTP generated → logged to server console | ✅ |
| 3 | OTP stored in Redis → retrievable | ✅ |
| 4 | Correct OTP → phoneVerified=true | ✅ |
| 5 | Wrong OTP → 400 "Invalid OTP code" | ✅ |
| 6 | Duplicate phone → 409 "Phone number already registered" | ✅ |
| 7 | Invalid phone format → 400 validation error | ✅ |
| 8 | Nonexistent phone → 404 "Phone number not found" | ✅ |
| 9 | PostgreSQL data verified via psql | ✅ |
| 10 | Server binds to 0.0.0.0 (network accessible) | ✅ |

#### Conventions
- Prisma 5.x used (7.x requires driver adapter incompatible with NestJS CJS)
- OTP is 6-digit numeric, stored in Redis with 5-min TTL
- Phone format: E.164 (`+` prefix, 7-15 digits)
- Default role: `CLIENT`

### APK Builds
| Feature | Date | APK URL | Notes |
|---------|------|---------|-------|
| Feature 1 — Inscription + OTP | 2026-08-17 | [APK](https://expo.dev/artifacts/eas/FpOI0W2YhSmg5_XRQYwJiHJI2sNeU1-N4YgQzdAtBls.apk) | Expo Go compatible |
