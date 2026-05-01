import React, { useEffect, useState } from 'react';
import { X, Phone, MessageCircle, Edit, Trash2, Mail, Building, MapPin, IndianRupee, User, Clock, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { prospectService } from '../../services/prospectService';

export default function ProspectDetailsPanel({ isOpen, onClose, prospectId }) {
  const [show, setShow] = useState(false);
  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
      if (prospectId) {
        fetchProspect(prospectId);
      }
    } else {
      setShow(false);
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, prospectId]);

  const fetchProspect = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await prospectService.getProspect(id);
      setProspect(data);
    } catch (err) {
      setError('Failed to load prospect details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !show) return null;

  // Mock timeline data if not provided (for empty states)
  const timeline = prospect?.timeline || [
    { id: 1, type: 'call', title: 'Initial Call', desc: 'Discussed requirements, seems interested.', date: 'Oct 24, 10:30 AM', icon: Phone },
    { id: 2, type: 'status', title: 'Status Updated', desc: 'Moved from Untouched to Contacted.', date: 'Oct 24, 11:00 AM', icon: CheckCircle2 },
    { id: 3, type: 'note', title: 'Note Added', desc: 'Requested a demo next week.', date: 'Oct 25, 02:15 PM', icon: Edit },
  ];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
        onClick={() => { setShow(false); setTimeout(onClose, 300); }} 
      />
      
      {/* Panel */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-in-out flex flex-col ${show ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-[#2a465a] tracking-tight">{prospect?.fullName || 'John Doe'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-slate-500">{prospect?.phone || '9876543210'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-widest">{prospect?.status || 'Contacted'}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Source: {prospect?.source || 'Website'}</p>
          </div>
          <button 
            onClick={() => { setShow(false); setTimeout(onClose, 300); }} 
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100 self-start"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 relative">
          
          {loading ? (
            <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#2a465a] animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500">Loading Details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-sm font-bold text-center">
              {error}
            </div>
          ) : (
            <>
              {/* Basic Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Basic Info</h3>
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span>{prospect?.email || 'john.doe@example.com'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Building size={16} className="text-slate-400" />
                <span>{prospect?.company || 'Acme Corp'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                <span>{prospect?.city || 'Mumbai, MH'}</span>
              </div>
            </div>
          </div>

          {/* Lead Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Lead Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deal Value</p>
                <div className="flex items-center gap-1.5 text-[#2a465a] font-bold text-sm">
                  <IndianRupee size={14} /> {prospect?.dealValue || '50,000'}
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                <div className="text-rose-600 font-bold text-sm">{prospect?.priority || 'High'}</div>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Assigned To</p>
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <User size={14} className="text-slate-400" /> {prospect?.assignedTo || 'Current User'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Next Follow-up</h3>
            <div className="bg-gradient-to-r from-[#2a465a] to-[#3a5a7a] p-4 rounded-2xl shadow-md text-white flex items-center justify-between relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                 <Clock size={80} />
               </div>
               <div>
                 <div className="flex items-center gap-2 font-medium text-sm text-sky-100">
                   <Calendar size={14} /> {prospect?.followUpDate || 'Oct 28, 2023'}
                 </div>
                 <div className="text-lg font-black mt-0.5">{prospect?.followUpTime || '02:00 PM'}</div>
               </div>
               {prospect?.reminder !== false && (
                 <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                   Reminder ON
                 </div>
               )}
            </div>
          </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Activity Timeline</h3>
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
                  
                  {timeline.map((item) => {
                    const Icon = item.icon || MessageCircle;
                    return (
                      <div key={item.id} className="relative">
                        <div className="absolute -left-6 bg-white p-1 rounded-full border-2 border-slate-200 z-10 text-[#2a465a]">
                          <Icon size={12} />
                        </div>
                        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm relative z-10">
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
            </>
          )}
        </div>

        {/* Action Buttons (Footer) */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0 relative z-20">
          <button onClick={() => window.location.href = `tel:${prospect?.phone || ''}`} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
            <Phone size={16} /> Call
          </button>
          <button onClick={() => window.open(`https://wa.me/${prospect?.phone || ''}`, '_blank')} className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#25D366]/20 transition-all active:scale-95">
            <MessageCircle size={16} /> WhatsApp
          </button>
          <button onClick={() => { setShow(false); setTimeout(() => { onClose(); window.location.href = `/sales-executive/edit-prospect/${prospect?.id || prospectId}`; }, 300); }} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-[#2a465a] hover:bg-slate-50 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95">
            <Edit size={16} /> Edit
          </button>
          <button onClick={async () => { if(window.confirm('Are you sure you want to delete this prospect?')) { await prospectService.deleteProspect(prospectId); setShow(false); setTimeout(() => { onClose(); window.location.reload(); }, 300); } }} className="flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95">
            <Trash2 size={16} /> Dump
          </button>
        </div>
      </div>
    </div>
  );
}
