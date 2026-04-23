# ================================================================
# GRAPHURA CRM — FINAL PRODUCTION KNOWLEDGE BASE v3.0
# THIS IS THE FINAL VERSION — NO FURTHER CHANGES NEEDED
# Paste this entire file into GitHub Copilot before any task.
# DO NOT implement anything until I say so.
# ================================================================

## SYSTEM OVERVIEW
Multi-tenant CRM SaaS:
- ONE Super Admin (seeded in DB — no registration ever)
- MULTIPLE Admins (each = one company = one tenant)
- Each Admin creates max 40 users (all department members)
- ALL models scoped by `admin` field (tenantId = Admin._id)
- Department members do NOT self-register — Admin creates them
- Default password for created users = email + '@' + last 5 digits of phone

---

## TECH STACK
- Node.js 20+ / Express.js
- MongoDB + Mongoose v8
- JWT: Access Token (1-2hr expiry) + Refresh Token (DB stored)
- Razorpay: payments + webhooks + signature verification
- Brevo: transactional email (invoices, WO, payment confirmation)
- Firebase FCM: push notifications (token in User.fcmToken)
- bcrypt: password hashing

---

## ROLES ENUM
```
SUPER_ADMIN | ADMIN
SALES_MANAGER | SALES_TL | SALES_EXECUTIVE
FINANCE_MANAGER
MANAGEMENT_MANAGER | MANAGEMENT_TL | MANAGEMENT_EMPLOYEE
```

---

## COMPLETE MODEL LIST — 43 Models

### Super Admin
| # | Model | Purpose |
|---|-------|---------|
| 1 | SuperAdmin | Single record, seeded in DB, no registration |
| 2 | SuperAdminLoginLog | Every Super Admin login recorded here |

### Security
| # | Model | Purpose |
|---|-------|---------|
| 3 | LoginAttempt | Brute force protection — blocks after threshold |
| 4 | TokenBlacklist | Immediate JWT revocation, TTL auto-clean |
| 5 | RefreshToken | JWT refresh tokens, TTL auto-delete |
| 6 | PasswordReset | OTP-based password reset for Admin + User |

### Plans & Limits
| # | Model | Purpose |
|---|-------|---------|
| 7 | SubscriptionPlan | Plans managed by Super Admin |
| 8 | (Admin model) | Holds userLimit + clientLimit + leadLimits |
| 9 | UserLimitOverride | Super Admin increases specific admin's user cap |
| 10 | DataLimitOverride | Super Admin increases specific admin's lead/data cap |

### Tenant
| # | Model | Purpose |
|---|-------|---------|
| 11 | Admin | Each admin = one tenant/company (with company.website) |
| 12 | AdminLoginLog | Admin login logs (Super Admin sees this) |

### Structure
| # | Model | Purpose |
|---|-------|---------|
| 13 | Department | Proper model (not enum) — expandable |
| 14 | Service | Service/product catalog per admin |
| 15 | Team | Sales & Management teams |

### Users
| # | Model | Purpose |
|---|-------|---------|
| 16 | User | All department members (created by Admin only) |
| 17 | UserLoginLog | Login logs (scoped to admin) |

### System
| # | Model | Purpose |
|---|-------|---------|
| 18 | AuditLog | Who changed what — before/after snapshots |
| 19 | InvoiceCounter | Atomic invoice number sequencing per admin |
| 20 | WebhookLog | Raw Razorpay webhook log — replay detection |

### Sales
| # | Model | Purpose |
|---|-------|---------|
| 21 | Client | Client data (mobile = primary key per tenant) |
| 22 | Lead | Lead assigned to Sales Executive |
| 23 | LeadAssignmentHistory | Full reassignment history per lead |
| 24 | LeadActivity | Comment/status history per lead |
| 25 | BulkLeadUpload | CSV/Excel upload with row-level error details |
| 26 | ProspectForm | Prospect details + suggested/final services |
| 27 | Reminder | Follow-up reminders (sales + management) |
| 28 | SalesTarget | Daily/Weekly/Monthly targets |
| 29 | DailyReport | Pre-computed daily snapshot per user |

### Projects
| # | Model | Purpose |
|---|-------|---------|
| 30 | Project | Project after deal finalized |
| 31 | ProjectUpdate | Progress timeline entries |
| 32 | ProjectTrackingToken | Public client tracking page token |

