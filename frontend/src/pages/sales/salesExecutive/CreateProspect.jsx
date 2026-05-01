import React, { useState } from 'react';
import { User, Phone, Mail, Building, MapPin, Calendar, Clock, Edit, FileText, IndianRupee, CheckCircle2 } from 'lucide-react';
import { Heading, P, Button, DataField, SelectField, Option, ToggleButton } from '../../../components/Shared/Common_Components';
import ProspectDetailsPanel from '../../../components/sales/ProspectDetailsPanel';
import { prospectService } from '../../../services/prospectService';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';

export default function CreateProspect() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    city: '',
    source: '',
    status: 'Untouched',
    dealValue: '',
    priority: '',
    followUpDate: '',
    followUpTime: '',
    reminder: false,
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Mocked database of existing leads for smart duplication check
  const existingLeads = [
    {
      fullName: 'John Doe',
      phone: '9876543210',
      email: 'john@example.com',
      company: 'Acme Corp',
      city: 'Mumbai',
      source: 'Website',
      status: 'Contacted',
      dealValue: '50000',
      priority: 'High'
    }
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: null }));
    }

    // Phone validation & Duplicate check logic
    if (id === 'phone') {
      const isDuplicate = existingLeads.find(lead => lead.phone === value);
      if (isDuplicate) {
        setDuplicateWarning(true);
        // Auto-fill existing data
        setFormData(prev => ({ ...prev, ...isDuplicate }));
      } else {
        setDuplicateWarning(false);
      }
    }
  };

  const handleToggle = () => {
    setFormData(prev => ({ ...prev, reminder: !prev.reminder }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone Number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone Number must be 10 digits';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      setIsSaving(true);
      try {
        await prospectService.createProspect(formData);
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          navigate('/sales-executive/prospects');
        }, 2000);
      } catch (err) {
        alert('Failed to save prospect.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSaveAndAddNew = async () => {
    if (validateForm()) {
      setIsSaving(true);
      try {
        await prospectService.createProspect(formData);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        // Reset form
        setFormData({
          fullName: '', phone: '', email: '', company: '', city: '',
          source: '', status: 'Untouched', dealValue: '', priority: '',
          followUpDate: '', followUpTime: '', reminder: false, notes: ''
        });
        setDuplicateWarning(false);
      } catch (err) {
        alert('Failed to save prospect.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    // Logic to navigate back or reset
    if(window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
        setFormData({
            fullName: '', phone: '', email: '', company: '', city: '',
            source: '', status: 'Untouched', dealValue: '', priority: '',
            followUpDate: '', followUpTime: '', reminder: false, notes: ''
        });
        setErrors({});
        setDuplicateWarning(false);
    }
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-gray-50 relative">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-floatY">
          <CheckCircle2 size={20} />
          <span className="font-bold text-sm">Prospect Saved Successfully!</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
          <div className="flex-1 w-full sm:w-auto">
            <Heading primaryText="Create Prospect" fontSize="2xl" showAnimations={true} />
            <P text="Add a new lead to your pipeline." size="sm" className="text-slate-500 mt-2 ml-1" />
          </div>
          {duplicateWarning && (
            <div className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              Lead already exists! Auto-filled data.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Basic Details Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <User className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Basic Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1">
                  <DataField
                    label="Full Name *"
                    id="fullName"
                    placeholder="Enter full name"
                    icon={User}
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? "border-rose-300 focus:ring-rose-200" : ""}
                  />
                  {errors.fullName && <p className="text-rose-500 text-xs mt-1 ml-1 font-medium">{errors.fullName}</p>}
                </div>
                <div className="col-span-1">
                  <DataField
                    label="Phone Number *"
                    id="phone"
                    type="tel"
                    placeholder="10-digit number"
                    icon={Phone}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? "border-rose-300 focus:ring-rose-200" : (duplicateWarning ? "border-amber-300 focus:ring-amber-200 bg-amber-50/30" : "")}
                  />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1 ml-1 font-medium">{errors.phone}</p>}
                </div>
                <div className="col-span-1 md:col-span-2">
                  <DataField
                    label="Email Address"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? "border-rose-300 focus:ring-rose-200" : ""}
                  />
                  {errors.email && <p className="text-rose-500 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
                </div>
                <div className="col-span-1">
                  <DataField
                    label="Company Name"
                    id="company"
                    placeholder="Acme Corp"
                    icon={Building}
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-1">
                  <DataField
                    label="City"
                    id="city"
                    placeholder="Enter city"
                    icon={MapPin}
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Lead Details Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <FileText className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Lead Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1">
                  <SelectField
                    label="Lead Source"
                    id="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="Select source"
                  >
                    <Option value="Facebook" label="Facebook" />
                    <Option value="Website" label="Website" />
                    <Option value="Referral" label="Referral" />
                    <Option value="LinkedIn" label="LinkedIn" />
                    <Option value="Other" label="Other" />
                  </SelectField>
                </div>
                <div className="col-span-1">
                  <SelectField
                    label="Status"
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <Option value="Untouched" label="Untouched" />
                    <Option value="Contacted" label="Contacted" />
                    <Option value="Qualified" label="Qualified" />
                    <Option value="Lost" label="Lost" />
                  </SelectField>
                </div>
                <div className="col-span-1">
                  <DataField
                    label="Deal Value"
                    id="dealValue"
                    type="number"
                    placeholder="e.g. 50000"
                    icon={IndianRupee}
                    value={formData.dealValue}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-span-1">
                  <SelectField
                    label="Priority"
                    id="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    placeholder="Select Priority"
                  >
                    <Option value="High" label="High" />
                    <Option value="Medium" label="Medium" />
                    <Option value="Low" label="Low" />
                  </SelectField>
                </div>
                <div className="col-span-1 md:col-span-2">
                   <DataField
                    label="Assigned To"
                    id="assignedTo"
                    placeholder="Current Logged-in User"
                    icon={User}
                    value="Current User" // Mocked logged in user
                    readOnly={true}
                    className="bg-slate-100 cursor-not-allowed text-slate-500"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Step 3: Follow-up & Notes Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5 sticky top-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Clock className="text-[#2a465a]" size={20} />
                <h3 className="text-sm font-bold text-[#2a465a] uppercase tracking-wider">Follow-up</h3>
              </div>

              <div className="space-y-5">
                <DataField
                  label="Next Follow-up Date"
                  id="followUpDate"
                  type="date"
                  icon={Calendar}
                  value={formData.followUpDate}
                  onChange={handleInputChange}
                />
                
                <DataField
                  label="Time"
                  id="followUpTime"
                  type="time"
                  icon={Clock}
                  value={formData.followUpTime}
                  onChange={handleInputChange}
                />

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#2a465a]">Set Reminder</span>
                    <span className="text-xs text-slate-500 mt-0.5">Get notified before follow-up</span>
                  </div>
                  {/* Custom Toggle Switch */}
                  <button 
                    onClick={handleToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${formData.reminder ? 'bg-[#2a465a]' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-300 ${formData.reminder ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  <label htmlFor="notes" className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] select-none">Notes</label>
                  <div className="relative">
                    <div className="absolute top-3.5 left-4 text-slate-400">
                      <Edit size={18} />
                    </div>
                    <textarea
                      id="notes"
                      rows="4"
                      placeholder="Add any additional remarks here..."
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 pl-12 pr-4 py-3.5 text-[#2a465a] placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2a465a]/20 focus:border-[#2a465a]/40 transition duration-200 resize-none"
                    />
                  </div>
                </div>

              </div>
              
              {/* Step 4: Actions */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <Button 
                  text={<div className="flex items-center justify-center gap-2"><CheckCircle2 size={16} /> {isSaving ? "Saving..." : "Save Prospect"}</div>} 
                  variant="primary" 
                  onClick={handleSave} 
                  disabled={isSaving}
                />
                <Button 
                  text={<div className="flex items-center justify-center gap-2"><Plus size={16} /> Save & Add New</div>} 
                  variant="secondary" 
                  onClick={handleSaveAndAddNew} 
                  disabled={isSaving}
                />
                <Button 
                  text={<div className="flex items-center justify-center gap-2"><Trash2 size={16} /> Cancel</div>} 
                  variant="ghost" 
                  onClick={handleCancel} 
                />
                
                {/* Demo Button to open the Prospect Details Panel */}
                <Button 
                  text={<div className="flex items-center justify-center gap-2"><FileText size={16} /> View Demo Prospect</div>} 
                  variant="secondary" 
                  onClick={() => setIsPanelOpen(true)} 
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      <ProspectDetailsPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
      />
    </div>
  );
}
