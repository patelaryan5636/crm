# GRAPHURA CRM — PRODUCTION KNOWLEDGE BASE v2.0
# Paste this entire file into GitHub Copilot before any task.
# DO NOT implement anything until I say so. Just store as knowledge.

---

## SYSTEM OVERVIEW
Multi-tenant CRM SaaS:
- ONE Super Admin (seeded in DB — no registration)
- MULTIPLE Admins (each = one company/tenant)
- Each Admin creates max 40 users (department members)
- ALL models scoped by `admin` field (tenantId = Admin._id)
- Department Members do NOT self-register — Admin creates them
- Default password for created users = email + '@' + last 5 digits of phone

---

## TECH STACK
- Node.js 20+ / Express
- MongoDB + Mongoose v8
- JWT Access Token (1-2hr) + Refresh Token (DB stored)
- Razorpay (payments + webhooks)
- Brevo (transactional email)
- Firebase FCM (push notifications)

---

## ROLES ENUM
```
SUPER_ADMIN | ADMIN
SALES_MANAGER | SALES_TL | SALES_EXECUTIVE
FINANCE_MANAGER
MANAGEMENT_MANAGER | MANAGEMENT_TL | MANAGEMENT_EMPLOYEE
```

---

## COMPLETE MODEL LIST (36 Models)

### Auth & Security
| Model | Purpose |
|-------|---------|
| SuperAdmin | Single record, seeded in DB |
| TokenBlacklist | Immediate JWT revocation on deactivation/logout |
| RefreshToken | JWT refresh tokens with TTL auto-delete |

### Plans & Limits
| Model | Purpose |
|-------|---------|
| SubscriptionPlan | Plans managed by Super Admin |
| UserLimitOverride | Super Admin increases specific admin's user cap |
| DataLimitOverride | Super Admin increases specific admin's data/lead cap |

### Tenant
| Model | Purpose |
|-------|---------|
| Admin | Each admin = one tenant/company |
| AdminLoginLog | Login logs for Admin only (Super Admin sees this) |

### Structure
| Model | Purpose |
|-------|---------|
| Department | Proper model (not enum) — expandable |
| Service | Service/product catalog per admin |
| Team | Sales & Management teams |

### Users
| Model | Purpose |
|-------|---------|
| User | All department members (created by Admin) |
| UserLoginLog | Login logs for all users (scoped to admin) |

### System
| Model | Purpose |
|-------|---------|
| AuditLog | Who changed what — before/after snapshots |
| InvoiceCounter | Atomic invoice number sequencing per admin |

### Sales
| Model | Purpose |
|-------|---------|
| Client | Client data (mobile = primary key per tenant) |
| Lead | Lead assigned to Sales Executive |
| LeadActivity | Comment/status history per lead |
| BulkLeadUpload | CSV/Excel upload with row-level error details |
| ProspectForm | Prospect details + suggested/final services |
| Reminder | Follow-up reminders |
| SalesTarget | Daily/Weekly/Monthly targets |

### Projects
| Model | Purpose |
|-------|---------|
| Project | Project after deal finalized |
| ProjectUpdate | Progress timeline entries |
| ProjectTrackingToken | Public client tracking page token |

### Finance
| Model | Purpose |
|-------|---------|
| Payment | Razorpay payments with signature + webhook tracking |
| WorkOrder | Work order generate/sign/approve |
| Invoice | Invoice with atomic number generation |
| Expense | Finance expense tracking |

### HR
| Model | Purpose |
|-------|---------|
| Attendance | Clock in/out + breaks + overtime |
| Leave | Leave requests + approval flow |

### Communication
| Model | Purpose |
|-------|---------|
| Ticket | Internal support tickets |
| SuperAdminTicket | Admin → Super Admin tickets (separate) |
| Announcement | Announcements/warnings/appreciation |
| Notification | Firebase push notifications |

### Config
| Model | Purpose |
|-------|---------|
| ApiConfig | Razorpay/Brevo/Firebase keys (Super Admin only) |

---

## CRITICAL RULES — ALWAYS FOLLOW

### 1. MULTI-TENANCY — Every query MUST include admin filter
```js
// CORRECT ✅
Lead.find({ admin: req.admin._id, assignedTo: userId })

// WRONG ❌ — returns all tenants' data
Lead.find({ assignedTo: userId })
```

### 2. SOFT DELETE — Never hard delete any record
Every major model has softDeletePlugin which adds:
```js
isDeleted: Boolean  // default false
deletedAt: Date
deletedBy: ObjectId
```
Use instance method: `await doc.softDelete(userId)`
Use static: `Model.findActive({ admin: adminId })` — auto excludes deleted

Exception: Leads use isDumped instead of softDelete for dump flow.

### 3. DUMP DATA RULES — Leads only
```js
// NEVER do this:
await Lead.deleteOne({ _id: leadId })

// ALWAYS do this:
await Lead.findByIdAndUpdate(leadId, {
  isDumped: true,
  dumpReason: reason,
  dumpedAt: new Date(),
  dumpedBy: userId,
  status: 'DUMP'
})
// Auto-dump rule: notTalkCount >= 3 → move to DUMP
// No auto-restore — only Manager or Admin can restore
```