### Finance
| # | Model | Purpose |
|---|-------|---------|
| 33 | Payment | Razorpay payments (signature + webhook verified) |
| 34 | WorkOrder | Work order generate/sign/approve |
| 35 | Invoice | Invoice with atomic number generation |
| 36 | Expense | Finance expense tracking with soft delete |

### HR
| # | Model | Purpose |
|---|-------|---------|
| 37 | Attendance | Clock in/out + breaks + overtime (normalized date) |
| 38 | LeaveBalance | Leave quota per user per year |
| 39 | Leave | Leave requests + approval flow |

### Communication
| # | Model | Purpose |
|---|-------|---------|
| 40 | Ticket | Internal support tickets |
| 41 | SuperAdminTicket | Admin → Super Admin tickets |
| 42 | Announcement | Announcements/warnings/appreciation |
| 43 | Notification | Firebase push notifications |

### Config
| # | Model | Purpose |
|---|-------|---------|
| 44 | ApiConfig | Razorpay/Brevo/Firebase keys (Super Admin only) |

---

## ADMIN MODEL — KEY FIELDS (from your MongoDB screenshot)

```js
Admin {
  _id: ObjectId,
  name: String,
  email: String,                     // unique globally
  password: String,                  // bcrypt hashed
  company: {
    name: String,                    // default: ''
    logo: String,                    // URL, default: ''
    email: String,                   // default: ''
    phone: String,                   // default: ''
    website: String,                 // ← ADDED (default: '')
    address: {
      line1, line2, city, state, pincode, country
    }
  },
  bankDetails: { bankName, accountNumber, ifscCode, upiId, branch },
  userLimit: 40,                     // Super Admin controls
  clientLimit: 6000,                 // Super Admin controls
  leadLimits: {
    SALES_EXECUTIVE: 250,            // Admin can change these
    SALES_TL: 1500,
    SALES_MANAGER: 6000,
  },
  plan: ObjectId → SubscriptionPlan,
  planActivatedAt: Date,
  planExpiresAt: Date,
  planStatus: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED',
  isActive: true,
  isProfileComplete: false,
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  createdAt, updatedAt, __v
}
```

---

## CRITICAL RULES — NEVER VIOLATE THESE

### RULE 1 — Multi-tenancy: Every query MUST include admin filter
```js
// ✅ CORRECT
Lead.find({ admin: req.admin._id, assignedTo: userId })

// ❌ WRONG — returns ALL tenants' data
Lead.find({ assignedTo: userId })
```

### RULE 2 — Soft Delete: Never hard-delete any record
```js
// ✅ CORRECT
await doc.softDelete(userId)          // instance method
await Model.findActive({ admin: id }) // static — excludes isDeleted:true

// ❌ WRONG
await Model.deleteOne({ _id: id })
await Model.findByIdAndDelete(id)
```

### RULE 3 — Lead Dump: Never delete leads
```js
// ✅ CORRECT — move to dump
await Lead.findByIdAndUpdate(leadId, {
  isDumped: true,
  status: 'DUMP',
  dumpReason: reason,
  dumpedAt: new Date(),
  dumpedBy: userId,
})
// Auto-dump rule: notTalkCount >= 3 → move to DUMP

// ❌ WRONG
await Lead.deleteOne({ _id: leadId })
```

### RULE 4 — Atomic Counters: SalesTarget achieved fields
```js
// ✅ CORRECT — atomic $inc only
await SalesTarget.findOneAndUpdate(
  { admin: adminId, user: userId, period: 'DAILY' },
  { $inc: { achievedCalls: 1 } }
)

// ❌ WRONG — race condition
target.achievedCalls = target.achievedCalls + 1
await target.save()
```

### RULE 5 — Payment: Prevent overpayment atomically
```js
// ✅ CORRECT — conditional atomic update
const result = await Project.findOneAndUpdate(
  {
    _id: projectId,
    admin: adminId,
    $expr: { $lt: ['$paidAmount', '$totalAmount'] }
  },
  { $inc: { paidAmount: paymentAmount } },
  { new: true }
)
if (!result) throw new Error('Overpayment not allowed')
```

### RULE 6 — Invoice Number: Always atomic via InvoiceCounter
```js
// ✅ CORRECT — no duplicates under concurrent requests
const counter = await InvoiceCounter.findOneAndUpdate(
  { admin: adminId },
  { $inc: { seq: 1 } },
  { upsert: true, new: true }
)
const invoiceNumber = `${counter.prefix}-${String(counter.seq).padStart(6, '0')}`
// → INV-000001, INV-000002 ...

// ❌ WRONG — duplicate risk
const last = await Invoice.findOne({ admin: adminId }).sort({ createdAt: -1 })
const num = last.seq + 1
```

