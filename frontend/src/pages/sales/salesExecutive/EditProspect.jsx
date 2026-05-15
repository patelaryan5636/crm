import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building, Loader2, User } from "lucide-react";
import {
  DataField,
  SelectField,
  Option,
  Button,
} from "../../../components/shared/Common_Components";
import {
  fetchProspectById,
  updateProspect,
  getErrorMessage,
} from "./api/prospectsApi";

const PRIORITIES = ["High", "Medium", "Low"];

export default function EditProspect() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ phone: "", email: "", status: "" });
  const [form, setForm] = useState({
    contactPerson: "",
    company: "",
    priority: "Medium",
    requirement: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProspectById(id);
        if (!active) return;
        setMeta({
          phone: data.phone || "",
          email: data.email || "",
          status: data.status || "",
        });
        setForm({
          contactPerson: data.name || "",
          company: data.company || "",
          priority: data.priority || "Medium",
          requirement: data.requirement || "",
        });
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Failed to load prospect"));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const onChange = (e) => {
    const { id: fieldId, value } = e.target;
    setForm((prev) => ({ ...prev, [fieldId]: value }));
  };

  const onSave = async () => {
    if (!form.contactPerson.trim() || !form.company.trim()) {
      alert("Contact person and company are required.");
      return;
    }
    try {
      setSaving(true);
      await updateProspect(id, {
        contactPerson: form.contactPerson.trim(),
        company: form.company.trim(),
        priority: form.priority,
        requirement: form.requirement.trim(),
      });
      navigate("/sales-executive/leads/prospects");
    } catch (err) {
      alert(getErrorMessage(err, "Failed to update prospect"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-[#2a465a]" size={32} />
        <p className="text-sm text-slate-500 font-medium">Loading prospect…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-[#2a465a] underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-[#1a2e3f]"
      >
        <ArrowLeft size={13} />
        Back to Prospects
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a2e3f] to-[#355872] px-6 py-5">
          <h1 className="text-lg font-black text-white">Edit Prospect Form</h1>
          <p className="text-sm text-white/70 mt-1">Update the prospect details you submitted</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataField
              label="Phone"
              id="phone-display"
              value={meta.phone}
              readOnly
              disabled
              size={12}
              className="bg-slate-50 cursor-not-allowed opacity-70"
            />
            <DataField
              label="Email"
              id="email-display"
              value={meta.email}
              readOnly
              disabled
              size={12}
              className="bg-slate-50 cursor-not-allowed opacity-70"
            />
            <DataField
              label="Lead Status"
              id="status-display"
              value={meta.status}
              readOnly
              disabled
              size={12}
              className="bg-slate-50 cursor-not-allowed opacity-70"
            />
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Prospect Form</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DataField
              label="Contact Person *"
              id="contactPerson"
              icon={User}
              value={form.contactPerson}
              onChange={onChange}
              size={12}
            />
            <DataField
              label="Company *"
              id="company"
              icon={Building}
              value={form.company}
              onChange={onChange}
              size={12}
            />
            <SelectField
              label="Priority"
              id="priority"
              value={form.priority}
              onChange={onChange}
              searchable={false}
              size={12}
            >
              {PRIORITIES.map((p) => (
                <Option key={p} value={p} label={p} />
              ))}
            </SelectField>
            <DataField
              label="Requirement"
              id="requirement"
              type="textarea"
              rows={4}
              value={form.requirement}
              onChange={onChange}
              size={12}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <Button text="Cancel" variant="secondary" onClick={() => navigate(-1)} />
          <Button text={saving ? "Saving…" : "Save Changes"} variant="primary" onClick={onSave} />
        </div>
      </div>
    </div>
  );
}
