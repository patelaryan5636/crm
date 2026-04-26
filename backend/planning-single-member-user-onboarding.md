# Single Member Onboarding Plan (Admin Creates One User at a Time)

## 1. Objective
Build a production-grade flow where Admin creates department members individually (for example: Sales Manager in Sales, Finance Manager in Finance, Management TL in Management).

## 2. Scope
- In scope: Admin-only user creation, role-department mapping validation, default password policy, first-login enforcement, audit trail.
- In scope: Optional team assignment, optional lead data limit override.
- Out of scope: Self-registration by members, direct Super Admin user creation in tenant space.

## 3. Actors and Permissions
- Admin: Can create members only in own tenant.
- Super Admin: Can view and audit, not part of this onboarding API unless explicitly required.
- Department Member: Cannot create other members by default.

## 4. Core Business Rules
- Every record must be tenant-scoped with admin id.
- Role must match allowed department.
- Email must be unique per tenant.
- User limit must be enforced before creation.
- Soft-delete policy applies (never hard delete users).
- Default password format:
  - `${email}@${last5DigitsOfPhone}`
- First login flags:
  - `mustChangePassword = true`
  - `isFirstLogin = true`
- User remains active only if Admin is active and tenant plan is valid.

## 5. Role to Department Mapping (Recommended)
- SALES: SALES_MANAGER, SALES_TL, SALES_EXECUTIVE
- FINANCE: FINANCE_MANAGER
- MANAGEMENT: MANAGEMENT_MANAGER, MANAGEMENT_TL, MANAGEMENT_EMPLOYEE

## 6. Data Storage Design
Primary collection:
- User

Supporting collections used in workflow:
- Department (resolve department id)
- Team (optional assignment for TL/member)
- UserLimitOverride (effective user limit)
- AuditLog (who created which member)
- UserLoginLog (post-login visibility, not during create)

Important indexed constraints:
- User unique index: `{ admin: 1, email: 1 }`
- Useful query indexes:
  - `{ admin: 1, department: 1, isDeleted: 1 }`
  - `{ admin: 1, role: 1, isDeleted: 1 }`

## 7. API Planning
### 7.1 Create Single Member
- Method: POST
- Path: `/api/users`
- Auth: Admin token required
- Body:
  - name
  - email
  - phone
  - departmentId
  - role
  - teamId (optional)
  - leadDataLimit (optional, role-dependent)
  - address/bank/profile fields (optional at create)

Validation sequence:
1. Authenticated actor is Admin
2. `admin` scope from token only, never from client payload
3. Department exists under same admin
4. Role is allowed for selected department
5. Email and phone format validation
6. Effective user limit check
7. Team (if present) belongs to same admin and same department

Server actions:
1. Generate default password and hash it
2. Create User with first-login flags
3. Optional: attach to team
4. Write AuditLog entry
5. Optional: send welcome email with temporary credentials

Response:
- 201 with created user summary
- Do not return plain default password in normal response
- If password delivery needed, use one-time secure channel

Error design:
- 400 validation failure
- 401 unauthorized
- 403 forbidden scope/role mismatch
- 409 duplicate email
- 422 role-department mismatch
- 429 limit reached

### 7.2 Get Department Role Matrix
- Method: GET
- Path: `/api/users/meta/role-department-map`
- Use case: frontend dropdown constraints

### 7.3 Optional Dry-Run Endpoint
- Method: POST
- Path: `/api/users/validate-create`
- Use case: validate payload before commit for rich UI checks

## 8. Security and Compliance
- Never trust client-provided admin id
- Rate-limit create requests per admin and per IP
- Audit every create action with before/after payload snapshots
- Mask sensitive fields in logs
- Enforce strong password reset on first login
- Ensure inactive/deleted users cannot authenticate

## 9. Login Visibility Model (for planning alignment)
- Admin sees all UserLoginLog in own tenant
- Managers/TLs/employees see logs by hierarchy policy only
- Keep visibility checks in API layer, not UI-only

## 10. Frontend Planning (Single Create Form)
Form sections:
- Identity: Name, Email, Phone
- Organization: Department, Role, Team(optional)
- Permissions: Optional lead cap override
- Profile seed: Optional address/bank fields

UX behavior:
- Role dropdown depends on selected department
- Show effective user limit and current usage
- Preview generated username/default password policy note
- Explicit warning: member must change password at first login

## 11. Operational Concerns
- Idempotency: use email uniqueness + duplicate-safe error handling
- Monitoring:
  - user_create_success_count
  - user_create_failure_count
  - limit_reached_count
- Alerting: spike in create failures or duplicate attempts

## 12. QA Test Matrix
Critical tests:
- Create one user per valid role in each department
- Reject wrong role-department pair
- Reject cross-tenant department/team ids
- Enforce user limit
- Enforce unique email per tenant
- Verify first-login flags set correctly
- Verify audit log entry exists

## 13. Team Task Breakdown
Task A (Backend)
- Finalize validation schema
- Implement controller/service + audit log
- Add meta endpoint for role map
- Add tests for all failure branches

Task B (Frontend)
- Build dynamic create form
- Integrate with meta and create APIs
- Add clear validation and error states


