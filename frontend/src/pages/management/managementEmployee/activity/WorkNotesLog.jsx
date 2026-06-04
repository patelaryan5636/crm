import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import {
  DataTable,
  DataField,
  SelectField,
  Option,
  Button,
  Modal,
  Grid,
  openModal,
  closeModal,
} from "../../../../components/shared/Common_Components.jsx";
import { myProjects } from "../managementEmployeeStore";
import { addWorkNote } from "./activityStore";
import ProjectActivityDrawer, { DRAWER_MODAL_ID } from "./components/ProjectActivityDrawer";

const COLS = [
  { key: "date",        label: "Date"      },
  { key: "projectId",   label: "Proj ID"   },
  { key: "projectName", label: "Project"   },
  { key: "author",      label: "Author"    },
  { key: "body",        label: "Work Note" },
];

const BLANK_FORM = { projectId: "", body: "", isClientVisible: true };

export default function WorkNotesLog() {
  const { activityState, setActivityState } = useOutletContext();
  const [selectedProject, setSelectedProject] = useState(null);

  const [form, setForm]       = useState(BLANK_FORM);
  const [formErr, setFormErr] = useState({});

  const flatNotes = myProjects.flatMap((p) =>
    (activityState.workNotesByProject[p.id] ?? []).map((n) => ({
      ...n,
      projectId: p.id,
      projectName: p.name,
      body: n.body.length > 60 ? n.body.slice(0, 60) + "…" : n.body,
    }))
  ).sort((a, b) => (a.date < b.date ? 1 : -1));

  const openDrawer = (row) => {
    const proj = myProjects.find((p) => p.id === row.projectId);
    if (proj) { setSelectedProject(proj); openModal(DRAWER_MODAL_ID); }
  };

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (formErr[k]) setFormErr((e) => ({ ...e, [k]: "" }));
  };

  const openCreate = () => {
    setForm(BLANK_FORM);
    setFormErr({});
    openModal("me-create-worknote");
  };

  const submitCreate = () => {
    const errs = {};
    if (!form.projectId)     errs.projectId = "Select a project.";
    if (!form.body.trim())   errs.body      = "Work note body is required.";
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setActivityState((prev) =>
      addWorkNote(prev, form.projectId, form.body.trim(), form.isClientVisible)
    );
    setForm(BLANK_FORM);
    closeModal("me-create-worknote");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          text="+ Add Work Note"
          variant="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
        />
      </div>

      <DataTable
        title="Work Notes Log"
        columns={COLS}
        rows={flatNotes}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="work_notes_log"
        actions={[
          {
            icon: <Eye size={15} />,
            tooltip: "View Thread",
            variant: "ghost",
            onClick: openDrawer,
          },
        ]}
      />

      <ProjectActivityDrawer
        project={selectedProject}
        activityState={activityState}
        setActivityState={setActivityState}
      />

      {/* ── Create Work Note modal ──────────────────────────────────────── */}
      <Modal id="me-create-worknote" title="Add Work Note" size="md">
        <div className="flex flex-col gap-4">
          <Grid cols={12} gap={3}>
            <div className="col-span-12">
              <SelectField
                label="Project *"
                id="me-create-note-project"
                value={form.projectId}
                onChange={(e) => setField("projectId", e.target.value)}
              >
                <Option value="" label="— Select project —" />
                {myProjects.map((p) => (
                  <Option key={p.id} value={p.id} label={`${p.id} · ${p.name}`} />
                ))}
              </SelectField>
              {formErr.projectId && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.projectId}</p>}
            </div>

            <div className="col-span-12">
              <DataField
                label="Work Note *"
                id="me-create-note-body"
                type="textarea"
                rows={5}
                placeholder="What did you complete? What's blocked?"
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
              />
              {formErr.body && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.body}</p>}
            </div>

            <div className="col-span-12">
              <label className="flex items-start gap-2 px-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={form.isClientVisible}
                  onChange={(e) => setField("isClientVisible", e.target.checked)}
                />
                <span>
                  Show on the <b>public project tracking page</b>.
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Uncheck for internal-only notes (your TL and Manager will still see them).
                  </span>
                </span>
              </label>
            </div>
          </Grid>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button text="Cancel"        variant="secondary" onClick={() => closeModal("me-create-worknote")} />
            <Button text="Add Work Note" variant="primary"   onClick={submitCreate} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
