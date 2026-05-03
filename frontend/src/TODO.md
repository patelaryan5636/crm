# CRM Leave History & Work Summary Fixes - TODO

**Current Progress:** 0/5 ✅

## Planned Steps (Approved Plan)

### 1. ✅ Create this TODO.md (current step)

### 2. Edit `crm/frontend/src/pages/sales/salesExecutive/hrm/LeaveForm.jsx`
- Remove custom `{ key: "action", ... }` column from `leaveCols`.
- Add `actions` prop to `<DataTable>`:
  ```
  actions={[
    {
      icon: <BadgeCheck size={15} />,
      tooltip: "Approve Leave",
      variant: "primary",
      onClick: (r) => setLeaves(prev => prev.map(x => x.id === r.id ? { ...x, status: "Approved" } : x))
    }
  ]}
  ```
- Ensure dates visible (add `min-w-[120px] whitespace-normal` to From/To renders if truncated).

### 3. Edit `crm/frontend/src/pages/sales/salesExecutive/hrm/HRMPage.jsx`
- In Work Summary DashGrid, change AVG / DAY:
  ```
  <EnhancedDashCard title="AVG / DAY" value={`${WORK_SUMMARY.avgPerDay}d`} ... />
  ```
- Verify `WORK_SUMMARY.avgPerDay` computation (already (totalMins / days / 60).toFixed(2)).

### 4. Verify `crm/frontend/src/pages/sales/salesManager/HRM/Leaves.jsx`
- Actions already use tooltips (historyActions has Accept/Reject).
- Test dateRange column visibility; add CSS if truncated.

### 5. Test Changes
- Run dev server.
- Check sales executive HRM: Leave History dates visible, Approve tooltip/action works.
- Check Work Summary: AVG / DAY shows "Xd" (days).
- Check manager Leaves: tooltips functional.

### 6. Mark Complete
- Update this TODO.md ✅ all steps.
- attempt_completion.

**Next Step:** Edit LeaveForm.jsx

