import { useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Ticket,
} from "lucide-react";

import {
  Button,
  EnhancedDashCard,
  DataTable,
  Grid,
  Heading,
  Modal,
  ModalData,
  closeModal,
  openModal,
} from "../../../components/shared/Common_Components";
import { getSupportTickets, updateTicketStatus } from "../../../services/superAdminService";

const mapBackendTicket = (t) => ({
  id: t._id,
  ticketId: `SUP-${t._id.slice(-4).toUpperCase()}`,
  requester: t.raisedBy?.name || "Unknown",
  company: t.raisedBy?.company?.name || "—",
  subject: t.subject,
  priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase(),
  status: t.status === 'OPEN' ? 'Opened' : t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase(),
  createdAt: new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  lastUpdate: new Date(t.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  description: t.message,
  email: t.raisedBy?.email || "—",
  category: "General",
  conversation: (t.replies || []).map(r => ({
    sender: r.senderType === 'SUPER_ADMIN' ? 'Super Admin' : (t.raisedBy?.name || 'Admin'),
    time: new Date(r.createdAt).toLocaleString(),
    message: r.message
  }))
});

const ticketColumns = [
  { key: "requester", label: "Requester" },
  { key: "company",   label: "Company"   },
  { key: "subject",   label: "Subject"   },
  { key: "priority",  label: "Priority"  },
  { key: "status",    label: "Status"    },
  { key: "createdAt", label: "Created"   },
];


export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await getSupportTickets();
      setTickets((res.tickets || []).map(mapBackendTicket));
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const sortedTickets = useMemo(() => {
    const getPriorityWeight = (priority) => {
      if (!priority) return 2;
      const p = priority.toUpperCase();
      if (p === 'CRITICAL' || p === 'URGENT' || p === 'HIGH') return 3;
      if (p === 'MEDIUM' || p === 'NORMAL') return 2;
      if (p === 'LOW') return 1;
      return 2;
    };

    const sortFn = (a, b) => {
      const weightA = getPriorityWeight(a.priority);
      const weightB = getPriorityWeight(b.priority);
      if (weightB !== weightA) return weightB - weightA;
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    };

    return [...tickets].sort(sortFn);
  }, [tickets]);

  const stats = useMemo(() => {
    const openedTickets = tickets.filter((ticket) => ticket.status === "Opened" || ticket.status === "Open" || ticket.status === "In Progress");
    const highPriority = tickets.filter((ticket) => ticket.priority === "High" || ticket.priority === "Urgent");
    const closedTickets = tickets.filter((ticket) => ticket.status === "Closed" || ticket.status === "Resolved");

    return {
      total: tickets.length,
      opened: openedTickets.length,
      high: highPriority.length,
      closed: closedTickets.length,
    };
  }, [tickets]);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    openModal("support-ticket-details");
  };

  const handleCloseTicket = async (ticket) => {
    try {
      await updateTicketStatus(ticket.id, "CLOSED", "Ticket closed by Super Admin.");
      await fetchTickets();
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(prev => ({ ...prev, status: "Closed", lastUpdate: "Just now" }));
      }
    } catch (err) {
      console.error("Failed to close ticket:", err);
    }
  };

  const actions = [
    {
      icon: <Eye size={15} />,
      tooltip: "View Details",
      variant: "ghost",
      onClick: (row) => handleViewTicket(row),
    },
    {
      icon: <CheckCircle2 size={15} />,
      tooltip: "Close Ticket",
      variant: "primary",
      show: (row) => row.status !== "Closed",
      onClick: (row) => handleCloseTicket(row),
    },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      <Grid cols={12} gap={5}>
        <Heading
          primaryText="Support Ticket"
          secondaryText="Management"
          size={12}
        />

        <EnhancedDashCard
          title="Total Tickets"
          value={String(stats.total)}
          icon={<Ticket size={22} />}
          accentColor="#2563eb"
          size={3}
        />
        <EnhancedDashCard
          title="Open Tickets"
          value={String(stats.opened)}
          icon={<Clock3 size={22} />}
          accentColor="#f59e0b"
          size={3}
        />
        <EnhancedDashCard
          title="High Priority"
          value={String(stats.high)}
          icon={<AlertTriangle size={22} />}
          accentColor="#e11d48"
          size={3}
        />
        <EnhancedDashCard
          title="Closed"
          value={String(stats.closed)}
          icon={<CheckCircle2 size={22} />}
          accentColor="#16a34a"
          size={3}
        />

        <DataTable
          title="Admin Support Tickets"
          columns={ticketColumns}
          rows={sortedTickets}
          actions={actions}
          size={12}
          pageSize={5}
          searchable
          exportable
          exportFileName="support-tickets"
          defaultSortKey={null}
          loading={loading}
          filters={[
            { title: "Status",   type: "toggle", key: "status",   options: ["Opened", "Closed", "In Progress", "Resolved"] },
            { title: "Priority", type: "toggle", key: "priority", options: ["High", "Medium", "Low"] },
            { title: "Category", type: "toggle", key: "category", options: ["General"] },
          ]}
        />
      </Grid>

      <Modal id="support-ticket-details" title="Support Ticket Details">
        {selectedTicket && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ModalData label="Status" value={selectedTicket.status} />
              <ModalData label="Name" value={selectedTicket.requester} />
              <ModalData label="Company Name" value={selectedTicket.company} />
              <ModalData label="Priority" value={selectedTicket.priority} />
              <ModalData label="Category" value={selectedTicket.category} />
              <ModalData label="Last Update" value={selectedTicket.lastUpdate} />
            </div>
            <ModalData label="Subject" value={selectedTicket.subject} />
            <div>
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Description
              </span>
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium leading-6 text-[#2a465a]">
                {selectedTicket.description}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              {selectedTicket.status !== "Closed" && (
                <Button
                  text="Close Ticket"
                  variant="primary"
                  onClick={() => {
                    handleCloseTicket(selectedTicket);
                  }}
                />
              )}
              <Button
                text="Close"
                variant="ghost"
                onClick={() => closeModal("support-ticket-details")}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
