import { useEffect, useMemo, useState } from "react";
import {
  Heading,
  DashGrid,
  Grid,
  DataField,
  SelectField,
  Option,
  DataTable,
  Button,
  Modal,
  openModal,
  closeModal,
  ModalData,
  ModalGrid,
} from "../../../components/shared/Common_Components.jsx";
import DatePicker from "../../../components/shared/DatePicker.jsx";
import { Eye, Loader2 } from "lucide-react";
import {
  createSuperAdminAnnouncement,
  fetchSuperAdminAnnouncementMeta,
  fetchSuperAdminAnnouncementTargets,
  fetchSuperAdminAnnouncements,
} from "../../../services/superAdminService.js";
import { toast } from "react-hot-toast";

const ANN_COLS = [
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "audience", label: "Audience" },
  { key: "audienceDetail", label: "Target" },
  { key: "sentDate", label: "Sent Date" },
  { key: "expiryDate", label: "Expiry Date" },
  { key: "status", label: "Status" },
];

const blank = {
  type: "",
  audience: "",
  targetId: "",
  title: "",
  body: "",
  expiryDate: "",
};

const TYPE_STYLE = {
  Warning: "bg-amber-50 border-amber-200",
  Appreciation: "bg-emerald-50 border-emerald-200",
  Announcement: "bg-blue-50 border-blue-200",
};

const TYPE_TITLE_STYLE = {
  Warning: "text-amber-800",
  Appreciation: "text-emerald-800",
  Announcement: "text-blue-900",
};

const TYPE_BADGE_STYLE = {
  Warning: "bg-amber-100 text-amber-700",
  Appreciation: "bg-emerald-100 text-emerald-700",
  Announcement: "bg-blue-100 text-blue-700",
};

const TYPE_DIVIDER = {
  Warning: "bg-amber-200",
  Appreciation: "bg-emerald-200",
  Announcement: "bg-blue-200",
};

