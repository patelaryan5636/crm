# Department Onboarding & Prerequisite Plan

## Purpose
This document defines the production-ready onboarding flow that forces department users to set a secure password and complete required profile and bank details after first-login. It covers data model changes, migrations, APIs, middleware, bulk-upload behavior, frontend routing, security, testing, monitoring, and rollout guidance so the engineering team can implement the feature reliably.

## Summary / Goals
- Require admin-created and bulk-imported users to change the default password on first login.
- Collect required department-level prerequisite fields (bank details and minimal profile fields) and persist them to the `users` collection.
- Prevent the onboarding pages from showing again once the user completes the flow.
- Ensure idempotent, secure, auditable, and test-covered implementation suitable for production.

## Acceptance Criteria
- New users created by Admin or bulk import who still have default passwords must see the Password Setup page at next login.
- After password change and required fields submission, `mustChangePassword` and `prereqCompleted` flags are cleared and user is not shown onboarding again.
- All submitted fields saved (or merged) into `users` collection; missing fields added when provided.
- APIs are idempotent and have unit/integration coverage.

## Data Model Changes
Add the following fields to the `User` model (Mongoose):
- `mustChangePassword: { type: Boolean, default: false }` — set true for admin-created/bulk-imported default-password users.
- `prereqCompleted: { type: Boolean, default: false }` — set true when required prereqs are complete.
- `prereqStep: { type: String, enum: ['password','bank-details','completed'], default: 'password' }` — current onboarding step.
- `bankDetails: { bankName, accountNumber (encrypted/masked), ifsc, beneficiaryName, verified:Boolean }` — grouped bank detail object.
- `onboardingAudit: [{ event, by, ip, ts, meta }]` — audit trail for onboarding actions.

Notes:
- Consider encrypting `accountNumber` at rest or storing it in a vault depending on compliance.

## Migration / Script
- Create a migration to add fields with safe defaults to existing users.
- For users created by admin/bulk import where default password rule applies, set `mustChangePassword=true` and `prereqCompleted=false`.
- Provide a reversible migration or a backup step for DB restore.

## Authentication & Session Flow
1. User logs in with default credentials.
2. Authentication returns session + `GET /auth/me` should include `mustChangePassword` and `prereqCompleted`.
3. Frontend routing: if `mustChangePassword` → redirect to `/onboard/password`; else if `!prereqCompleted` and role requires prereqs → redirect to `/onboard/bank`.

## Backend APIs
- `GET /auth/me` — includes `mustChangePassword`, `prereqCompleted`, `prereqStep`.
- `POST /auth/setup-password` — body: `{ password, confirmPassword }`.
  - Requirements: authenticated session or one-time valid token; validate strength; hash password; set `mustChangePassword=false`; set `prereqStep='bank-details'` or `completed` when bank not required; rotate refresh tokens; create audit entry.
- `POST /users/:id/bank-details` — body: `{ bankName, accountNumber, confirmAccountNumber, ifsc, beneficiaryName }`.
  - Validate accountNumber matches confirmAccountNumber; validate IFSC format; store masked/encrypted account number; set `prereqCompleted=true` when all required fields present; create audit entry.
- `PATCH /users/:id/onboarding-reset` — admin-only; resets onboarding flags for support/back-office.

Design & behaviors:
- Endpoints are idempotent: repeated submission with same data does not duplicate records or corrupt state.
- All write operations use atomic updates (`$set`, `$setOnInsert`, `$unset`).
- On password change, revoke or rotate refresh tokens and optionally expire other sessions.

## Middleware / Guards
- `prereqGuard` (execute after auth middleware):
  - If `mustChangePassword === true` → respond 403 or redirect to `/onboard/password` (API returns structured response for frontend to redirect).
  - Else if `prereqCompleted === false` and user's role/department requires prereqs → redirect to `/onboard/bank`.
  - Else allow request.

Notes:
- Use a JSON response to let SPA decide navigation. Avoid server-side redirect for API-first architecture.

## Bulk Upload & Single-Create Logic
- Bulk import flow (CSV job/controller):
  - Normalize/validate fields; create user docs with admin scope.
  - If default password is used by convention, set `mustChangePassword=true`, `prereqCompleted=false`.
  - For any additional fields present in CSV (e.g., bank fields), merge them into user doc during import; mark `prereqCompleted=true` if all required fields are present and valid.
  - Emit per-user notification (email/SMS) with instructions and optional one-time link to setup password.
- Single-create controller: same behavior as bulk — detect default password case and set flags.

## Frontend (Pages & UX)
- `Password Setup` page: fields `password`, `confirmPassword`; password strength meter; client-side validation; call `POST /auth/setup-password`.
- `Bank Details` page: `bankName`, `accountNumber`, `confirmAccountNumber`, `ifsc`, optional beneficiary name; validation and submit to `POST /users/:id/bank-details`.
- Stepper UI: Password → Bank Details → Complete (match provided designs).
- Routing: after login call `GET /auth/me` and route accordingly. Disable back/skip unless allowed by policy.

Security & privacy:
- Store session tokens in httpOnly cookies. Do not store passwords or account numbers in localStorage.
- Mask bank/account numbers in UI and logs. Log masked (last 4 digits) only.

## Validation & Security Hardening
- Enforce password policy from `planning.md` (min length, complexity, reuse prevention).
- Rate-limit `setup-password`, `bank-details`, and bulk-upload endpoints.
- Audit all onboarding actions with IP and actor.
- Input validation with server-side validators; sanitize inputs before DB writes.

## Testing
- Unit tests for model changes and controller logic.
- Integration tests: login → setup-password → bank-details → verify flags cleared.
- E2E: simulate bulk upload producing many users and ensure onboarding flows trigger.

## Monitoring, Rollout & Rollback
- Feature-flag the onboarding flow for gradual rollout.
- Monitor metric: `onboarding_completion_rate`, `avg_time_to_complete`, error rates.
- Ensure migration is reversible and keep DB backups before rollout.

## Support & Admin Tools
- Admin endpoint to reset a user's onboarding flags.
- Support UI page to view masked bank details and onboarding status.

## Developer Notes & Implementation Checklist
- Add Mongoose schema fields and index where helpful.
- Create migration script and test on staging DB snapshot.
- Implement controllers, middleware, and unit tests.
- Add frontend routes, pages, and E2E tests.
- Update `backend/planning.md` with final design and runbook.

---
Created for implementation hand-off. If you want, I can also scaffold the migration script and controller skeletons next.
