// ============================================================
// GRAPHURA CRM — PRODUCTION-READY MULTI-TENANT MONGOOSE MODELS
// Version: 2.0 (All gaps fixed)
// Architecture: SuperAdmin → Multiple Admins (Tenants) → Departments → Users
// MongoDB + Mongoose v8 | Node.js 20+
// ============================================================

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────
// SHARED SOFT DELETE PLUGIN
// Applied to every model that needs safe deletion.
// Never hard-delete — always softDelete().
// ─────────────────────────────────────────────────────────────
function softDeletePlugin(schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date,    default: null },
    deletedBy: { type: Schema.Types.ObjectId, default: null },
  });

  // Instance method
  schema.methods.softDelete = async function (userId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
    return this.save();
  };

  // Static helper — always exclude deleted docs by default
  schema.statics.findActive = function (filter = {}) {
    return this.find({ ...filter, isDeleted: false });
  };

  schema.statics.findOneActive = function (filter = {}) {
    return this.findOne({ ...filter, isDeleted: false });
  };
}

// ─────────────────────────────────────────────────────────────
// ENUMS (centralized — change here, reflects everywhere)
// ─────────────────────────────────────────────────────────────
const ROLES = [
  'SUPER_ADMIN', 'ADMIN',
  'SALES_MANAGER', 'SALES_TL', 'SALES_EXECUTIVE',
  'FINANCE_MANAGER',
  'MANAGEMENT_MANAGER', 'MANAGEMENT_TL', 'MANAGEMENT_EMPLOYEE',
];

const DEPT_NAMES     = ['SALES', 'FINANCE', 'MANAGEMENT'];
const LEAD_STATUS    = ['UNTOUCHED', 'TALK', 'NOT_TALK', 'INTERESTED', 'CONVERTED', 'DUMP'];
const PROJ_STATUS    = ['NOT_STARTED', 'WORK_STARTED', 'IN_PROGRESS', 'REVIEW', 'FINALIZATION', 'COMPLETED', 'DELIVERED', 'DELAYED'];
const PROJ_PRIORITY  = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const PAY_STATUS     = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
const TICKET_STATUS  = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'];
const LEAVE_STATUS   = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const LEAVE_TYPE     = ['CASUAL', 'SICK', 'EARNED', 'HALF_DAY', 'UNPAID'];
const APPROVAL_ST    = ['PENDING', 'APPROVED', 'REJECTED'];
const INVOICE_STATUS = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
const PLAN_STATUS    = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'TRIAL'];
const TARGET_PERIOD  = ['DAILY', 'WEEKLY', 'MONTHLY'];
const HOLDER_TYPE    = ['SUPER_ADMIN', 'ADMIN', 'USER'];
const NOTIF_TYPE     = [
  'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'WORK_ORDER_SIGNED',
  'TICKET_UPDATED', 'LEAD_ASSIGNED', 'REMINDER_DUE',
  'ANNOUNCEMENT', 'TARGET_ALERT', 'LEAVE_STATUS', 'GENERAL',
];
const AUDIT_ACTIONS  = [
  'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
  'LEAD_CREATED', 'LEAD_ASSIGNED', 'LEAD_REASSIGNED', 'LEAD_DUMPED', 'LEAD_RESTORED',
  'LEAD_STATUS_CHANGED', 'BULK_LEAD_UPLOAD',
  'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_STATUS_CHANGED', 'PROJECT_DELIVERED',
  'PAYMENT_CREATED', 'PAYMENT_VERIFIED', 'PAYMENT_FAILED',
  'INVOICE_CREATED', 'INVOICE_SENT', 'WORK_ORDER_GENERATED', 'WORK_ORDER_SIGNED',
  'LEAVE_APPLIED', 'LEAVE_APPROVED', 'LEAVE_REJECTED',
  'TARGET_SET', 'TARGET_UPDATED',
  'ANNOUNCEMENT_SENT', 'TICKET_CREATED', 'TICKET_RESOLVED', 'TICKET_ESCALATED',
  'ADMIN_CREATED', 'ADMIN_UPDATED', 'ADMIN_DEACTIVATED',
  'LIMIT_CHANGED', 'PASSWORD_CHANGED', 'PROFILE_UPDATED',
];

// ─────────────────────────────────────────────────────────────
// HELPER — reusable address sub-schema
// ─────────────────────────────────────────────────────────────
const AddressSchema = new Schema({
  line1:   String,
  line2:   String,
  city:    String,
  state:   String,
  pincode: String,
  country: { type: String, default: 'India' },
}, { _id: false });

// ─────────────────────────────────────────────────────────────
// HELPER — reusable bank details sub-schema
// ─────────────────────────────────────────────────────────────
const BankDetailsSchema = new Schema({
  bankName:      String,
  accountNumber: String,
  ifscCode:      String,
  upiId:         String,
  branch:        String,
}, { _id: false });


// ════════════════════════════════════════════════════════════
// MODEL 1 — SUPER ADMIN
// Single document. Seeded directly in DB. No registration.
// Login via credentials in DB only.
// ════════════════════════════════════════════════════════════
const SuperAdminSchema = new Schema({
  name:     { type: String, default: 'Super Admin' },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },   // bcrypt hashed — seeded in DB
  isActive: { type: Boolean, default: true },
}, { timestamps: true });


