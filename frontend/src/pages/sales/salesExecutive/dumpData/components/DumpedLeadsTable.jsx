/**
 * DumpedLeadsTable — Sales Executive
 * Renders the dump leads data table with search, filter, export, and actions.
 * Restore is Manager/Admin only — not shown to Sales Executive.
 */
import { Eye } from 'lucide-react';
import { DataTable } from '../../../../../components/shared/Common_Components';
import { DUMPED_LEAD_COLUMNS } from '../utils/dumpDataConstants';

export function DumpedLeadsTable({ rows, reasonOptions, loading, onView }) {
  return (
    <DataTable
      title="Dumped Leads"
      columns={DUMPED_LEAD_COLUMNS}
      rows={rows}
      loading={loading}
      searchable
      exportable
      date={true}
      filters={[
        {
          title: 'Reason',
          type: 'toggle',
          key: 'dumpReason',
          options: reasonOptions,
        },
      ]}
      actions={[
        {
          icon: <Eye size={15} />,
          tooltip: 'View Details',
          variant: 'ghost',
          onClick: onView,
        },
      ]}
      size={12}
      pageSize={8}
      pageSizeOptions={[8, 12, 20]}
    />
  );
}
