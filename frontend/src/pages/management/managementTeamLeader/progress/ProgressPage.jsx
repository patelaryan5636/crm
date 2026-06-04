import { useState } from "react";
import { Eye, Filter, PencilLine } from "lucide-react";
import {
  Button,
  DataField,
  DataTable,
  GBarChart,
  GColumnChart,
  Grid,
  Heading,
  Modal,
  ModalData,
  ModalGrid,
  Option,
  SelectField,
  closeModal,
  openModal,
} from "../../../../components/shared/Common_Components";
import ProgressStats from "./components/ProgressStats";
import {
  completedPendingProjects,
  delayQualityData,
  employeeProgressRows,
  filterOptions,
  teamActivityRows,
} from "./data/progressData";

const progressColumns = [
  { key: "task", label: "Task" },
  { key: "project", label: "Project" },
  { key: "employee", label: "Employee" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress" },
  { key: "priority", label: "Priority" },
  { key: "deadline", label: "Deadline" },
  { key: "lastUpdate", label: "Last Update" },
];

const activityColumns = [
  { key: "time", label: "Time" },
  { key: "employee", label: "Employee" },
  { key: "activity", label: "Activity" },
  { key: "project", label: "Project" },
  { key: "status", label: "Status" },
];

export default function ProgressPage() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    employee: "All",
    status: "All",
    priority: "All",
  });

  const updateFilter = (key) => (event) => {
    setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      employee: "All",
      status: "All",
      priority: "All",
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <Heading
        primaryText="Team Progress"
        secondaryText="Tracking"
        showAnimations
      />

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#243b53] text-white shadow-sm">
              <Filter size={17} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#243b53]">Global Filters</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">This Week</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Task Status</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">Delays Included</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <Grid cols={12} gap={3}>
            <DataField label="Date From" type="date" size={2} value={filters.dateFrom} onChange={updateFilter("dateFrom")} />
            <DataField label="Date To" type="date" size={2} value={filters.dateTo} onChange={updateFilter("dateTo")} />
            <SelectField
              label="Employee"
              id="mtl-progress-employee"
              size={3}
              searchable={false}
              placeholder="All employees"
              value={filters.employee}
              onChange={updateFilter("employee")}
            >
              {filterOptions.employees.map((item) => <Option key={item} value={item} label={item} />)}
            </SelectField>
            <SelectField
              label="Task Status"
              id="mtl-progress-status"
              size={3}
              searchable={false}
              placeholder="All statuses"
              value={filters.status}
              onChange={updateFilter("status")}
            >
              {filterOptions.statuses.map((item) => <Option key={item} value={item} label={item} />)}
            </SelectField>
            <SelectField
              label="Priority"
              id="mtl-progress-priority"
              size={2}
              searchable={false}
              placeholder="Any"
              value={filters.priority}
              onChange={updateFilter("priority")}
            >
              {filterOptions.priorities.map((item) => <Option key={item} value={item} label={item} />)}
            </SelectField>
          </Grid>
          <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3">
            <div className="w-full sm:w-32">
              <Button text="Reset" variant="ghost" onClick={resetFilters} />
            </div>
            <div className="w-full sm:w-40">
              <Button text="Apply Filters" variant="primary" />
            </div>
          </div>
        </div>
      </section>

      <ProgressStats />

      <Grid cols={12} gap={6}>
        <GColumnChart
          title="Completed vs Pending Tasks"
          subtitle="Employee-wise task completion status"
          data={completedPendingProjects}
          bars={[
            { key: "completed", label: "Completed", color: "#16a34a" },
            { key: "pending", label: "Pending", color: "#f59e0b" },
          ]}
          size={6}
          height={320}
        />
        <GBarChart
          title="Delays & Quality Issues"
          subtitle="Tasks needing attention"
          data={delayQualityData}
          bars={[
            { key: "delays", label: "Delay Days", color: "#dc2626" },
            { key: "qualityIssues", label: "Quality Issues", color: "#7c3aed" },
          ]}
          size={6}
          height={320}
        />
      </Grid>

      <DataTable
        title="Employee Task Progress"
        columns={progressColumns}
        rows={employeeProgressRows}
        size={12}
        pageSize={8}
        searchable
        filters={[
          { title: "Status", type: "toggle", key: "status", options: ["Completed", "In Progress", "Not Started", "Delayed"] },
          { title: "Priority", type: "toggle", key: "priority", options: ["Low", "Medium", "High", "Critical"] },
        ]}
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Progress",
            variant: "ghost",
            onClick: (row) => {
              setSelectedProject(row);
              openModal("mtl-progress-project-details");
            },
          },
          {
            icon: <PencilLine size={15} />,
            tooltip: "Update Progress",
            variant: "primary",
            onClick: (row) => {
              setSelectedProject(row);
              openModal("mtl-progress-update-project");
            },
          },
        ]}
      />

      <DataTable
        title="Team Activity"
        columns={activityColumns}
        rows={teamActivityRows}
        size={12}
        pageSize={5}
        searchable
      />

      <Modal id="mtl-progress-project-details" title="Task Progress Details" size="lg">
        {selectedProject && (
          <ModalGrid>
            <ModalData label="Task" value={selectedProject.task} />
            <ModalData label="Project" value={selectedProject.project} />
            <ModalData label="Employee" value={selectedProject.employee} />
            <ModalData label="Status" value={selectedProject.status} />
            <ModalData label="Progress" value={selectedProject.progress} />
            <ModalData label="Priority" value={selectedProject.priority} />
            <ModalData label="Deadline" value={selectedProject.deadline} />
            <ModalData label="Last Update" value={selectedProject.lastUpdate} />
          </ModalGrid>
        )}
      </Modal>

      <Modal id="mtl-progress-update-project" title="Update Task Progress" size="md">
        <Grid cols={12} gap={3}>
          <DataField label="Task" size={12} value={selectedProject?.task || ""} readOnly />
          <DataField label="Project" size={6} value={selectedProject?.project || ""} readOnly />
          <DataField label="Assigned Employee" size={6} value={selectedProject?.employee || ""} readOnly />
          <DataField label="Progress %" type="number" size={6} placeholder="0" />
          <SelectField label="Status" id="mtl-progress-update-status" size={6} placeholder="Select status">
            <Option value="Completed" label="Completed" />
            <Option value="In Progress" label="In Progress" />
            <Option value="Not Started" label="Not Started" />
            <Option value="Delayed" label="Delayed" />
          </SelectField>
          <DataField label="Update Notes" type="textarea" size={12} rows={4} placeholder="Add progress notes, blockers, or concerns..." />
        </Grid>
        <div className="mt-5 flex justify-end gap-2">
          <Button text="Cancel" variant="secondary" onClick={() => closeModal("mtl-progress-update-project")} />
          <Button text="Update" variant="primary" onClick={() => closeModal("mtl-progress-update-project")} />
        </div>
      </Modal>
    </div>
  );
}