### RULE 7 — Token Revocation: Immediate blacklisting
```js
// Auth middleware order (ALWAYS):
// 1. Extract token from Authorization header
// 2. Check TokenBlacklist → if found: 401 Unauthorized
// 3. Verify JWT signature
// 4. Check Admin/User isActive → if false: 401
// 5. Attach to req

// On deactivation:
await TokenBlacklist.create({
  token: accessToken,
  holderType: 'USER',
  holderId: userId,
  reason: 'DEACTIVATED',
  expiresAt: tokenExpiry
})
await RefreshToken.updateMany(
  { holderId: userId, isRevoked: false },
  { isRevoked: true, revokedAt: new Date(), revokedReason: 'FORCED' }
)
```

### RULE 8 — Client Mobile: Unique per admin, NOT globally
```js
// ✅ Two different admins CAN have same client mobile — that's correct
ClientSchema.index({ admin: 1, mobile: 1 }, { unique: true })

// Before creating:
const exists = await Client.findOne({ admin: adminId, mobile })
if (exists) throw new Error('Client already exists in your account')
```

### RULE 9 — Attendance Date: Always normalize to start-of-day
```js
// Pre-save hook already handles this in the model
// But in your service layer also normalize:
const date = new Date(inputDate)
date.setHours(0, 0, 0, 0)
// Then use this normalized date
```

### RULE 10 — Brute Force: Check LoginAttempt before auth
```js
const attempt = await LoginAttempt.findOne({ identifier: email, identifierType: 'EMAIL' })
if (attempt?.isBlocked && attempt.blockedUntil > new Date()) {
  throw new Error('Account temporarily blocked. Try after some time.')
}
// On failed login:
await LoginAttempt.findOneAndUpdate(
  { identifier: email, identifierType: 'EMAIL' },
  {
    $inc: { attempts: 1 },
    lastAttemptAt: new Date(),
    $set: { ipAddress, userAgent }
  },
  { upsert: true }
)
// Block after 5 attempts for 30 minutes:
if (attempt.attempts >= 5) {
  await LoginAttempt.findOneAndUpdate(
    { identifier: email },
    { isBlocked: true, blockedAt: new Date(), blockedUntil: new Date(Date.now() + 30*60*1000) }
  )
}
```

---

## LOGIN FLOWS

### Super Admin Login
- No registration — credentials seeded in DB
- Log stored in: SuperAdminLoginLog
- Can see: AdminLoginLog (all admins)

### Admin Login
- Self-registers with name, email, password, phone
- Log stored in: AdminLoginLog
- mustChangePassword: false (Admin sets own password)
- On registration: auto-create 3 departments (SALES, FINANCE, MANAGEMENT) + InvoiceCounter

### User (Department Member) Login
- Created by Admin only — no self-registration
- Default password = `${email}@${phone.slice(-5)}`
  - Example: john@doe.com + 9876543210 → john@doe.com@43210
- mustChangePassword = true → force change on first login
- After change: fill profile (address, bank details)
- Log stored in: UserLoginLog (scoped to admin)

---

## ON ADMIN REGISTRATION — AUTO-CREATE
```js
// 1. Create 3 default departments
await Department.insertMany([
  { admin: adminId, name: 'SALES',      displayName: 'Sales Department',      isDefault: true },
  { admin: adminId, name: 'FINANCE',    displayName: 'Finance Department',     isDefault: true },
  { admin: adminId, name: 'MANAGEMENT', displayName: 'Management Department',  isDefault: true },
])

// 2. Create InvoiceCounter
await InvoiceCounter.create({ admin: adminId, seq: 0, prefix: 'INV' })

// 3. Create LeaveBalance for Admin itself (year = current year)
// Not needed — Admin is not a User record
```

---

## LOGIN LOG VISIBILITY (enforce at service/API layer)

| Role | Can See Logs Of |
|------|----------------|
| Super Admin | SuperAdminLoginLog + AdminLoginLog (all admins) |
| Admin | UserLoginLog where admin = admin._id (all users) |
| Sales Manager | Self + Sales TL + Sales Executive |
| Sales TL | Self + Sales Executive (own team only) |
| Sales Executive | Self only |
| Finance Manager | Self only |
| Management Manager | Self + Management TL + Management Employee |
| Management TL | Self + Management Employee (own team) |
| Management Employee | Self only |

