import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Building, MapPin, Calendar, Clock, Edit, FileText, IndianRupee, CheckCircle2, MessageCircle, Trash2 } from 'lucide-react';
import { Heading, P, Button, DataField, SelectField, Option } from '../../../components/Shared/Common_Components';
import { useParams, useNavigate } from 'react-router-dom';
import { prospectService } from '../../../services/prospectService';

export default function EditProspect() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [history, setHistory] = useState([]);
  const [changedFields, setChangedFields] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const loadProspect = async () => {
      try {
        const data = await prospectService.getProspect(id);
        setInitialData(data);
        setFormData(data);
        setHistory(data.activityHistory || []);
      } catch (err) {
        setError('Failed to load prospect details.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadProspect();
  }, [id]);

  // Compare formData with initialData to highlight changed fields
  useEffect(() => {
    if (!initialData || !formData) return;
    const changes = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'activityHistory' && formData[key] !== initialData[key]) {
        changes[key] = true;
      }
    });
    setChangedFields(changes);
  }, [formData, initialData]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleToggle = () => {
    setFormData(prev => ({ ...prev, reminder: !prev.reminder }));
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    let newHistory = [...history];
    let lastContactDate = formData.lastContactDate;
    
    // Smart Logic: Log activity if status changed
    if (formData.status !== initialData.status) {
      newHistory.unshift({
        id: Date.now(),
        type: 'status',
        title: 'Status Updated',
        desc: `Status changed from ${initialData.status} to ${formData.status}.`,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        icon: null
      });
      lastContactDate = new Date().toISOString().split('T')[0];
    }

    const updatedData = { ...formData, activityHistory: newHistory, lastContactDate };
    
    try {
      const saved = await prospectService.updateProspect(id, updatedData);
      setHistory(saved.activityHistory || newHistory);
      setFormData(saved);
      setInitialData(saved);
      
      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert('Failed to update prospect.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if(Object.keys(changedFields).length > 0) {
      if(window.confirm('You have unsaved changes. Discard?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const getFieldClass = (fieldId) => {
    return changedFields[fieldId] ? "border-amber-300 bg-amber-50/30" : "";
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8 bg-gray-50 flex flex-col gap-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-24 bg-white rounded-2xl border border-slate-100 shadow-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-slate-100 shadow-sm"></div>
          <div className="lg:col-span-4 h-[500px] bg-white rounded-2xl border border-slate-100 shadow-sm"></div>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="w-full min-h-screen p-8 bg-gray-50 flex justify-center items-center">
        <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl border border-rose-200 shadow-sm font-bold">
          {error || "Prospect not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-gray-50 relative">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-floatY">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">Prospect Updated Successfully!</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
          <div className="flex-1 w-full sm:w-auto">
            <Heading primaryText={`Edit Prospect: ${initialData.fullName}`} fontSize="2xl" showAnimations={true} />
            <P text={`Last Contact: ${formData.lastContactDate}`} size="sm" className="text-slate-500 mt-2 ml-1" />
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold border border-amber-200">
               {Object.keys(changedFields).length} Unsaved Changes
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Basic Details Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5 relative overflow-hidden">
               {Object.keys(changedFields).some(k => ['fullName', 'email', 'company', 'city'].includes(k)) && (
                 <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
               )}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <User className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Basic Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1">
                  <DataField label="Full Name" id="fullName" icon={User} value={formData.fullName} onChange={handleInputChange} className={getFieldClass('fullName')} />
                </div>
                <div className="col-span-1">
                  <DataField label="Phone Number (Locked)" id="phone" type="tel" icon={Phone} value={formData.phone} readOnly={true} className="bg-slate-100 cursor-not-allowed text-slate-500" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <DataField label="Email Address" id="email" type="email" icon={Mail} value={formData.email} onChange={handleInputChange} className={getFieldClass('email')} />
                </div>
                <div className="col-span-1">
                  <DataField label="Company Name" id="company" icon={Building} value={formData.company} onChange={handleInputChange} className={getFieldClass('company')} />
                </div>
                <div className="col-span-1">
                  <DataField label="City" id="city" icon={MapPin} value={formData.city} onChange={handleInputChange} className={getFieldClass('city')} />
                </div>
              </div>
            </div>

            {/* Step 2: Lead Details Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5 relative overflow-hidden">
               {Object.keys(changedFields).some(k => ['source', 'status', 'dealValue', 'priority'].includes(k)) && (
                 <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
               )}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <FileText className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Lead Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1">
                  <SelectField label="Lead Source" id="source" value={formData.source} onChange={handleInputChange}>
                    <Option value="Facebook" label="Facebook" />
                    <Option value="Website" label="Website" />
                    <Option value="Referral" label="Referral" />
                  </SelectField>
                </div>
                <div className="col-span-1">
                  <SelectField label="Status" id="status" value={formData.status} onChange={handleInputChange}>
                    <Option value="Untouched" label="Untouched" />
                    <Option value="Contacted" label="Contacted" />
                    <Option value="Qualified" label="Qualified" />
                    <Option value="Lost" label="Lost" />
                    <Option value="Won" label="Won" />
                  </SelectField>
                </div>
                <div className="col-span-1">
                  <DataField label="Deal Value" id="dealValue" type="number" icon={IndianRupee} value={formData.dealValue} onChange={handleInputChange} className={getFieldClass('dealValue')} />
                </div>
                <div className="col-span-1">
                  <SelectField label="Priority" id="priority" value={formData.priority} onChange={handleInputChange}>
                    <Option value="High" label="High" />
                    <Option value="Medium" label="Medium" />
                    <Option value="Low" label="Low" />
                  </SelectField>
                </div>
              </div>
            </div>
            
            {/* Follow-up & Notes Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5 relative overflow-hidden">
               {Object.keys(changedFields).some(k => ['followUpDate', 'followUpTime', 'reminder', 'notes'].includes(k)) && (
                 <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
               )}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Clock className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Follow-up & Notes</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1">
                  <DataField label="Next Follow-up Date" id="followUpDate" type="date" icon={Calendar} value={formData.followUpDate} onChange={handleInputChange} className={getFieldClass('followUpDate')} />
                </div>
                <div className="col-span-1">
                  <DataField label="Time" id="followUpTime" type="time" icon={Clock} value={formData.followUpTime} onChange={handleInputChange} className={getFieldClass('followUpTime')} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#2a465a]">Set Reminder</span>
                      <span className="text-xs text-slate-500 mt-0.5">Get notified before follow-up</span>
                    </div>
                    <button onClick={handleToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.reminder ? 'bg-[#2a465a]' : 'bg-slate-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ${formData.reminder ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 pt-2">
                  <label htmlFor="notes" className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">Notes</label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-4 text-slate-400"><Edit size={18} /></div>
                    <textarea id="notes" rows="4" value={formData.notes} onChange={handleInputChange} className={`w-full rounded-2xl border bg-slate-50/90 pl-12 pr-4 py-3.5 text-[#2a465a] placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20 transition duration-200 resize-none ${getFieldClass('notes') || 'border-slate-200 focus:border-[#2a465a]/40'}`} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Step 4: Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3 sticky top-6 z-10">
              <Button 
                text={<div className="flex items-center justify-center gap-2"><CheckCircle2 size={16} /> {isSaving ? "Updating..." : "Update Prospect"}</div>} 
                variant="primary" 
                onClick={handleUpdate} 
                disabled={Object.keys(changedFields).length === 0 || isSaving} 
              />
              <Button text={<div className="flex items-center justify-center gap-2"><Trash2 size={16} /> Cancel</div>} variant="ghost" onClick={handleCancel} disabled={isSaving} />
            </div>

            {/* Step 3: Activity History (Read-only) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Clock className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Activity History</h3>
              </div>
              <div className="relative pl-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                {history.map((item) => {
                  const Icon = item.icon || MessageCircle;
                  return (
                    <div key={item.id} className="relative">
                      <div className="absolute -left-6 bg-white p-1 rounded-full border-2 border-slate-200 z-10 text-[#2a465a]">
                        <Icon size={12} />
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-sm text-slate-700">{item.title}</span>
                          <span className="text-[10px] font-medium text-slate-400">{item.date}</span>
                        </div>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