export default function Announcement() {
  const [form, setForm] = useState(blank);
  const [formErr, setFormErr] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [successDetail, setSuccessDetail] = useState("");

  const [messageTypes, setMessageTypes] = useState([]);
  const [audienceOptions, setAudienceOptions] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);

  const [adminsList, setAdminsList] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [viewRow, setViewRow] = useState(null);

  const selectedAdmin = useMemo(
    () => adminsList.find((admin) => String(admin.id) === String(form.targetId)),
    [adminsList, form.targetId],
  );

  useEffect(() => {
    fetchSuperAdminAnnouncementMeta()
      .then(({ messageTypes: types, audienceOptions: audiences }) => {
        setMessageTypes((types || []).map((type) => type.label));
        setAudienceOptions(audiences || []);
        setForm((current) => ({
          ...current,
          type: current.type || types?.[0]?.label || "Announcement",
          audience: current.audience || audiences?.[0] || "All",
        }));
      })
      .catch(() => {
        setMessageTypes(["Announcement", "Warning", "Appreciation"]);
        setAudienceOptions(["All", "Admin"]);
        setForm((current) => ({ ...current, type: "Announcement", audience: "All" }));
      })
      .finally(() => setMetaLoading(false));
  }, []);

  useEffect(() => {
    fetchSuperAdminAnnouncements()
      .then(({ announcements: list }) => setAnnouncements(list || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    if (form.audience !== "Admin") {
      setAdminsList([]);
      return;
    }

    setLoadingAdmins(true);
    fetchSuperAdminAnnouncementTargets("Admin")
      .then(({ targets }) => setAdminsList(targets || []))
      .catch(() => setAdminsList([]))
      .finally(() => setLoadingAdmins(false));
  }, [form.audience]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (formErr[key]) setFormErr((current) => ({ ...current, [key]: "" }));
    setSubmitErr("");
    setSuccessDetail("");
  };

  const handleSubmit = async () => {
    const errs = {};
    if (!form.type.trim()) errs.type = "Type is required.";
    if (!form.audience.trim()) errs.audience = "Audience is required.";
    if (form.audience === "Admin" && !form.targetId) {
      errs.targetId = "Please select an existing admin.";
    }
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.body.trim()) errs.body = "Message is required.";

    if (Object.keys(errs).length) {
      setFormErr(errs);
      return;
    }

    setSubmitting(true);
    setSubmitErr("");

    try {
      const created = await createSuperAdminAnnouncement({
        title: form.title.trim(),
        message: form.body.trim(),
        type: form.type,
        audience: form.audience,
        targetId: form.targetId || null,
        expiryDate: form.expiryDate || null,
      });

      setAnnouncements((current) => [created, ...current]);
      setForm((current) => ({
        ...blank,
        type: current.type || "Announcement",
        audience: current.audience || "All",
      }));
      setFormErr({});
      setSuccessDetail(created.audienceDetail);
      toast.success("Announcement sent successfully");
    } catch (err) {
      setSubmitErr(err?.message || "Failed to send announcement. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const actions = [
    {
      icon: <Eye size={15} />,
      tooltip: "View",
      variant: "ghost",
      onClick: (row) => {
        setViewRow(row);
        openModal("superadmin-ann-view");
      },
    },
  ];

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">
      <DashGrid cols={12} gap={4}>
        <Heading
          primaryText="Announcement"
          secondaryText="Management"
          size={12}
          fontSize="3xl"
          showAnimation
        />
      </DashGrid>

      {successDetail && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-sm">
          <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            ✓
          </span>
          <div>
            <p className="font-bold">Announcement sent successfully</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              Audience: {successDetail}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm font-black text-[#2a465a] mb-5">Create New Announcement</p>
        <Grid cols={12} gap={4}>
          <div className="col-span-12 sm:col-span-6">
            <SelectField
              label="Message Type *"
              id="super-ann-type"
              size={12}
              placeholder="Select type..."
              value={form.type}
              onChange={(event) => setField("type", event.target.value)}
            >
              {messageTypes.map((type) => (
                <Option key={type} value={type} label={type} />
              ))}
            </SelectField>
            {formErr.type && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.type}</p>}
          </div>

          <div className="col-span-12 sm:col-span-6">
            <SelectField
              label="Send To *"
              id="super-ann-audience"
              size={12}
              placeholder="Select audience..."
              value={form.audience}
              onChange={(event) => {
                setField("audience", event.target.value);
                setField("targetId", "");
              }}
            >
              {audienceOptions.map((audience) => (
                <Option key={audience} value={audience} label={audience} />
              ))}
            </SelectField>
            {formErr.audience && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.audience}</p>}
          </div>

          {form.audience === "Admin" && (
            <div className="col-span-12 sm:col-span-6">
              {loadingAdmins ? (
                <div className="flex items-center gap-2 py-3 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Loading admins...
                </div>
              ) : (
                <>
                  <SelectField
                    label="Select Admin *"
                    id="super-ann-target-admin"
                    size={12}
                    placeholder="Select company admin..."
                    value={form.targetId}
                    onChange={(event) => setField("targetId", event.target.value)}
                  >
                    {adminsList.map((admin) => (
                      <Option key={admin.id} value={admin.id} label={admin.label} />
                    ))}
                  </SelectField>
                  {adminsList.length === 0 && (
                    <p className="text-xs text-slate-400 mt-1 px-1">No active admins found.</p>
                  )}
                </>
              )}
              {formErr.targetId && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.targetId}</p>}
            </div>
          )}

          <div className="col-span-12 sm:col-span-6">
            <DatePicker
              label="Expiry Date (optional)"
              id="super-ann-expiry"
              value={form.expiryDate}
              onChange={(value) => setField("expiryDate", value)}
              placeholder="Select expiry date"
            />
          </div>

          <div className="col-span-12">
            <DataField
              label="Title *"
              id="super-ann-title"
              size={12}
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Announcement title..."
            />
            {formErr.title && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.title}</p>}
          </div>

          <div className="col-span-12">
            <DataField
              label="Message *"
              id="super-ann-body"
              type="textarea"
              rows={4}
              size={12}
              value={form.body}
              onChange={(event) => setField("body", event.target.value)}
              placeholder="Write your announcement here..."
            />
            {formErr.body && <p className="text-xs text-rose-600 mt-1 px-1">{formErr.body}</p>}
          </div>

          {(form.title.trim() || form.body.trim()) && (
            <div className="col-span-12">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">
                Preview
              </p>
              <div className={`rounded-2xl border p-5 space-y-3 transition-all ${TYPE_STYLE[form.type] || TYPE_STYLE.Announcement}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${TYPE_BADGE_STYLE[form.type] || TYPE_BADGE_STYLE.Announcement}`}>
                    {form.type || "Announcement"}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    to {form.audience === "Admin" ? selectedAdmin?.label || "Selected Admin" : "All Admins and Users"}
                  </span>
                  {form.expiryDate && (
                    <span className="text-[10px] font-semibold text-slate-400 ml-auto">
                      Expires: {form.expiryDate}
                    </span>
                  )}
                </div>
                <h3 className={`text-base font-black leading-snug ${TYPE_TITLE_STYLE[form.type] || TYPE_TITLE_STYLE.Announcement}`}>
                  {form.title || "Title will appear here"}
                </h3>
                <div className={`h-px ${TYPE_DIVIDER[form.type] || TYPE_DIVIDER.Announcement}`} />
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {form.body || "Message body will appear here"}
                </p>
                <p className="text-[10px] text-slate-400 pt-1">From: Super Admin</p>
              </div>
            </div>
          )}

          {submitErr && (
            <div className="col-span-12">
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                {submitErr}
              </p>
            </div>
          )}

          <div className="col-span-6">
            <Button
              text="Reset"
              variant="secondary"
              onClick={() => {
                setForm((current) => ({
                  ...blank,
                  type: current.type || "Announcement",
                  audience: current.audience || "All",
                }));
                setFormErr({});
                setSubmitErr("");
                setSuccessDetail("");
              }}
            />
          </div>
          <div className="col-span-6">
            <Button
              text={submitting ? "Sending..." : "Send Announcement"}
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting}
            />
          </div>
        </Grid>
      </div>

      <DataTable
        title="Announcement History"
        ellipse={3}
        columns={ANN_COLS}
        rows={historyLoading ? [] : announcements}
        actions={actions}
        size={12}
        pageSize={10}
        searchable
        exportable
        exportFileName="platform_announcements"
        filters={[
          { title: "Type", type: "toggle", key: "type", options: ["Announcement", "Warning", "Appreciation"] },
          { title: "Audience", type: "toggle", key: "audience", options: ["All", "Admin"] },
          { title: "Status", type: "toggle", key: "status", options: ["Active", "Expired"] },
        ]}
      />

      <Modal id="superadmin-ann-view" title="Announcement Details" size="xl">
        {viewRow && (
          <div className="flex flex-col gap-4">
            <ModalGrid title="Details" cols={2}>
              <ModalData label="Type" value={viewRow.type} />
              <ModalData label="Audience" value={viewRow.audience} />
              <ModalData label="Target" value={viewRow.audienceDetail || "All Admins and Users"} />
              <ModalData label="Sent Date" value={viewRow.sentDate} />
              <ModalData label="Expiry Date" value={viewRow.expiryDate || "-"} />
              <ModalData label="Status" value={viewRow.status} />
            </ModalGrid>
            <ModalGrid title="Message" cols={1}>
              <ModalData label="Title" value={viewRow.title} />
              <ModalData label="Content" value={viewRow.body} />
            </ModalGrid>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button text="Close" variant="ghost" size={3} onClick={() => closeModal("superadmin-ann-view")} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