// ════════════════════════════════════════════════════════════
// MODEL 2 — TOKEN BLACKLIST
// Immediate token revocation without waiting for expiry.
// When Super Admin deactivates Admin/User mid-session,
// their access token is blacklisted here.
// TTL index auto-cleans expired blacklisted tokens.
// ════════════════════════════════════════════════════════════
const TokenBlacklistSchema = new Schema({
  token:          { type: String, required: true, unique: true },
  holderType:     { type: String, enum: HOLDER_TYPE, required: true },
  holderId:       { type: Schema.Types.ObjectId, required: true },
  reason:         { type: String, enum: ['LOGOUT', 'DEACTIVATED', 'PASSWORD_CHANGED', 'FORCED_LOGOUT'], default: 'LOGOUT' },
  blacklistedAt:  { type: Date, default: Date.now },
  expiresAt:      { type: Date, required: true },  // same as JWT expiry
});

// Auto-delete after token naturally expires (no need to keep it after that)
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TokenBlacklistSchema.index({ token: 1 });
TokenBlacklistSchema.index({ holderId: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 3 — REFRESH TOKEN (JWT Hardening)
// Works for SuperAdmin, Admin, and User.
// Logout = isRevoked: true
// TTL index auto-deletes expired tokens.
// ════════════════════════════════════════════════════════════
const RefreshTokenSchema = new Schema({
  holderId:    { type: Schema.Types.ObjectId, required: true },
  holderType:  { type: String, enum: HOLDER_TYPE, required: true },
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin' },   // null for SuperAdmin
  token:       { type: String, required: true, unique: true },
  expiresAt:   { type: Date, required: true },
  isRevoked:   { type: Boolean, default: false },
  ipAddress:   String,
  userAgent:   String,
  revokedAt:   Date,
  revokedReason: { type: String, enum: ['LOGOUT', 'FORCED', 'PASSWORD_CHANGED', 'EXPIRED'] },
}, { timestamps: true });

RefreshTokenSchema.index({ holderId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


// ════════════════════════════════════════════════════════════
// MODEL 4 — SUBSCRIPTION PLAN
// Created/managed by Super Admin.
// Each Admin is assigned a plan.
// ════════════════════════════════════════════════════════════
const SubscriptionPlanSchema = new Schema({
  planName:      { type: String, required: true, trim: true },
  maxUsers:      { type: Number, default: 40 },
  maxClients:    { type: Number, default: 6000 },
  storageGB:     { type: Number, default: 10 },
  priceINR:      { type: Number, default: 0 },
  durationDays:  { type: Number, default: 30 },
  isActive:      { type: Boolean, default: true },
  features:      [String],
  description:   String,
}, { timestamps: true });


// ════════════════════════════════════════════════════════════
// MODEL 5 — ADMIN (TENANT)
// Each admin = one company = one tenant.
// Admin self-registers. All data is scoped to admin._id.
// ════════════════════════════════════════════════════════════
const AdminSchema = new Schema({
  // ── Identity ──
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone:    { type: String, match: [/^\d{10}$/, 'Phone must be 10 digits'] },

  // ── Company Branding ──
  company: {
    name:    { type: String, trim: true },
    logo:    String,
    email:   { type: String, lowercase: true },
    phone:   String,
    website: String,
    address: AddressSchema,
  },

  // ── Bank Details ──
  bankDetails: BankDetailsSchema,

  // ── Limits (Super Admin sets, Admin cannot change these) ──
  userLimit:   { type: Number, default: 40 },     // max users Admin can create
  clientLimit: { type: Number, default: 6000 },   // max leads/clients total

  // ── Role-wise Lead Data Limits (Admin CAN change these) ──
  leadLimits: {
    SALES_EXECUTIVE: { type: Number, default: 250 },
    SALES_TL:        { type: Number, default: 1500 },
    SALES_MANAGER:   { type: Number, default: 6000 },
  },

  // ── Subscription ──
  plan:            { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  planActivatedAt: Date,
  planExpiresAt:   Date,
  planStatus:      { type: String, enum: PLAN_STATUS, default: 'TRIAL' },

  // ── Status ──
  isActive:        { type: Boolean, default: true },

  // ── Profile complete flag ──
  isProfileComplete: { type: Boolean, default: false },

  // ── Super Admin reference ──
  superAdmin: { type: Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, { timestamps: true });

AdminSchema.plugin(softDeletePlugin);
AdminSchema.index({ email: 1 });
AdminSchema.index({ isActive: 1, isDeleted: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 6 — DEPARTMENT
// Proper Department collection (not hardcoded enum).
// Super Admin creates/deletes departments globally.
// Each Admin has their own active departments.
// Allows future expansion (e.g., HR Department).
// ════════════════════════════════════════════════════════════
const DepartmentSchema = new Schema({
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  name:        { type: String, required: true, trim: true, uppercase: true },
  displayName: { type: String, required: true, trim: true },
  isDefault:   { type: Boolean, default: false },  // SALES, FINANCE, MANAGEMENT are defaults
  isActive:    { type: Boolean, default: true },
  manager:     { type: Schema.Types.ObjectId, ref: 'User' },  // assigned dept manager
}, { timestamps: true });

DepartmentSchema.plugin(softDeletePlugin);
// Department name unique per admin
DepartmentSchema.index({ admin: 1, name: 1 }, { unique: true });


// ════════════════════════════════════════════════════════════
// MODEL 7 — SERVICE CATALOG
// Services/products offered by each admin's company.
// Used in ProspectForm (suggested services) and Invoices.
// ════════════════════════════════════════════════════════════
const ServiceSchema = new Schema({
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  name:        { type: String, required: true, trim: true },
  description: String,
  price:       { type: Number, default: 0 },
  unit:        String,    // e.g. "per month", "one-time", "per page"
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

ServiceSchema.plugin(softDeletePlugin);
ServiceSchema.index({ admin: 1, isActive: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 8 — USER (Department Members)
// Created ONLY by Admin. NO self-registration.
// Default password = email + '@' + last 5 digits of phone
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const UserSchema = new Schema({
  // ── Tenant Scope (CRITICAL) ──
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin',      required: true },
  department:  { type: Schema.Types.ObjectId, ref: 'Department', required: true },

  // ── Identity ──
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  password:    { type: String, required: true },
  phone:       { type: String, match: [/^\d{10}$/, 'Phone must be 10 digits'] },

  // ── Role ──
  role:        { type: String, enum: ROLES, required: true },

  // ── Hierarchy ──
  manager:     { type: Schema.Types.ObjectId, ref: 'User' },

  // ── Profile (filled after first login) ──
  address:     AddressSchema,
  bankDetails: BankDetailsSchema,
  profilePic:  String,

  // ── Firebase Push Token ──
  fcmToken:    String,

  // ── Lead Data Limit ──
  // null = use admin.leadLimits[role] as default
  leadDataLimit: { type: Number, default: null },

  // ── Account Flags ──
  isActive:           { type: Boolean, default: true },
  isProfileComplete:  { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: true },   // force on first login
  approvalStatus:     { type: String, enum: APPROVAL_ST, default: 'APPROVED' },

  // ── Last seen ──
  lastLoginAt: Date,
}, { timestamps: true });

UserSchema.plugin(softDeletePlugin);
// email unique PER admin (tenant) — NOT globally
UserSchema.index({ admin: 1, email: 1 }, { unique: true });
UserSchema.index({ admin: 1, role: 1, isDeleted: 1 });
UserSchema.index({ admin: 1, department: 1, isDeleted: 1 });
UserSchema.index({ manager: 1 });
UserSchema.index({ admin: 1, isActive: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 9 — ADMIN LOGIN LOG
// Separate from user login logs.
// Super Admin sees only this collection.
// ════════════════════════════════════════════════════════════
const AdminLoginLogSchema = new Schema({
  admin:     { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  email:     String,
  role:      { type: String, default: 'ADMIN' },
  ipAddress: String,
  latitude:  Number,
  longitude: Number,
  userAgent: String,
  device:    String,
  loginAt:   { type: Date, default: Date.now },
  isSuccess: { type: Boolean, default: true },
  failReason: String,
});

AdminLoginLogSchema.index({ admin: 1, loginAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 10 — USER LOGIN LOG
// Scoped to admin (tenant).
// Admin sees ALL his users' login logs.
// Role-based visibility enforced at API layer.
// ════════════════════════════════════════════════════════════
const UserLoginLogSchema = new Schema({
  admin:     { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  user:      { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  email:     String,
  role:      String,
  ipAddress: String,
  latitude:  Number,
  longitude: Number,
  userAgent: String,
  device:    String,
  loginAt:   { type: Date, default: Date.now },
  isSuccess: { type: Boolean, default: true },
  failReason: String,
});

UserLoginLogSchema.index({ admin: 1, user: 1, loginAt: -1 });
UserLoginLogSchema.index({ admin: 1, role: 1, loginAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 11 — AUDIT LOG
// Tracks every important action in the system.
// Who changed what, before and after snapshot.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const AuditLogSchema = new Schema({
  admin:        { type: Schema.Types.ObjectId, ref: 'Admin' },  // null for SuperAdmin actions
  performedBy:  { type: Schema.Types.ObjectId, required: true },
  performerType: { type: String, enum: HOLDER_TYPE, required: true },
  action:       { type: String, enum: AUDIT_ACTIONS, required: true },
  targetModel:  { type: String, required: true },   // 'Lead', 'User', 'Project', etc.
  targetId:     { type: Schema.Types.ObjectId, required: true },
  before:       Schema.Types.Mixed,    // snapshot before change
  after:        Schema.Types.Mixed,    // snapshot after change
  ipAddress:    String,
  note:         String,
}, { timestamps: true });

AuditLogSchema.index({ admin: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ admin: 1, targetModel: 1, targetId: 1 });
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 12 — INVOICE COUNTER
// Atomic sequence for invoice numbers per admin.
// Prevents duplicate invoice numbers under concurrent requests.
// Usage: findOneAndUpdate({ admin }, { $inc: { seq: 1 } }, { upsert: true, new: true })
// ════════════════════════════════════════════════════════════
const InvoiceCounterSchema = new Schema({
  admin:  { type: Schema.Types.ObjectId, ref: 'Admin', required: true, unique: true },
  seq:    { type: Number, default: 0 },   // atomically incremented
  prefix: { type: String, default: 'INV' },
}, { timestamps: true });

// Usage in service layer:
// const counter = await InvoiceCounter.findOneAndUpdate(
//   { admin: adminId },
//   { $inc: { seq: 1 } },
//   { upsert: true, new: true }
// );
// invoiceNumber = `${counter.prefix}-${String(counter.seq).padStart(6, '0')}`;
// → INV-000001, INV-000002, ...


// ════════════════════════════════════════════════════════════
// MODEL 13 — USER LIMIT OVERRIDE
// Super Admin can increase a specific Admin's user limit
// without changing their subscription plan.
// ════════════════════════════════════════════════════════════
const UserLimitOverrideSchema = new Schema({
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin', required: true, unique: true },
  userLimit:   { type: Number, required: true },
  reason:      String,
  grantedBy:   { type: Schema.Types.ObjectId, ref: 'SuperAdmin' },
  grantedAt:   { type: Date, default: Date.now },
  expiresAt:   Date,
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });


// ════════════════════════════════════════════════════════════
// MODEL 14 — DATA LIMIT OVERRIDE
// Super Admin can increase a specific Admin's lead/client limit.
// ════════════════════════════════════════════════════════════
const DataLimitOverrideSchema = new Schema({
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin', required: true, unique: true },
  clientLimit: Number,
  leadLimits: {
    SALES_EXECUTIVE: Number,
    SALES_TL:        Number,
    SALES_MANAGER:   Number,
  },
  reason:    String,
  grantedBy: { type: Schema.Types.ObjectId, ref: 'SuperAdmin' },
  grantedAt: { type: Date, default: Date.now },
}, { timestamps: true });


// ════════════════════════════════════════════════════════════
// MODEL 15 — TEAM
// Scoped to admin (tenant).
// Sales: TL leads a team of Executives.
// Management: TL leads a team of Employees.
// ════════════════════════════════════════════════════════════
const TeamSchema = new Schema({
  admin:      { type: Schema.Types.ObjectId, ref: 'Admin',      required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  name:       { type: String, required: true, trim: true },
  leader:     { type: Schema.Types.ObjectId, ref: 'User' },
  members: [{
    user:     { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    _id:      false,
  }],
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

TeamSchema.plugin(softDeletePlugin);
TeamSchema.index({ admin: 1, department: 1, isDeleted: 1 });
TeamSchema.index({ admin: 1, leader: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 16 — CLIENT
// Scoped to admin (tenant).
// PRIMARY IDENTIFIER = mobile (unique per admin, NOT globally).
// Used in Sales (leads) and Finance (payments/projects).
// ════════════════════════════════════════════════════════════
const ClientSchema = new Schema({
  admin:  { type: Schema.Types.ObjectId, ref: 'Admin', required: true },

  // ── Identity ──
  name:   { type: String, trim: true },
  email:  { type: String, lowercase: true, trim: true },
  mobile: { type: String, required: true, match: [/^\d{10}$/, 'Mobile must be 10 digits'] },

  source: {
    type: String,
    enum: ['CSV_UPLOAD', 'EXCEL', 'MANUAL', 'PROSPECT_FORM', 'PAYMENT_PAGE'],
  },

  // ── Prospect Status ──
  prospectStatus: {
    type: String,
    enum: ['NONE', 'INTERESTED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST'],
    default: 'NONE',
  },

  // ── Who added (for performance tracking) ──
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  // ── Company Info (from CSV: company name, phone, email) ──
  companyName: String,
}, { timestamps: true });

ClientSchema.plugin(softDeletePlugin);
// mobile unique PER admin (NOT globally)
ClientSchema.index({ admin: 1, mobile: 1 }, { unique: true });
ClientSchema.index({ admin: 1, email: 1 });
ClientSchema.index({ admin: 1, isDeleted: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 17 — LEAD
// Scoped to admin (tenant).
// Lead = Client assigned to a Sales Executive.
// Full lifecycle tracked here.
// ════════════════════════════════════════════════════════════
const LeadSchema = new Schema({
  admin:      { type: Schema.Types.ObjectId, ref: 'Admin',  required: true },
  client:     { type: Schema.Types.ObjectId, ref: 'Client', required: true },

  // ── Assignment Chain (for performance tracking) ──
  assignedTo:  { type: Schema.Types.ObjectId, ref: 'User', required: true },  // Sales Executive
  assignedBy:  { type: Schema.Types.ObjectId, ref: 'User' },                  // TL or Manager
  team:        { type: Schema.Types.ObjectId, ref: 'Team' },

  // ── Status ──
  status:      { type: String, enum: LEAD_STATUS, default: 'UNTOUCHED' },

  // ── Talk Tracking ──
  talkCount:       { type: Number, default: 0 },
  notTalkCount:    { type: Number, default: 0 },   // auto-dump after >= 3
  talkDuration:    { type: Number, default: 0 },   // total in minutes
  lastContactedAt: Date,

  // ── Dump Management ──
  isDumped:    { type: Boolean, default: false },
  dumpReason:  String,
  dumpedAt:    Date,
  dumpedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  restoredAt:  Date,
  restoredBy:  { type: Schema.Types.ObjectId, ref: 'User' },

  // ── Follow-up ──
  followUpAt:     Date,
  followUpMissed: { type: Boolean, default: false },

  // ── Bulk Upload Reference ──
  bulkUploadId: { type: Schema.Types.ObjectId, ref: 'BulkLeadUpload' },

  // ── Conversion ──
  convertedAt: Date,
  convertedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

LeadSchema.index({ admin: 1, assignedTo: 1, isDumped: 1, isDeleted: 1 });
LeadSchema.index({ admin: 1, status: 1, isDeleted: 1 });
LeadSchema.index({ admin: 1, team: 1, isDeleted: 1 });
LeadSchema.index({ admin: 1, client: 1 });
LeadSchema.index({ admin: 1, followUpAt: 1, followUpMissed: 1 });
LeadSchema.index({ admin: 1, isDumped: 1 });

// NOTE: No hard delete on leads — always use isDumped or softDelete
// Rule: notTalkCount >= 3 → move to DUMP (enforced in service layer)


// ════════════════════════════════════════════════════════════
// MODEL 18 — LEAD ACTIVITY
// Every status update or comment by Sales Executive is logged.
// Used for: comment history, performance tracking, reports.
// ════════════════════════════════════════════════════════════
const LeadActivitySchema = new Schema({
  admin:    { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  lead:     { type: Schema.Types.ObjectId, ref: 'Lead',  required: true },
  user:     { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  status:   { type: String, enum: LEAD_STATUS, required: true },
  comment:  String,
  duration: { type: Number, default: 0 },  // call duration in minutes
}, { timestamps: true });

LeadActivitySchema.index({ admin: 1, lead: 1, createdAt: -1 });
LeadActivitySchema.index({ admin: 1, user: 1, createdAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 19 — BULK LEAD UPLOAD
// Tracks CSV/Excel uploads by Sales Manager.
// Stores detailed row-level errors for debugging/re-upload.
// ════════════════════════════════════════════════════════════
const BulkLeadUploadSchema = new Schema({
  admin:      { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User',  required: true },

  fileType:   { type: String, enum: ['CSV', 'EXCEL'] },
  fileName:   String,
  fileUrl:    String,

  totalRows:   { type: Number, default: 0 },
  imported:    { type: Number, default: 0 },
  duplicates:  { type: Number, default: 0 },
  invalidRows: { type: Number, default: 0 },

  // ── Row-level error details (FIX: was just a number before) ──
  failedRows: [{
    rowNumber:  Number,
    rawData:    Schema.Types.Mixed,   // original row data
    reason:     String,               // 'INVALID_PHONE' | 'DUPLICATE' | 'MISSING_FIELD'
    _id:        false,
  }],

  // ── Summary errors ──
  errors: [String],

  status: { type: String, enum: ['PROCESSING', 'DONE', 'PARTIAL', 'FAILED'], default: 'PROCESSING' },

  // ── Assigned to whom after upload ──
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },   // Sales TL or Executive
}, { timestamps: true });

BulkLeadUploadSchema.index({ admin: 1, uploadedBy: 1, createdAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 20 — PROSPECT FORM
// Filled by Sales Executive for interested leads.
// Viewed/updated by TL and Manager.
// Services reference proper Service model now.
// ════════════════════════════════════════════════════════════
const ProspectFormSchema = new Schema({
  admin:    { type: Schema.Types.ObjectId, ref: 'Admin',  required: true },
  lead:     { type: Schema.Types.ObjectId, ref: 'Lead',   required: true },
  client:   { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  filledBy: { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  updatedBy:{ type: Schema.Types.ObjectId, ref: 'User' },

  requirement:     String,
  budget:          Number,
  expectedClosing: Date,
  notes:           String,

  // ── Services (now references Service model, not just strings) ──
  suggestedServices: [{
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    name:    String,     // snapshot of service name at time of suggestion
    price:   Number,     // snapshot of price
    qty:     { type: Number, default: 1 },
    _id:     false,
  }],

  // ── Final services (edited by Finance Manager) ──
  finalServices: [{
    service:  { type: Schema.Types.ObjectId, ref: 'Service' },
    name:     String,
    price:    Number,
    qty:      { type: Number, default: 1 },
    discount: { type: Number, default: 0 },
    _id:      false,
  }],

  totalAmount: Number,
  discount:    { type: Number, default: 0 },
  finalAmount: Number,

  status: {
    type: String,
    enum: ['OPEN', 'IN_NEGOTIATION', 'SENT_TO_FINANCE', 'WON', 'LOST'],
    default: 'OPEN',
  },
}, { timestamps: true });

ProspectFormSchema.index({ admin: 1, lead: 1 });
ProspectFormSchema.index({ admin: 1, filledBy: 1 });
ProspectFormSchema.index({ admin: 1, status: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 21 — REMINDER
// Used by Sales Executive, TL, Management Employee.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const ReminderSchema = new Schema({
  admin:    { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  user:     { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  lead:     { type: Schema.Types.ObjectId, ref: 'Lead' },
  project:  { type: Schema.Types.ObjectId, ref: 'Project' },
  title:    { type: String, required: true, trim: true },
  note:     String,
  remindAt: { type: Date, required: true },
  isMissed: { type: Boolean, default: false },
  isDone:   { type: Boolean, default: false },
  doneAt:   Date,
}, { timestamps: true });

ReminderSchema.index({ admin: 1, user: 1, remindAt: 1, isDone: 1 });
ReminderSchema.index({ admin: 1, isMissed: 1 });
ReminderSchema.index({ admin: 1, lead: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 22 — SALES TARGET
// Set by Sales Manager or Admin.
// achievedCalls/Sales/Revenue updated via $inc ONLY (atomic).
// ════════════════════════════════════════════════════════════
const SalesTargetSchema = new Schema({
  admin:  { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  setBy:  { type: Schema.Types.ObjectId, ref: 'User',  required: true },

  targetFor: { type: String, enum: ['USER', 'TEAM', 'DEPARTMENT'], required: true },
  user:      { type: Schema.Types.ObjectId, ref: 'User' },
  team:      { type: Schema.Types.ObjectId, ref: 'Team' },
  department:{ type: Schema.Types.ObjectId, ref: 'Department' },

  period:   { type: String, enum: TARGET_PERIOD, required: true },
  fromDate: { type: Date, required: true },
  toDate:   { type: Date, required: true },

  targetCalls:   { type: Number, default: 0 },
  targetSales:   { type: Number, default: 0 },
  targetRevenue: { type: Number, default: 0 },

  // ── IMPORTANT: Update ONLY via $inc — never $set (prevents race conditions) ──
  achievedCalls:   { type: Number, default: 0 },
  achievedSales:   { type: Number, default: 0 },
  achievedRevenue: { type: Number, default: 0 },
}, { timestamps: true });

// Usage in service: SalesTarget.findOneAndUpdate(filter, { $inc: { achievedCalls: 1 } })
SalesTargetSchema.index({ admin: 1, period: 1, fromDate: 1 });
SalesTargetSchema.index({ admin: 1, user: 1, period: 1 });
SalesTargetSchema.index({ admin: 1, team: 1, period: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 23 — PROJECT
// Created after deal finalized (Finance → Management).
// soldBy tracks which Sales Executive made the sale.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const ProjectSchema = new Schema({
  admin:   { type: Schema.Types.ObjectId, ref: 'Admin',  required: true },
  client:  { type: Schema.Types.ObjectId, ref: 'Client', required: true },

  name:         { type: String, required: true, trim: true },
  description:  String,
  driveLink:    String,
  handoverLink: String,   // mandatory before delivery (enforced in service)
  priority:     { type: String, enum: PROJ_PRIORITY, default: 'MEDIUM' },
  status:       { type: String, enum: PROJ_STATUS,   default: 'NOT_STARTED' },

  startDate:        Date,
  expectedDelivery: Date,
  deliveredAt:      Date,

  // ── Assignment ──
  assignedTeam: { type: Schema.Types.ObjectId, ref: 'Team' },
  teamLeader:   { type: Schema.Types.ObjectId, ref: 'User' },   // Management TL
  assignedTo:   { type: Schema.Types.ObjectId, ref: 'User' },   // Management Employee

  // ── Sales Reference (who sold this — for performance tracking) ──
  soldBy:       { type: Schema.Types.ObjectId, ref: 'User' },   // Sales Executive
  prospectForm: { type: Schema.Types.ObjectId, ref: 'ProspectForm' },

  // ── Finance ──
  totalAmount: { type: Number, default: 0 },
  paidAmount:  { type: Number, default: 0 },   // updated via $inc atomically
  // NOTE: paidAmount validation (cannot exceed totalAmount) enforced in service layer
  // using: findOneAndUpdate with $inc + condition: { paidAmount: { $lt: totalAmount } }

  // ── Delivery ──
  isDelivered:       { type: Boolean, default: false },
  deliveryConfirmed: { type: Boolean, default: false },

  // ── Progress ──
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

ProjectSchema.plugin(softDeletePlugin);
ProjectSchema.index({ admin: 1, status: 1, isDeleted: 1 });
ProjectSchema.index({ admin: 1, client: 1 });
ProjectSchema.index({ admin: 1, teamLeader: 1 });
ProjectSchema.index({ admin: 1, assignedTo: 1 });
ProjectSchema.index({ admin: 1, soldBy: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 24 — PROJECT UPDATE (Progress Tracker)
// Each entry = one milestone/update in the project timeline.
// Powers both internal tracking and client-facing tracking page.
// ════════════════════════════════════════════════════════════
const ProjectUpdateSchema = new Schema({
  admin:      { type: Schema.Types.ObjectId, ref: 'Admin',   required: true },
  project:    { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  updatedBy:  { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  status:     { type: String, enum: PROJ_STATUS, required: true },
  note:       String,
  workNote:   String,
  attachmentUrl: String,
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  isClientVisible: { type: Boolean, default: true },  // show on client tracking page
}, { timestamps: true });

ProjectUpdateSchema.index({ admin: 1, project: 1, createdAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 25 — PAYMENT
// Razorpay integration. Full & Partial payments.
// paidAmount on Project updated via $inc atomically.
// Signature verified before storing SUCCESS.
// ════════════════════════════════════════════════════════════
const PaymentSchema = new Schema({
  admin:   { type: Schema.Types.ObjectId, ref: 'Admin',   required: true },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  client:  { type: Schema.Types.ObjectId, ref: 'Client',  required: true },

  // ── Razorpay Fields ──
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // ── Payment Details ──
  amount:       { type: Number, required: true, min: 1 },
  paymentType:  { type: String, enum: ['FULL', 'PARTIAL'], required: true },
  status:       { type: String, enum: PAY_STATUS, default: 'PENDING' },
  failureReason: String,

  // ── Security ──
  webhookVerified:    { type: Boolean, default: false },  // true after webhook confirmation
  signatureVerified:  { type: Boolean, default: false },  // true after Razorpay sig check

  // ── Metadata ──
  paidAt:      Date,
  retryCount:  { type: Number, default: 0 },
  verifiedBy:  { type: Schema.Types.ObjectId, ref: 'User' },  // Finance Manager

  // ── Refund ──
  isRefunded:   { type: Boolean, default: false },
  refundedAt:   Date,
  refundReason: String,
  razorpayRefundId: String,
}, { timestamps: true });

PaymentSchema.index({ admin: 1, project: 1 });
PaymentSchema.index({ admin: 1, client: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });
PaymentSchema.index({ admin: 1, status: 1 });
PaymentSchema.index({ admin: 1, createdAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 26 — WORK ORDER
// Generated by Finance Manager after deal finalization.
// Client signs the work order (tracked here).
// ════════════════════════════════════════════════════════════
const WorkOrderSchema = new Schema({
  admin:       { type: Schema.Types.ObjectId, ref: 'Admin',   required: true },
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },

  isGenerated:  { type: Boolean, default: false },
  pdfUrl:       String,

  isSigned:     { type: Boolean, default: false },
  signedAt:     Date,
  signedByName: String,

  isApproved:   { type: Boolean, default: false },
  approvedAt:   Date,
  sentToEmail:  String,
  sentAt:       Date,
}, { timestamps: true });

WorkOrderSchema.index({ admin: 1, project: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 27 — INVOICE
// Auto-generated or manual by Finance Manager.
// Invoice number generated atomically via InvoiceCounter.
// Custom GST supported.
// ════════════════════════════════════════════════════════════
const InvoiceSchema = new Schema({
  admin:     { type: Schema.Types.ObjectId, ref: 'Admin',   required: true },
  project:   { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  payment:   { type: Schema.Types.ObjectId, ref: 'Payment' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User',    required: true },

  // ── Invoice Number (generated atomically via InvoiceCounter) ──
  invoiceNumber: { type: String, required: true },

  amount:      { type: Number, required: true },
  discount:    { type: Number, default: 0 },
  gstPercent:  { type: Number, default: 18 },
  gstAmount:   { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  isCustomGst: { type: Boolean, default: false },

  status:      { type: String, enum: INVOICE_STATUS, default: 'DRAFT' },
  pdfUrl:      String,
  dueDate:     Date,
  sentAt:      Date,
  sentToEmail: String,
  paidAt:      Date,

  lineItems: [{
    name:     String,
    qty:      Number,
    price:    Number,
    amount:   Number,
    _id:      false,
  }],
}, { timestamps: true });

// invoiceNumber unique per admin (tenant)
InvoiceSchema.index({ admin: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ admin: 1, project: 1 });
InvoiceSchema.index({ admin: 1, status: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 28 — EXPENSE
// Added by Finance Manager.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const ExpenseSchema = new Schema({
  admin:     { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  category:  { type: String, required: true, trim: true },
  amount:    { type: Number, required: true, min: 0 },
  note:      String,
  date:      { type: Date, default: Date.now },
  receiptUrl: String,  // optional expense receipt attachment
}, { timestamps: true });

ExpenseSchema.plugin(softDeletePlugin);
ExpenseSchema.index({ admin: 1, date: -1 });
ExpenseSchema.index({ admin: 1, category: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 29 — SUPPORT TICKET
// Internal tickets. Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const TicketSchema = new Schema({
  admin:      { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  raisedBy:   { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },

  subject:  { type: String, required: true, trim: true },
  message:  { type: String, required: true },
  status:   { type: String, enum: TICKET_STATUS, default: 'OPEN' },
  priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },

  refType: {
    type: String,
    enum: ['CLIENT_DATA', 'SALES_MANAGER', 'SALES_TL', 'EXECUTIVE', 'SYSTEM'],
  },
  refId: Schema.Types.ObjectId,

  replies: [{
    user:      { type: Schema.Types.ObjectId, ref: 'User' },
    message:   String,
    createdAt: { type: Date, default: Date.now },
    _id:       false,
  }],

  isEscalated: { type: Boolean, default: false },
  escalatedAt: Date,
  resolvedAt:  Date,
  resolvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

TicketSchema.index({ admin: 1, raisedBy: 1, status: 1 });
TicketSchema.index({ admin: 1, assignedTo: 1, status: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 30 — SUPER ADMIN SUPPORT TICKET
// Admins raise tickets TO Super Admin.
// Completely separate from internal tickets.
// ════════════════════════════════════════════════════════════
const SuperAdminTicketSchema = new Schema({
  raisedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  subject:  { type: String, required: true, trim: true },
  message:  { type: String, required: true },
  status:   { type: String, enum: TICKET_STATUS, default: 'OPEN' },
  priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
  replies: [{
    senderType: { type: String, enum: ['ADMIN', 'SUPER_ADMIN'] },
    senderId:   Schema.Types.ObjectId,
    message:    String,
    createdAt:  { type: Date, default: Date.now },
    _id:        false,
  }],
  resolvedAt: Date,
}, { timestamps: true });

SuperAdminTicketSchema.index({ raisedBy: 1, status: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 31 — ATTENDANCE
// Clock In / Clock Out per user per day.
// Includes break tracking and overtime.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const AttendanceSchema = new Schema({
  admin:    { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  user:     { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  date:     { type: Date, required: true },   // store normalized to start-of-day

  clockIn:   Date,
  clockOut:  Date,
  latitude:  Number,
  longitude: Number,
  ipAddress: String,

  // ── Break Tracking ──
  breaks: [{
    startedAt: Date,
    endedAt:   Date,
    _id:       false,
  }],

  // ── Calculated Fields (set on clockOut) ──
  hoursWorked:     { type: Number, default: 0 },    // in decimal hours
  breakMinutes:    { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },
  isHalfDay:       { type: Boolean, default: false },
  isAbsent:        { type: Boolean, default: false },
  note:            String,
}, { timestamps: true });

// One record per user per day per admin
AttendanceSchema.index({ admin: 1, user: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ admin: 1, date: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 32 — LEAVE
// Applied by any user. Approved by Admin (top level).
// TL can approve their direct reports (enforced at API layer).
// ════════════════════════════════════════════════════════════
const LeaveSchema = new Schema({
  admin:      { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  user:       { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },

  leaveType:     { type: String, enum: LEAVE_TYPE, required: true },
  fromDate:      { type: Date,   required: true },
  toDate:        { type: Date,   required: true },
  days:          { type: Number, required: true, min: 0.5 },
  reason:        String,
  status:        { type: String, enum: LEAVE_STATUS, default: 'PENDING' },
  rejectionNote: String,
  approvedAt:    Date,
  cancelledAt:   Date,
}, { timestamps: true });

LeaveSchema.index({ admin: 1, user: 1, status: 1 });
LeaveSchema.index({ admin: 1, approvedBy: 1 });
LeaveSchema.index({ admin: 1, fromDate: 1, status: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 33 — ANNOUNCEMENT
// Sent by Admin, Sales Manager, Sales TL.
// targetType controls visibility scope.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const AnnouncementSchema = new Schema({
  admin:          { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  createdBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  createdByAdmin: { type: Boolean, default: false },

  title:   { type: String, required: true, trim: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['INFO', 'WARNING', 'APPRECIATION'], required: true },

  targetType: {
    type: String,
    enum: ['ALL', 'DEPARTMENT', 'TEAM', 'ROLE', 'USER'],
    required: true,
  },
  targetDepartment: { type: Schema.Types.ObjectId, ref: 'Department' },
  targetTeam:       { type: Schema.Types.ObjectId, ref: 'Team' },
  targetRole:       { type: String, enum: ROLES },
  targetUser:       { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

AnnouncementSchema.index({ admin: 1, createdAt: -1 });
AnnouncementSchema.index({ admin: 1, targetType: 1 });


// ════════════════════════════════════════════════════════════
// MODEL 34 — NOTIFICATION
// Firebase push notifications.
// Scoped to admin (tenant).
// ════════════════════════════════════════════════════════════
const NotificationSchema = new Schema({
  admin:   { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
  user:    { type: Schema.Types.ObjectId, ref: 'User',  required: true },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  type:    { type: String, enum: NOTIF_TYPE, required: true },
  refId:   Schema.Types.ObjectId,
  refType: String,
  isRead:  { type: Boolean, default: false },
  readAt:  Date,
}, { timestamps: true });

NotificationSchema.index({ admin: 1, user: 1, isRead: 1, createdAt: -1 });


// ════════════════════════════════════════════════════════════
// MODEL 35 — API CONFIG
// Global API keys. Managed by Super Admin only.
// Razorpay, Brevo, Firebase keys stored here.
// In production: use environment variables / vault instead.
// ════════════════════════════════════════════════════════════
const ApiConfigSchema = new Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: String, required: true },
  description: String,
  isEncrypted: { type: Boolean, default: true },
  updatedBy:   { type: Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, { timestamps: true });


// ════════════════════════════════════════════════════════════
// MODEL 36 — CLIENT PROJECT TRACKING TOKEN
// Public-facing page. No login required.
// Client accesses via unique secure token linked to project.
// ════════════════════════════════════════════════════════════
const ProjectTrackingTokenSchema = new Schema({
  admin:    { type: Schema.Types.ObjectId, ref: 'Admin',   required: true },
  project:  { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  client:   { type: Schema.Types.ObjectId, ref: 'Client',  required: true },
  token:    { type: String, required: true, unique: true },   // UUID v4
  expiresAt:{ Date },
  isActive: { type: Boolean, default: true },
  lastAccessedAt: Date,
  accessCount:    { type: Number, default: 0 },
}, { timestamps: true });

ProjectTrackingTokenSchema.index({ token: 1 });
ProjectTrackingTokenSchema.index({ admin: 1, project: 1 });


// ════════════════════════════════════════════════════════════
// EXPORT ALL MODELS
// ════════════════════════════════════════════════════════════
module.exports = {
  // ── Core Auth ──
  SuperAdmin:           mongoose.model('SuperAdmin',           SuperAdminSchema),
  TokenBlacklist:       mongoose.model('TokenBlacklist',       TokenBlacklistSchema),
  RefreshToken:         mongoose.model('RefreshToken',         RefreshTokenSchema),

  // ── Plans & Limits ──
  SubscriptionPlan:     mongoose.model('SubscriptionPlan',     SubscriptionPlanSchema),
  UserLimitOverride:    mongoose.model('UserLimitOverride',     UserLimitOverrideSchema),
  DataLimitOverride:    mongoose.model('DataLimitOverride',     DataLimitOverrideSchema),

  // ── Tenant ──
  Admin:                mongoose.model('Admin',                AdminSchema),
  AdminLoginLog:        mongoose.model('AdminLoginLog',        AdminLoginLogSchema),

  // ── Department & Structure ──
  Department:           mongoose.model('Department',           DepartmentSchema),
  Service:              mongoose.model('Service',              ServiceSchema),
  Team:                 mongoose.model('Team',                 TeamSchema),

  // ── Users ──
  User:                 mongoose.model('User',                 UserSchema),
  UserLoginLog:         mongoose.model('UserLoginLog',         UserLoginLogSchema),

  // ── Audit & Counters ──
  AuditLog:             mongoose.model('AuditLog',             AuditLogSchema),
  InvoiceCounter:       mongoose.model('InvoiceCounter',       InvoiceCounterSchema),

  // ── Sales ──
  Client:               mongoose.model('Client',               ClientSchema),
  Lead:                 mongoose.model('Lead',                  LeadSchema),
  LeadActivity:         mongoose.model('LeadActivity',         LeadActivitySchema),
  BulkLeadUpload:       mongoose.model('BulkLeadUpload',       BulkLeadUploadSchema),
  ProspectForm:         mongoose.model('ProspectForm',         ProspectFormSchema),
  Reminder:             mongoose.model('Reminder',             ReminderSchema),
  SalesTarget:          mongoose.model('SalesTarget',          SalesTargetSchema),

  // ── Projects ──
  Project:              mongoose.model('Project',              ProjectSchema),
  ProjectUpdate:        mongoose.model('ProjectUpdate',        ProjectUpdateSchema),
  ProjectTrackingToken: mongoose.model('ProjectTrackingToken', ProjectTrackingTokenSchema),

  // ── Finance ──
  Payment:              mongoose.model('Payment',              PaymentSchema),
  WorkOrder:            mongoose.model('WorkOrder',            WorkOrderSchema),
  Invoice:              mongoose.model('Invoice',              InvoiceSchema),
  Expense:              mongoose.model('Expense',              ExpenseSchema),

  // ── HR ──
  Attendance:           mongoose.model('Attendance',           AttendanceSchema),
  Leave:                mongoose.model('Leave',                LeaveSchema),

  // ── Communication ──
  Ticket:               mongoose.model('Ticket',               TicketSchema),
  SuperAdminTicket:     mongoose.model('SuperAdminTicket',     SuperAdminTicketSchema),
  Announcement:         mongoose.model('Announcement',         AnnouncementSchema),
  Notification:         mongoose.model('Notification',         NotificationSchema),

  // ── Config ──
  ApiConfig:            mongoose.model('ApiConfig',            ApiConfigSchema),
};