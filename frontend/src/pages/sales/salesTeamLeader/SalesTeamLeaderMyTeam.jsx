import { useState } from "react";
import {
  Grid,
  Heading,
  Select,
  Option,
  Button,
  DataTable,
  DashCard,
  GRadarChart,
  GPieChart,
  GAreaChart,
  Modal,
  ModalData,
  ModalProfile,
  ModalGrid,
  openModal,
  closeModal,
} from "../../../components/shared/Common_Components.jsx";
import {
  Users,
  UserCheck,
  UserX,
  Target,
  Eye,
} from "lucide-react";

// ── Static Team Data ──────────────────────────────────────────────────────────
const initialTeamData = [
  {
    id: 1,
    name: "Arbaz Khan",
    email: "arbaz@crm.com",
    phone: "9876543210",
    role: "Executive",
    leads: 45,
    closedLeads: 17,
    followUps: 28,
    conversion: "38%",
    status: "Active",
    revenue: 182000,
    joinDate: "12 Jan 2023",
    address: "Sector 5, Noida, UP",
    manager: "Ravi Sharma",
    target: 200000,
    notes: "Consistent top performer in Q1 and Q2.",
    lastLogin: "Today, 9:45 AM",
  },
  {
    id: 2,
    name: "Priya Mehta",
    email: "priya@crm.com",
    phone: "9123456780",
    role: "TL",
    leads: 62,
    closedLeads: 32,
    followUps: 18,
    conversion: "51%",
    status: "Active",
    revenue: 310000,
    joinDate: "3 Mar 2022",
    address: "Indiranagar, Bengaluru, KA",
    manager: "Ravi Sharma",
    target: 350000,
    notes: "Team lead with excellent client retention.",
    lastLogin: "Today, 10:12 AM",
  },
  {
    id: 3,
    name: "Rohan Verma",
    email: "rohan@crm.com",
    phone: "9988776655",
    role: "Executive",
    leads: 28,
    closedLeads: 6,
    followUps: 14,
    conversion: "22%",
    status: "Inactive",
    revenue: 64000,
    joinDate: "19 Jul 2023",
    address: "Koramangala, Bengaluru, KA",
    manager: "Priya Mehta",
    target: 150000,
    notes: "On performance improvement plan since Q3.",
    lastLogin: "2 days ago",
  },
  {
    id: 4,
    name: "Sneha Joshi",
    email: "sneha@crm.com",
    phone: "9012345678",
    role: "Executive",
    leads: 53,
    closedLeads: 24,
    followUps: 21,
    conversion: "45%",
    status: "Active",
    revenue: 240000,
    joinDate: "5 Sep 2022",
    address: "Powai, Mumbai, MH",
    manager: "Priya Mehta",
    target: 280000,
    notes: "Strong closer — excels in product demos.",
    lastLogin: "Today, 8:30 AM",
  },
  {
    id: 5,
    name: "Karan Desai",
    email: "karan@crm.com",
    phone: "9871234560",
    role: "TL",
    leads: 71,
    closedLeads: 41,
    followUps: 15,
    conversion: "58%",
    status: "Active",
    revenue: 415000,
    joinDate: "22 Feb 2021",
    address: "Andheri West, Mumbai, MH",
    manager: "Ravi Sharma",
    target: 400000,
    notes: "Highest revenue generator for 3 consecutive quarters.",
    lastLogin: "Today, 11:00 AM",
  },
  {
    id: 6,
    name: "Divya Nair",
    email: "divya@crm.com",
    phone: "9654321098",
    role: "Executive",
    leads: 34,
    closedLeads: 10,
    followUps: 19,
    conversion: "29%",
    status: "Active",
    revenue: 98000,
    joinDate: "10 Nov 2023",
    address: "Thrissur, Kerala, KL",
    manager: "Karan Desai",
    target: 150000,
    notes: "New joiner with promising pipeline.",
    lastLogin: "Yesterday, 5:00 PM",
  },
  {
    id: 7,
    name: "Amit Soni",
    email: "amit@crm.com",
    phone: "9745612380",
    role: "Executive",
    leads: 19,
    closedLeads: 3,
    followUps: 11,
    conversion: "16%",
    status: "Inactive",
    revenue: 31000,
    joinDate: "8 Aug 2023",
    address: "Vaishali Nagar, Jaipur, RJ",
    manager: "Karan Desai",
    target: 100000,
    notes: "Struggling with lead qualification — coaching in progress.",
    lastLogin: "3 days ago",
  },
  {
    id: 8,
    name: "Fatima Sheikh",
    email: "fatima@crm.com",
    phone: "9876001234",
    role: "Executive",
    leads: 48,
    closedLeads: 20,
    followUps: 22,
    conversion: "41%",
    status: "Active",
    revenue: 195000,
    joinDate: "15 Jun 2022",
    address: "Banjara Hills, Hyderabad, TS",
    manager: "Priya Mehta",
    target: 220000,
    notes: "Highly organized; known for follow-up discipline.",
    lastLogin: "Today, 9:00 AM",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function SalesTeamLeaderMyTeam() {
  const [teamData, setTeamData]             = useState(initialTeamData);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterRole, setFilterRole]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("");

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalMembers    = teamData.length;
  const activeMembers   = teamData.filter((m) => m.status === "Active").length;
  const inactiveMembers = teamData.filter((m) => m.status === "Inactive").length;
  const totalLeads      = teamData.reduce((s, m) => s + m.leads, 0);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const radarData = teamData.slice(0, 6).map((m) => ({
    subject: m.name.split(" ")[0],
    leads: m.leads,
    closed: m.closedLeads,
  }));

  const pieData = [
    { name: "Executive", value: teamData.filter((m) => m.role === "Executive").length },
    { name: "TL",        value: teamData.filter((m) => m.role === "TL").length },
  ];

  const areaData = teamData.map((m) => ({
    name: m.name.split(" ")[0],
    followUps: m.followUps,
    closedLeads: m.closedLeads,
  }));

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filteredRows = teamData.filter((m) => {
    const roleOk   = !filterRole   || m.role   === filterRole;
    const statusOk = !filterStatus || m.status === filterStatus;
    return roleOk && statusOk;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleView = (row) => {
    setSelectedMember(row);
    openModal("member-detail-modal");
  };

  return (
    <Grid cols={12} gap={4}>

      {/* ── 1. Page Heading ───────────────────────────────────────────────── */}
      <Heading
        primaryText="My Team"
        secondaryText="Manage your team members and performance"
        size={12}
      />

      {/* ── 2. Summary Cards — 4 × size=3 ──────────────────────────────── */}
      <DashCard
        title="Total Members"
        value={String(totalMembers)}
        icon={<Users size={22} />}
        accentColor="#3b82f6"
        size={3}
      />
      <DashCard
        title="Active Members"
        value={String(activeMembers)}
        icon={<UserCheck size={22} />}
        accentColor="#22c55e"
        size={3}
      />
      <DashCard
        title="Inactive Members"
        value={String(inactiveMembers)}
        icon={<UserX size={22} />}
        accentColor="#f43f5e"
        size={3}
      />
      <DashCard
        title="Total Leads"
        value={String(totalLeads)}
        icon={<Target size={22} />}
        accentColor="#f59e0b"
        size={3}
      />

      {/* ── 3. Table section ─────────────────────────────────────────────── */}
      <div className="col-span-12 bg-[#efefefb1] rounded-xl p-3 flex flex-col gap-3">

        {/* Table section title */}
        <h2 className="text-xl font-black text-[#2a465a] tracking-tight">
          Team Members <span className="text-slate-400 font-extrabold">Data table</span>
        </h2>

        {/* CHANGE 3: Filters sit INSIDE the table section, LEFT side, ABOVE the DataTable
            Layout: [ Filter by Role ] [ Filter by Status ] [ Clear ]   — — —   (DataTable renders search on right internally) */}
        <div className="flex flex-wrap items-end gap-3">

          {/* Filter by Role */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
              Filter by Role
            </label>
            <Select
              id="filter_role"
              size={12}
              value={filterRole}
              searchable={false}
              placeholder="All Roles"
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <Option value=""          label="All Roles"   />
              <Option value="Executive" label="Executive"   />
              <Option value="TL"        label="Team Leader" />
            </Select>
          </div>

          {/* Filter by Status */}
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
              Filter by Status
            </label>
            <Select
              id="filter_status"
              size={12}
              value={filterStatus}
              searchable={false}
              placeholder="All Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <Option value=""         label="All Status" />
              <Option value="Active"   label="Active"     />
              <Option value="Inactive" label="Inactive"   />
            </Select>
          </div>

        </div>

        {/* CHANGE 4: Only View (👁) action — Edit, Delete, toggle pill removed */}
        <DataTable
          searchable={true}
          pageSize={5}
          pageSizeOptions={[5, 10, 25, 50]}
          columns={[
            { key: "name",       label: "Employee" },
            { key: "role",       label: "Role"     },
            { key: "leads",      label: "Leads"    },
            { key: "conversion", label: "Conv %"   },
            { key: "status",     label: "Status"   },
          ]}
          rows={filteredRows}
          actions={[
            {
              icon: <Eye size={15} />,
              tooltip: "View Details",
              variant: "primary",
              onClick: handleView,
            },
          ]}
          size={12}
        />
      </div>

      {/* ── 4. Charts — GAreaChart full width on top, Radar + Pie side by side below */}
      <GAreaChart
        title="Follow-ups & Closed Leads"
        subtitle="Activity per member"
        data={areaData}
        areas={[
          { key: "followUps",   label: "Follow-ups",   color: "#38bdf8" },
          { key: "closedLeads", label: "Closed Leads", color: "#22c55e" },
        ]}
        stacked={false}
        size={12}
        height={280}
      />

      <GRadarChart
        title="Team Skill Overview"
        subtitle="Leads opened vs closed"
        data={radarData}
        radars={[
          { key: "leads",  label: "Leads",  color: "#3b82f6" },
          { key: "closed", label: "Closed", color: "#f43f5e" },
        ]}
        size={6}
        height={300}
      />

      <GPieChart
        title="Role Distribution"
        subtitle="Executives vs Team Leaders"
        data={pieData}
        colors={["#3b82f6", "#f59e0b"]}
        size={6}
        height={300}
      />

      {/* ── 5. CHANGE 5+6: Medium-size Modal (size="lg" → max-w-2xl ~672px)
               Content in 2-column ModalGrid layout ─────────────────────── */}
      <Modal id="member-detail-modal" title="Member Profile" size="lg">
        {selectedMember && (
          <div className="flex flex-col gap-4">

            {/* Profile banner */}
            <ModalProfile
              name={selectedMember.name}
              subtitle={`${selectedMember.role} · ${selectedMember.address}`}
              meta={`Joined ${selectedMember.joinDate} · Last login: ${selectedMember.lastLogin}`}
              avatarColor="#2a465a"
            />

            <ModalGrid title="Employee Info" cols={2}>
              <ModalData label="Employee Name" value={selectedMember.name}   />
              <ModalData label="Role"          value={selectedMember.role}   />
              <ModalData label="Status"        value={selectedMember.status} />
              <ModalData label="Join Date"     value={selectedMember.joinDate} />
            </ModalGrid>

            <ModalGrid title="Lead Statistics" cols={2}>
              <ModalData label="Total Leads"  value={String(selectedMember.leads)}       />
              <ModalData label="Active Leads" value={String(selectedMember.closedLeads)} />
              <ModalData label="Conversion %"  value={selectedMember.conversion}         />
              <ModalData label="Follow-ups"    value={String(selectedMember.followUps)}  />
            </ModalGrid>

            {/* Close */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                text="Close"
                variant="secondary"
                size={3}
                onClick={() => closeModal("member-detail-modal")}
              />
            </div>

          </div>
        )}
      </Modal>

    </Grid>
  );
}