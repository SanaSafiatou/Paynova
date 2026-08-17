# AGENTS.md — PayNova

## Project Structure (Critical)

**NO npm workspaces.** Three fully independent projects:

```
paynova/
├── mobile/      → Expo (React Native, TypeScript)
├── backend/     → NestJS + Prisma (TypeScript)
└── admin/       → Next.js (TypeScript)
```

Each has its own `package.json`, `node_modules`, installs and runs separately.

## Dev Commands

```bash
# Always prefix with: source ~/.nvm/nvm.sh && nvm use 22 &&

cd mobile  && npm install && npx expo start     # QR code for Expo Go (port 8081)
cd backend && npm install && npm run start:dev   # NestJS dev server (port 3000)
cd admin   && npm install && npm run dev         # Next.js dev server (port 3000)
```

## Golden Rules

1. **One feature at a time.** Code → test → correct → validate → then next feature.
2. **No financial success without backend confirmation.** UI never shows success based on local optimism.
3. **All debit/credit operations must be atomic.** DB transaction with automatic rollback on partial failure.
4. **Business parameters (fees, commissions, limits, min amounts) live in DB, never hardcoded.**
5. **No secrets in code.** API keys, credentials → `.env` only (never committed).
6. **Do not invent unspecified behavior.** Unspecified business rule → safest convention + comment.

## Mandatory Step 0 (Before Any Feature Work)

1. Initialize `mobile/`, `npm install`, `npx expo start` → confirm QR code loads in Expo Go
2. Initialize `backend/`, `npm install`, `npm run start:dev` → confirm server starts
3. Initialize `admin/`, `npm install`, `npm run dev` → confirm dev server starts
4. Document working commands in `CHANGELOG.md`

**No features until Step 0 is validated.**

## Environment Quirks

- **Node.js >= 22 required.** System has Node 18 via apt; use `source ~/.nvm/nvm.sh && nvm use 22` before any command.
- Each bash command in this project must prefix with `source ~/.nvm/nvm.sh && nvm use 22 &&` to pick up the correct Node.
- `npx expo start` starts Metro on port 8081.
- `nest start` starts on port 3000 by default (same as admin). Change one if running simultaneously.
- Admin uses Next.js 16 with Turbopack.

## Testing & Delivery

- **Development**: Use Expo Go (Ange has it installed). Verify QR code works at each step.
- **Major milestones**: Generate APK via Expo EAS Build (`eas build -p android --profile preview`)
  - `eas.json` must include `preview` profile with `"buildType": "apk"`
  - If no Expo/EAS access, provide the exact command for Ange to run
  - APK download links go in `CHANGELOG.md`

## Human Validation

At each milestone, **stop development** and provide Ange with APK or Expo Go access for real phone testing. **Do not proceed** to the next feature until Ange gives explicit confirmation. No additional work during waiting periods.

## Tech Stack (Fixed)

| Layer | Stack |
|-------|-------|
| Mobile | React Native + Expo (TypeScript) |
| Backend | NestJS (TypeScript) |
| DB | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Admin | Next.js |
| Auth | JWT (short access + refresh token) |
| Push | Firebase Cloud Messaging |
| OTP (dev) | Simulated: code logged to server, no SMS |
| KYC storage | Local encrypted `/uploads` (dev), S3 later |
| Dev infra | Local / Docker Compose (Postgres + Redis + API) |
| Secrets | `.env` at root of each service |

## Constraints

- Use only libraries/frameworks listed above unless explicitly requested.
- OTP is simulated in dev (code written to server logs, no real SMS).
- KYC documents stored locally in dev, S3 migration planned later.
- No dummy/demo data unless explicitly specified in the spec.