---

## USER + DATA LIMIT LOGIC

```js
// Effective user limit:
const override = await UserLimitOverride.findOne({ admin: adminId, isActive: true })
const effectiveUserLimit = override?.userLimit ?? admin.userLimit

// Check before creating user:
const count = await User.countActive({ admin: adminId })
if (count >= effectiveUserLimit) throw new Error('User limit reached')

// Effective lead limit for a user:
const dataOverride = await DataLimitOverride.findOne({ admin: adminId })
const adminRoleLimit = admin.leadLimits[user.role]
const overrideRoleLimit = dataOverride?.leadLimits?.[user.role]
const individualOverride = user.leadDataLimit
// Priority: individual > dataOverride > admin default
const effectiveLeadLimit = individualOverride ?? overrideRoleLimit ?? adminRoleLimit

// Check before assigning lead:
const leadCount = await Lead.countDocuments({
  admin: adminId, assignedTo: userId, isDumped: false, isDeleted: false
})
if (leadCount >= effectiveLeadLimit) throw new Error('Lead limit reached')
```

---

## PAYMENT FLOW (Step by Step)

```
1. Client enters Email + Mobile on Global Payment Page
2. System: existing Client? → fetch | new → create Client record
3. System: existing Project? → fetch | manual → service name + amount
4. Server creates Razorpay order → returns order_id
5. Frontend opens Razorpay Checkout (UPI/Cards/Net Banking/Wallets)
   Pre-filled: name, email, mobile
6. On payment success:
   a. Frontend sends: razorpayOrderId, razorpayPaymentId, razorpaySignature
   b. Server verifies Razorpay signature (MANDATORY)
   c. Store Payment: signatureVerified: true, status: 'SUCCESS'
   d. Atomic: Project.paidAmount += amount (with overpayment check)
   e. Generate Invoice (atomic InvoiceCounter)
   f. Log raw webhook in WebhookLog
7. Razorpay Webhook (backup):
   a. Verify webhook signature
   b. Update Payment: webhookVerified: true
   c. Log in WebhookLog: isProcessed: true
8. Send via Brevo: email confirmation + invoice to client
9. Send Firebase FCM: to Sales Manager + Finance Manager
10. Post payment alert to Sales Executive (their deal)
```

### Razorpay Signature Verification (NON-NEGOTIABLE)
```js
const crypto = require('crypto')
const body = `${razorpayOrderId}|${razorpayPaymentId}`
const expected = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest('hex')
if (expected !== razorpaySignature) {
  throw new Error('Invalid payment signature — reject this payment')
}
// Only AFTER this: set status = 'SUCCESS'
```

---

## AUDIT LOG — How to Use

```js
// Log every important action:
await AuditLog.create({
  admin: adminId,
  performedBy: userId,
  performerType: 'USER',
  action: 'LEAD_RESTORED',
  targetModel: 'Lead',
  targetId: lead._id,
  before: { isDumped: true, status: 'DUMP' },
  after:  { isDumped: false, status: 'UNTOUCHED', restoredBy: userId },
  ipAddress: req.ip,
  note: 'Manually restored by Sales Manager',
})
```

---

## LEAVE BALANCE — How to Update on Approval

```js
// When a leave is approved:
const year = new Date(leave.fromDate).getFullYear()
const field = leave.leaveType.toLowerCase()  // 'casual', 'sick', 'earned', 'unpaid'

await LeaveBalance.findOneAndUpdate(
  { admin: leave.admin, user: leave.user, year },
  {
    $inc: {
      [`${field}.used`]:      leave.days,
      [`${field}.remaining`]: -leave.days,
    }
  },
  { upsert: true }
)
```

---

## DAILY REPORT SNAPSHOT — Generation

```js
// Generate/refresh snapshot for a user on that date:
const date = new Date(); date.setHours(0,0,0,0)

const [activities, leads] = await Promise.all([
  LeadActivity.find({ admin, user, createdAt: { $gte: date } }),
  Lead.find({ admin, assignedTo: user, isDeleted: false }),
])

await DailyReport.findOneAndUpdate(
  { admin, user, date },
  {
    todayCalls:     activities.filter(a => a.status === 'TALK').length,
    todayProspect:  activities.filter(a => a.status === 'INTERESTED').length,
    todaySell:      activities.filter(a => a.status === 'CONVERTED').length,
    todayDump:      activities.filter(a => a.status === 'DUMP').length,
    totalLeads:     leads.length,
    totalUntouched: leads.filter(l => l.status === 'UNTOUCHED').length,
    generatedAt:    new Date(),
  },
  { upsert: true, new: true }
)
```

