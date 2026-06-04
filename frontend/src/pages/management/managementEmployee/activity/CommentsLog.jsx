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
import { addComment } from "./activityStore";
import ProjectActivityDrawer, { DRAWER_MODAL_ID } from "./components/ProjectActivityDrawer";

const COLS = [
  { key: "date",        label: "Date"    },
  { key: "projectId",   label: "Proj ID" },
  { key: "projectName", label: "Project" },
  { key: "author",      label: "Author"  },
  { key: "body",        label: "Comment" },
];

const BLANK_FORM = { projectId: "", body: "" };

export default function CommentsLog() {
  const { activityState, setActivityState } = useOutletContext();
  const [selectedProject, setSelectedProject] = useState(null);

  const [form, setForm]       = useState(BLANK_FORM);
  const [formErr, setFormErr] = useState({});

  // Recompute the flat list from the lifted store so it reacts to mutations
  // made from either tab or the drawer.
  const flatComments = myProjects.flatMap((p) =>
    (activityState.commentsByProject[p.id] ?? []).map((c) => ({
      ...c,
      projectId: p.id,
      projectName: p.name,
      body: c.body.length > 60 ? c.body.slice(0, 60) + "…" : c.body,
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
    openModal("me-create-comment");
  };

  const submitCreate = () => {
    const errs = {};
    if (!form.projectId)   errs.projectId = "Select a project.";
    if (!form.body.trim()) errs.body      = "Comment is required.";
    if (Object.keys(errs).length) { setFormErr(errs); return; }

    setActivityState((prev) => addComment(prev, form.projectId, form.body.trim()));
    setForm(BLANK_FORM);
    closeModal("me-create-comment");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          text="+ Add Comment"
          variant="primary"
          icon={<Plus size={15} />}
          onClick={openCreate}
        />
      </div>

      <DataTable
        title="Comments Log"
        columns={COLS}
        rows={flatComments}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="comments_log"
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

      {/* ── Create Comment modal ──────────────────────────────────────── */}
      <Modal id="me-create-comment" title="Add Comment" size="md">
        <div className="flex flex-col gap-4">
          <Grid cols={12} gap={3}>
            <div className="col-span-12">
              <SelectField
                label="Project *"
                id="me-create-comment-project"
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
                label="Comment *"
                id="me-create-comment-body"
                type="textarea"
                rows={4}
                placeholder="Quick note for your TL or your own log…"
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
              />
              {formErr.body && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.body}</p>}
            </div>
          </Grid>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button text="Cancel"      variant="secondary" onClick={() => closeModal("me-create-comment")} />
            <Button text="Add Comment" variant="primary"   onClick={submitCreate} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
