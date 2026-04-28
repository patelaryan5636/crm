// ─────────────────────────────────────────────────────────────
// ROLE-DEPARTMENT MAP — Single source of truth
// Consumed by: bulkUserUpload.service, user.controller, user.validator
// NEVER duplicate this object in individual files.
// ─────────────────────────────────────────────────────────────

const ROLE_DEPARTMENT_MAP = {
  SALES:      ['SALES_MANAGER',      'SALES_TL',       'SALES_EXECUTIVE'],
  FINANCE:    ['FINANCE_MANAGER',    'FINANCE_EXECUTIVE'],
  MANAGEMENT: ['MANAGEMENT_MANAGER', 'MANAGEMENT_TL',  'MANAGEMENT_EMPLOYEE'],
};

// Roles that can NEVER be assigned via any bulk or manual user-create flow
const RESTRICTED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

// Flat list of every role that IS allowed in bulk/manual create (all non-restricted)
const ALLOWED_BULK_ROLES = Object.values(ROLE_DEPARTMENT_MAP).flat();

module.exports = {
  ROLE_DEPARTMENT_MAP,
  RESTRICTED_ROLES,
  ALLOWED_BULK_ROLES,
};
