import { useState } from "react";
import {
  Heading,
  DataTable,
  Modal,
  openModal,
  closeModal,
  ModalData,
  ModalGrid,
  Button,
  DashGrid,
  EnhancedDashCard,
} from "../../../components/shared/Common_Components";
import { toast } from "react-hot-toast";
import { Eye, Trash2, MailOpen, Mail, MessageSquare } from "lucide-react";

const queryCols = [
  { key: "name", label: "Name" },
  { key: "email", label: "Mail" },
  { key: "phone", label: "Phone" },
  { key: "message", label: "Message" },
  { key: "status", label: "Status" },
];

const initialQueries = [
  {
    id: "q-1",
    name: "Arjun Singhania",
    email: "arjun.s@google.com",
    phone: "+91 98765 43210",
    message:
      "Interested in the Enterprise plan for our company of 250+ users. Please share custom quote details and pricing sheet.",
    status: "Unread",
    date: "2026-06-11",
  },
  {
    id: "q-2",
    name: "Sarah Jenkins",
    email: "sarah.j@nexustech.io",
    phone: "+1 415 555 2671",
    message:
      "Experiencing trouble with API Webhook configurations. Are there code examples for Node.js integrations?",
    status: "Read",
    date: "2026-06-10",
  },
  {
    id: "q-3",
    name: "Vikram Malhotra",
    email: "vikram@malhotragroup.co.in",
    phone: "+91 88888 99999",
    message:
      "Do you offer on-premise deployments or custom data residency options for the CRM inside India?",
    status: "Unread",
    date: "2026-06-09",
  },
  {
    id: "q-4",
    name: "Elena Rostova",
    email: "elena.rostova@designlab.cc",
    phone: "+7 901 123 4567",
    message:
      "Is there an affiliate program or agency pricing model for styling client dashboards?",
    status: "Read",
    date: "2026-06-08",
  },
];

export default function Queries() {
  const [queries, setQueries] = useState(initialQueries);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [deleteQueryId, setDeleteQueryId] = useState(null);

  const handleToggleRead = (id) => {
    setQueries((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextStatus = q.status === "Read" ? "Unread" : "Read";
          toast.success(`Query marked as ${nextStatus}`);
          return { ...q, status: nextStatus };
        }
        return q;
      }),
    );
  };

  const handleDeleteQuery = () => {
    if (!deleteQueryId) return;
    setQueries((prev) => prev.filter((q) => q.id !== deleteQueryId));
    toast.success("Query deleted successfully");
    closeModal("query-delete-modal");
    setDeleteQueryId(null);
  };

  const actions = [
    {
      icon: <Eye size={15} />,
      tooltip: "View Detail",
      variant: "ghost",
      onClick: (row) => {
        setSelectedQuery(row);
        openModal("query-view-modal");
      },
    },
    {
      icon: <MailOpen size={15} />,
      tooltip: "Mark as Read",
      variant: "ghost",
      show: (row) => row.status === "Unread",
      onClick: (row) => handleToggleRead(row.id),
    },
    {
      icon: <Mail size={15} />,
      tooltip: "Mark as Unread",
      variant: "ghost",
      show: (row) => row.status === "Read",
      onClick: (row) => handleToggleRead(row.id),
    },
    {
      icon: <Trash2 size={15} />,
      tooltip: "Delete",
      variant: "danger",
      onClick: (row) => {
        setDeleteQueryId(row.id);
        openModal("query-delete-modal");
      },
    },
  ];

  const handleBulkMarkAsRead = (selectedRows) => {
    const idsToUpdate = selectedRows.map((row) => row.id);
    setQueries((prev) =>
      prev.map((q) =>
        idsToUpdate.includes(q.id) ? { ...q, status: "Read" } : q,
      ),
    );
    toast.success("Selected queries marked as Read");
  };

  const handleBulkDelete = (selectedRows) => {
    const idsToDelete = selectedRows.map((row) => row.id);
    setQueries((prev) => prev.filter((q) => !idsToDelete.includes(q.id)));
    toast.success("Selected queries deleted successfully");
  };

  const bulkActions = [
    {
      title: "Mark as Read",
      icon: <MailOpen size={13} />,
      onClick: (selectedRows) => handleBulkMarkAsRead(selectedRows),
    },
    {
      title: "Delete Selected",
      icon: <Trash2 size={13} />,
      onClick: (selectedRows) => handleBulkDelete(selectedRows),
    },
  ];

  const totalQueries = queries.length;
  const readQueries = queries.filter((q) => q.status === "Read").length;
  const unreadQueries = totalQueries - readQueries;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* Page Heading */}
      <Heading
        primaryText="Queries"
        secondaryText="Dashboard"
        size={12}
        fontSize="3xl"
        showAnimations={true}
      />

      {/* KPI Summary Cards */}
      <DashGrid cols={12} gap={4}>
        <EnhancedDashCard
          title="Total Queries"
          value={String(totalQueries)}
          icon={<MessageSquare size={22} />}
          accentColor="#3b82f6"
          size={4}
        />
        <EnhancedDashCard
          title="Read Queries"
          value={String(readQueries)}
          icon={<MailOpen size={22} />}
          accentColor="#22c55e"
          size={4}
        />
        <EnhancedDashCard
          title="Unread Queries"
          value={String(unreadQueries)}
          icon={<Mail size={22} />}
          accentColor="#f59e0b"
          size={4}
        />
      </DashGrid>

      {/* Queries Table */}
      <DataTable
        title="Contact Us Inquiries"
        ellipse={5}
        columns={queryCols}
        rows={queries}
        actions={actions}
        bulkAction={true}
        bulkActions={bulkActions}
        size={12}
        pageSize={5}
        searchable={true}
        exportable={true}
        exportFileName="contact_queries"
        filters={[
          {
            title: "Status",
            type: "toggle",
            key: "status",
            options: ["Read", "Unread"],
          },
        ]}
      />

      {/* View Details Modal */}
      <Modal id="query-view-modal" title="Query Inquiry Details" size="lg">
        {selectedQuery && (
          <div className="flex flex-col gap-5">
            <ModalGrid title="Sender Information" cols={2}>
              <ModalData label="Name" value={selectedQuery.name} />
              <ModalData label="Mail" value={selectedQuery.email} />
              <ModalData label="Phone" value={selectedQuery.phone} />
              <ModalData label="Date Received" value={selectedQuery.date} />
              <ModalData label="Status" value={selectedQuery.status} />
            </ModalGrid>

            <ModalGrid title="Inquiry Message" cols={1}>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-[#2a465a] leading-relaxed whitespace-pre-wrap font-medium">
                {selectedQuery.message}
              </div>
            </ModalGrid>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                text={
                  selectedQuery.status === "Read"
                    ? "Mark as Unread"
                    : "Mark as Read"
                }
                variant="primary"
                size={2}
                onClick={() => {
                  handleToggleRead(selectedQuery.id);
                  // Update current selected query view status locally
                  setSelectedQuery((prev) => ({
                    ...prev,
                    status: prev.status === "Read" ? "Unread" : "Read",
                  }));
                }}
              />
              <Button
                text="Close"
                variant="ghost"
                size={2}
                onClick={() => closeModal("query-view-modal")}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal id="query-delete-modal" title="Delete Inquiry" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete this query inquiry? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              text="Cancel"
              variant="ghost"
              size={2}
              onClick={() => {
                closeModal("query-delete-modal");
                setDeleteQueryId(null);
              }}
            />
            <Button
              text="Delete"
              variant="danger"
              size={2}
              onClick={handleDeleteQuery}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