---

## WEBHOOK LOG — How to Use

```js
// Store every incoming Razorpay webhook:
const log = await WebhookLog.create({
  admin: adminId,
  source: 'RAZORPAY',
  event: req.body.event,           // 'payment.captured'
  payload: req.body,
  signature: req.headers['x-razorpay-signature'],
  isVerified: false,
  razorpayOrderId: req.body.payload?.payment?.entity?.order_id,
  razorpayPaymentId: req.body.payload?.payment?.entity?.id,
})

// After verification:
await WebhookLog.findByIdAndUpdate(log._id, {
  isVerified: true,
  isProcessed: true,
  processedAt: new Date(),
})
```

---

## INDEXES SUMMARY (All Critical Unique Indexes)

```js
// User — email unique PER admin (not globally)
{ admin: 1, email: 1 }  →  UNIQUE

// Client — mobile unique PER admin (not globally)
{ admin: 1, mobile: 1 }  →  UNIQUE

// Attendance — one record per user per day per admin
{ admin: 1, user: 1, date: 1 }  →  UNIQUE

// Invoice — number unique per admin
{ admin: 1, invoiceNumber: 1 }  →  UNIQUE

// InvoiceCounter — one per admin
{ admin: 1 }  →  UNIQUE

// Department — name unique per admin
{ admin: 1, name: 1 }  →  UNIQUE

// LeaveBalance — one per user per year
{ admin: 1, user: 1, year: 1 }  →  UNIQUE

// DailyReport — one per user per day
{ admin: 1, user: 1, date: 1 }  →  UNIQUE

// LoginAttempt — one per identifier
{ identifier: 1, identifierType: 1 }  →  UNIQUE

// TTL Auto-delete Indexes:
TokenBlacklist.expiresAt    →  expireAfterSeconds: 0
RefreshToken.expiresAt      →  expireAfterSeconds: 0
PasswordReset.expiresAt     →  expireAfterSeconds: 0
LoginAttempt.lastAttemptAt  →  expireAfterSeconds: 86400
```

---

## JWT HARDENING COMPLETE FLOW

```
Access Token:  1-2 hour expiry
Refresh Token: stored in RefreshToken collection (TTL = 7 days or 30 days)

Login:
  1. Verify credentials
  2. Clear old revoked RefreshTokens for this user (cleanup)
  3. Create new RefreshToken record
  4. Return: { accessToken, refreshToken }

Refresh:
  1. Validate refreshToken from DB (not revoked, not expired)
  2. Verify holderType matches
  3. Issue new accessToken (rotate refresh token optionally)

Logout:
  1. Set RefreshToken.isRevoked = true
  2. Add accessToken to TokenBlacklist (until its natural expiry)
  3. Clear User.fcmToken (optional — stops push notifications)

Force Logout (Admin deactivates user):
  1. Set User.isActive = false
  2. Revoke ALL active RefreshTokens for that user
  3. Add all their active accessTokens to TokenBlacklist
  4. Auth middleware checks isActive on every request

Password Change:
  1. Revoke ALL RefreshTokens for that user
  2. Blacklist current accessToken
  3. Set mustChangePassword = false
  4. Force re-login
```

---

## SOFT DELETE PLUGIN — Applied To These Models
Admin, Department, Service, Team, User, Client, Project, Expense

Adds: `isDeleted`, `deletedAt`, `deletedBy`
Methods: `doc.softDelete(userId)`, `doc.restore()`
Statics: `Model.findActive(filter)`, `Model.findOneActive(filter)`, `Model.countActive(filter)`

---

## API INTEGRATIONS

### Razorpay
- Order creation (server-side only)
- Razorpay Checkout (frontend)
- Signature verification (MANDATORY before SUCCESS)
- Webhooks (backup validation — log in WebhookLog)
- Refunds via API

### Brevo (Email)
- Welcome email (on Admin registration)
- Invoice PDF email
- Work Order email
- Payment confirmation email
- Password reset OTP email

### Firebase FCM (Push Notifications)
- Token stored: User.fcmToken (updated on each login)
- Events: payment alerts, lead assignments, reminders, announcements
- Notification record stored in Notification model (isRead tracking)