### 4. ATOMIC UPDATES — Race condition prevention

#### Sales Target (never use $set for achieved fields):
```js
// CORRECT ✅ — atomic
await SalesTarget.findOneAndUpdate(
  { admin: adminId, user: userId, period: 'DAILY' },
  { $inc: { achievedCalls: 1 } }
)

// WRONG ❌ — race condition
target.achievedCalls = target.achievedCalls + 1;
await target.save();
```

#### Project paidAmount (prevent overpayment):
```js
// CORRECT ✅ — conditional atomic update
const result = await Project.findOneAndUpdate(
  {
    _id: projectId,
    admin: adminId,
    $expr: { $lt: ['$paidAmount', '$totalAmount'] }  // prevent overpayment
  },
  { $inc: { paidAmount: paymentAmount } },
  { new: true }
);
if (!result) throw new Error('Overpayment not allowed');
```

### 5. INVOICE NUMBER — Atomic generation (never manual)
```js
// CORRECT ✅ — atomic, no duplicates
const counter = await InvoiceCounter.findOneAndUpdate(
  { admin: adminId },
  { $inc: { seq: 1 } },
  { upsert: true, new: true }
);
const invoiceNumber = `${counter.prefix}-${String(counter.seq).padStart(6, '0')}`;
// Result: INV-000001, INV-000002, ...

// WRONG ❌ — duplicate risk under concurrent requests
const lastInvoice = await Invoice.findOne({ admin: adminId }).sort({ createdAt: -1 });
const invoiceNumber = `INV-${lastInvoice.seq + 1}`;
```

### 6. TOKEN REVOCATION — Immediate (no waiting for expiry)
```js
// When Admin/User is deactivated mid-session:
await TokenBlacklist.create({
  token: accessToken,
  holderType: 'USER',
  holderId: userId,
  reason: 'DEACTIVATED',
  expiresAt: tokenExpiry   // TTL index auto-cleans after this
});

// In auth middleware — check blacklist BEFORE validating JWT:
const blacklisted = await TokenBlacklist.findOne({ token });
if (blacklisted) return res.status(401).json({ message: 'Token revoked' });
```

### 7. CLIENT MOBILE — Unique PER admin (not globally)
```js
// Compound unique index: { admin: 1, mobile: 1 }
// Two different admins CAN have same client mobile — that's correct behavior

// When creating client:
const existing = await Client.findOne({ admin: adminId, mobile: mobile });
if (existing) throw new Error('Duplicate client for this account');
```

### 8. PASSWORD RULES
```js
// Default password for created users:
const defaultPassword = `${email}@${phone.slice(-5)}`;
// Example: john@doe.com + 9876543210 → john@doe.com@43210

// On first login:
// mustChangePassword = true → force redirect to change password
// After change: mustChangePassword = false, isFirstLogin = false
```

---

## LOGIN LOG VISIBILITY RULES (enforce at API layer)

| Role | Can See Logs Of |
|------|----------------|
| Super Admin | AdminLoginLog only |
| Admin | All UserLoginLog where admin = admin._id |
| Sales Manager | Self + Sales TL + Sales Executive |
| Sales TL | Self + Sales Executive (own team only) |
| Sales Executive | Self only |
| Finance Manager | Self only |
| Management Manager | Self + Management TL + Management Employee |
| Management TL | Self + Management Employee (own team) |
| Management Employee | Self only |

---

## USER LIMIT LOGIC

```js
// Effective user limit for an admin:
const override = await UserLimitOverride.findOne({ admin: adminId, isActive: true });
const effectiveLimit = override ? override.userLimit : admin.userLimit;

// Before creating a user:
const currentCount = await User.countDocuments({ admin: adminId, isDeleted: false });
if (currentCount >= effectiveLimit) {
  throw new Error('User limit reached. Contact Super Admin to increase.');
}
```

## LEAD DATA LIMIT LOGIC

```js
// Effective lead limit for a user:
const override = await DataLimitOverride.findOne({ admin: adminId });
const adminLimit = admin.leadLimits[user.role];    // admin's role-wise setting
const overrideLimit = override?.leadLimits?.[user.role];
const userOverride = user.leadDataLimit;            // individual override

// Priority: userOverride > overrideLimit > adminLimit
const effectiveLimit = userOverride ?? overrideLimit ?? adminLimit;

// Before assigning lead:
const currentLeads = await Lead.countDocuments({
  admin: adminId,
  assignedTo: userId,
  isDumped: false,
  isDeleted: false
});
if (currentLeads >= effectiveLimit) throw new Error('Lead data limit reached');
```

---

## PAYMENT FLOW (Razorpay)

