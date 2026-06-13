import { useState, useEffect } from "react";
import {
  Heading, DashGrid, EnhancedDashCard, GBarChart, GColumnChart, GLineChart,
  DataTable, openModal, closeModal, Modal, ModalProfile, ModalData, ModalGrid, Button, DataField,
} from "../../../../components/shared/Common_Components";
import salesTargetService from "../../../../services/salesTargetService";
import { TrendingUp, Users, AlertTriangle, Eye, AlertOctagon, Star } from "lucide-react";
import toast from "react-hot-toast";

const KPI_ICONS = [
  <TrendingUp size={22} />, <Users size={22} />, <TrendingUp size={22} />,
  <TrendingUp size={22} />, <AlertTriangle size={22} />,
];

const LEADERBOARD_COLS = [
  { key: "rank",       label: "Rank" },
  { key: "name",       label: "Employee" },
  { key: "teamName",   label: "Team" },
  { key: "teamLeader", label: "Team Leader" },
  { key: "calls",      label: "Calls" },
  { key: "sales",      label: "Sales" },
  { key: "conversion", label: "Conversion %" },
  { key: "status",     label: "Status" },
];

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal target records
  const [viewRow, setViewRow] = useState(null);
  const [warnRow, setWarnRow] = useState(null);
  const [apprRow, setApprRow] = useState(null);
  const [warnMsg, setWarnMsg] = useState("");
  const [apprMsg, setApprMsg] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await salesTargetService.getPerformanceOverview();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load performance overview stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSendWarning = async () => {
    if (!warnRow || !warnMsg.trim()) return;
    try {
      setSendingAlert(true);
      await salesTargetService.sendPerformanceAlert({
        userId: warnRow.userId,
        type: "warning",
        message: warnMsg.trim(),
      });
      toast.success(`Warning sent to ${warnRow.name}`);
      setWarnMsg("");
      closeModal("perf-warn-modal");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send warning alert");
    } finally {
      setSendingAlert(false);
    }
  };

  const handleSendAppreciation = async () => {
    if (!apprRow || !apprMsg.trim()) return;
    try {
      setSendingAlert(true);
      await salesTargetService.sendPerformanceAlert({
        userId: apprRow.userId,
        type: "appreciation",
        message: apprMsg.trim(),
      });
      toast.success(`Appreciation sent to ${apprRow.name} 🎉`);
      setApprMsg("");
      closeModal("perf-appr-modal");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send appreciation");
    } finally {
      setSendingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a465a]" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">Loading performance metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center max-w-md mx-auto my-12 flex flex-col items-center gap-3">
        <div className="bg-rose-100 text-rose-600 p-3 rounded-full">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-slate-800 font-bold text-lg">Failed to Load Metrics</h3>
        <p className="text-slate-600 text-sm">{error}</p>
        <button
          onClick={loadOverview}
          className="mt-2 bg-[#2a465a] hover:bg-[#1e3240] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpiOverview, teamPerformanceData, empSalesData, callsVsSalesData, leaderboardRows } = data || {};

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <DashGrid cols={12} gap={4}>
        <Heading primaryText="Performance" secondaryText="Overview" size={12} />
        {kpiOverview && kpiOverview.map((k, i) => (
          <EnhancedDashCard
            key={k.title}
            title={k.title}
            value={k.value}
            icon={KPI_ICONS[i]}
            accentColor={k.accent}
            size={2.4} // Dynamic 5-column grid mapping cleanly on a 12-column layout (12 / 5 = 2.4)
          />
        ))}
      </DashGrid>

      {/* Charts Row 1 */}
      <DashGrid cols={12} gap={4}>
        <GBarChart
          title="Team-wise Performance"
          subtitle="Calls & Sales by team"
          data={teamPerformanceData || []}
          bars={[
            { key: "calls", label: "Calls", color: "#3b82f6" },
            { key: "sales", label: "Sales", color: "#22c55e" },
          ]}
          size={6}
          height={280}
        />
        <GColumnChart
          title="Employee-wise Sales"
          subtitle="Top performers"
          data={empSalesData || []}
          bars={[
            { key: "sales", label: "Sales", color: "#8b5cf6" },
            { key: "calls", label: "Calls", color: "#f59e0b" },
          ]}
          size={6}
          height={280}
        />
      </DashGrid>

      {/* Charts Row 2 */}
      <DashGrid cols={12} gap={4}>
        <GLineChart
          title="Calls vs Sales Trend"
          subtitle="Monthly comparison"
          data={callsVsSalesData || []}
          lines={[
            { key: "calls", label: "Calls", color: "#3b82f6" },
            { key: "sales", label: "Sales", color: "#22c55e" },
          ]}
          size={12}
          height={260}
        />
      </DashGrid>

      {/* Leaderboard */}
      <DataTable
        title="Leaderboard"
        columns={LEADERBOARD_COLS}
        rows={leaderboardRows || []}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Details",
            variant: "ghost",
            onClick: (row) => {
              setViewRow(row);
              openModal("perf-view-modal");
            },
          },
          {
            icon: <AlertOctagon size={15} />,
            tooltip: "Send Warning",
            variant: "danger",
            onClick: (row) => {
              setWarnRow(row);
              setWarnMsg("");
              openModal("perf-warn-modal");
            },
          },
          {
            icon: <Star size={15} />,
            tooltip: "Send Appreciation",
            variant: "primary",
            onClick: (row) => {
              setApprRow(row);
              setApprMsg("");
              openModal("perf-appr-modal");
            },
          },
        ]}
        size={12}
        pageSize={5}
        searchable
        exportable
        exportFileName="leaderboard"
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Active", "Inactive"] },
          {
            title: "Team",
            type: "select",
            key: "teamName",
            options: [...new Set((leaderboardRows || []).map((r) => r.teamName).filter(v => v && v !== "—"))],
          },
          {
            title: "Team Leader",
            type: "select",
            key: "teamLeader",
            options: [...new Set((leaderboardRows || []).map((r) => r.teamLeader).filter(v => v && v !== "—"))],
          },
        ]}
      />

      {/* ── View Modal ──────────────────────────────────────────────────────── */}
      <Modal id="perf-view-modal" title="Employee Details" size="md">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={viewRow.name}
              subtitle={`Rank #${viewRow.rank} · Team: ${viewRow.teamName || '—'} · TL: ${viewRow.teamLeader}`}
              meta={`Status: ${viewRow.status}`}
            />
            <ModalGrid title="Performance Stats" cols={2}>
              <ModalData label="Calls Made"      value={viewRow.calls} />
              <ModalData label="Sales Won"       value={viewRow.sales} />
              <ModalData label="Conversion Rate" value={viewRow.conversion} />
              <ModalData label="Team"            value={viewRow.teamName || '—'} />
              <ModalData label="Team Leader"     value={viewRow.teamLeader} />
              <ModalData label="Status"          value={viewRow.status} />
            </ModalGrid>
            <div className="flex justify-end pt-2">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("perf-view-modal")} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Warning Modal ───────────────────────────────────────────────────── */}
      <Modal id="perf-warn-modal" title="Send Warning" size="md">
        {warnRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={warnRow.name}
              subtitle={`Rank #${warnRow.rank} · Team: ${warnRow.teamName || '—'}`}
              meta={`Conversion: ${warnRow.conversion}`}
            />
            <ModalGrid title="Performance Stats" cols={2}>
              <ModalData label="Calls" value={warnRow.calls} />
              <ModalData label="Sales" value={warnRow.sales} />
              <ModalData label="Status" value={warnRow.status} />
            </ModalGrid>
            <DataField
              label="Warning Message"
              id="warn-msg"
              type="textarea"
              rows={4}
              placeholder="Describe the performance issue and expected improvement..."
              value={warnMsg}
              onChange={(e) => setWarnMsg(e.target.value)}
              size={12}
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button text="Cancel" variant="ghost" size={3} onClick={() => closeModal("perf-warn-modal")} />
              <Button
                text={sendingAlert ? "Sending..." : "Send Warning"}
                variant="danger"
                size={4}
                disabled={!warnMsg.trim() || sendingAlert}
                onClick={handleSendWarning}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Appreciation Modal ──────────────────────────────────────────────── */}
      <Modal id="perf-appr-modal" title="Send Appreciation" size="md">
        {apprRow && (
          <div className="flex flex-col gap-4">
            <ModalProfile
              name={apprRow.name}
              subtitle={`Rank #${apprRow.rank} · Team: ${apprRow.teamName || '—'}`}
              meta={`Conversion: ${apprRow.conversion}`}
            />
            <ModalGrid title="Performance Stats" cols={2}>
              <ModalData label="Calls" value={apprRow.calls} />
              <ModalData label="Sales" value={apprRow.sales} />
              <ModalData label="Status" value={apprRow.status} />
            </ModalGrid>
            <DataField
              label="Appreciation Note"
              id="appr-msg"
              type="textarea"
              rows={4}
              placeholder="Write a personalised appreciation message..."
              value={apprMsg}
              onChange={(e) => setApprMsg(e.target.value)}
              size={12}
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button text="Cancel" variant="ghost" size={3} onClick={() => closeModal("perf-appr-modal")} />
              <Button
                text={sendingAlert ? "Sending..." : "Send Appreciation"}
                variant="primary"
                size={4}
                disabled={!apprMsg.trim() || sendingAlert}
                onClick={handleSendAppreciation}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