```
1. Client enters Email + Mobile on payment page
2. Check: existing Client? → fetch | new → create Client record
3. Check: existing Project? → fetch | manual → get service name + amount
4. Server creates Razorpay order → returns order_id to frontend
5. Frontend opens Razorpay Checkout (UPI/Cards/Net Banking/Wallets)
6. On success:
   a. Frontend sends: razorpayOrderId, razorpayPaymentId, razorpaySignature
   b. Server verifies signature (MANDATORY — never trust frontend alone)
   c. Store Payment record with signatureVerified: true
   d. Update Project.paidAmount via $inc (atomic — prevent race condition)
   e. Create Invoice (atomic invoice number)
7. Webhook (backup validation):
   a. Razorpay sends webhook to server
   b. Verify webhook signature
   c. Update webhookVerified: true on Payment record
8. Send email confirmation via Brevo
9. Send Firebase push notification to Sales Manager + Finance Manager
10. Trigger payment alert to relevant sales executive
```

### Payment Security (NON-NEGOTIABLE)
```js
// Signature verification BEFORE storing SUCCESS:
const crypto = require('crypto');
const expectedSig = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

if (expectedSig !== razorpaySignature) {
  throw new Error('Invalid payment signature');
}
// Only after this: update Payment.status = 'SUCCESS'
```

---

## AUDIT LOG USAGE

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
  after:  { isDumped: false, status: 'UNTOUCHED' },
  ipAddress: req.ip,
});
```

---

## DEPARTMENT SETUP (on Admin registration)

When a new Admin registers, auto-create 3 default departments:
```js
const defaultDepts = [
  { name: 'SALES',      displayName: 'Sales Department',      isDefault: true },
  { name: 'FINANCE',    displayName: 'Finance Department',     isDefault: true },
  { name: 'MANAGEMENT', displayName: 'Management Department',  isDefault: true },
];
await Department.insertMany(defaultDepts.map(d => ({ ...d, admin: adminId })));
// Also create InvoiceCounter for this admin:
await InvoiceCounter.create({ admin: adminId, seq: 0, prefix: 'INV' });
```

---

## INDEX SUMMARY (Critical for performance)

```js
// User — email unique per admin
{ admin: 1, email: 1 }  UNIQUE

// Client — mobile unique per admin (NOT globally)
{ admin: 1, mobile: 1 }  UNIQUE

// Attendance — one per user per day per admin
{ admin: 1, user: 1, date: 1 }  UNIQUE

// Invoice — number unique per admin
{ admin: 1, invoiceNumber: 1 }  UNIQUE

// InvoiceCounter — one per admin
{ admin: 1 }  UNIQUE

// TokenBlacklist — auto-delete via TTL
{ expiresAt: 1 }  TTL expireAfterSeconds: 0

// RefreshToken — auto-delete via TTL
{ expiresAt: 1 }  TTL expireAfterSeconds: 0

// Lead — most queried
{ admin: 1, assignedTo: 1, isDumped: 1, isDeleted: 1 }
{ admin: 1, status: 1, isDeleted: 1 }
{ admin: 1, team: 1, isDeleted: 1 }

// Audit — for reporting
{ admin: 1, action: 1, createdAt: -1 }
{ admin: 1, targetModel: 1, targetId: 1 }
```

---

## JWT HARDENING
```js
// Access Token: 1-2 hour expiry
// Refresh Token: stored in RefreshToken collection
// Logout flow:
//   1. Set RefreshToken.isRevoked = true, revokedAt = now, revokedReason = 'LOGOUT'
//   2. Add access token to TokenBlacklist until its expiry
// Force logout (deactivation):
//   1. Revoke all active RefreshTokens for that user
//   2. Blacklist current access token
// Auth middleware order:
//   1. Extract token from Authorization header
//   2. Check TokenBlacklist → reject if found
//   3. Verify JWT signature
//   4. Check user/admin isActive → reject if false
//   5. Attach user/admin to req
```

---

## SOFT DELETE PLUGIN (applied to major models)
Models WITH softDelete plugin:
Admin, Department, Service, Team, User, Client, Project, Expense

Models WITHOUT softDelete (use their own archive/status logic):
Lead (uses isDumped), LeadActivity, Payment, Invoice, Attendance, Leave, Ticket, Logs

```js
// Usage:
await user.softDelete(adminId);           // instance method
await User.findActive({ admin: adminId }) // static — excludes isDeleted:true
```

---

## FIRST LOGIN FLOW (Department Members)
```
1. Admin creates user → default password set → mustChangePassword: true
2. User logs in with default password
3. System checks mustChangePassword → redirect to change password page
4. User changes password
5. User fills profile: address, bank details (email + phone already filled)
6. mustChangePassword: false, isProfileComplete: true
7. Normal access granted
```

---

## API INTEGRATIONS
- **Razorpay**: Order creation, checkout, signature verification, webhooks, refunds
- **Brevo**: Invoice emails, work order emails, payment confirmation, welcome emails
- **Firebase FCM**: Payment alerts, lead assignment alerts, reminder notifications, announcements
  - FCM token stored in User.fcmToken — updated on each login