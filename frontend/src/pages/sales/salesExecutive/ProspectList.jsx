import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Plus } from 'lucide-react';
import { EnhancedDataTable, Button, Heading, P, DashGrid, EnhancedDashCard } from '../../../components/Shared/Common_Components';
import { Users, Activity, CheckCircle2, IndianRupee } from 'lucide-react';
import { prospectService } from '../../../services/prospectService';
import ProspectDetailsPanel from '../../../components/sales/ProspectDetailsPanel';

export default function ProspectList() {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedProspectId, setSelectedProspectId] = useState(null);

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prospectService.getProspects();
      setProspects(data);
    } catch (err) {
      setError('Failed to load prospects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalProspects = prospects.length;
  const activeProspects = prospects.filter(p => ['Contacted', 'Qualified'].includes(p.status)).length;
  const wonDeals = prospects.filter(p => p.status === 'Won').length;
  const pipelineValue = prospects.reduce((acc, curr) => acc + (Number(curr.dealValue) || 0), 0);

  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'source', label: 'Source' },
    { key: 'dealValue', label: 'Deal Value' },
    { key: 'followUpDate', label: 'Next Follow-up' }
  ];

  const actions = [
    {
      label: 'View',
      icon: <Eye size={14} />,
      variant: 'ghost',
      onClick: (row) => {
        setSelectedProspectId(row.id);
        setIsPanelOpen(true);
      }
    },
    {
      label: 'Edit',
      icon: <Edit2 size={14} />,
      variant: 'primary',
      onClick: (row) => navigate(`/sales-executive/edit-prospect/${row.id}`)
    }
  ];

  // Filters logic setup for EnhancedDataTable
  // EnhancedDataTable supports an array of filter objects: { title, type, options, fn }
  const tableFilters = [
    {
      title: 'Status',
      type: 'select',
      options: ['Untouched', 'Contacted', 'Qualified', 'Lost', 'Won'],
      fn: (row, value) => !value || row.status === value
    },
    {
      title: 'Source',
      type: 'select',
      options: ['Website', 'Facebook', 'Referral', 'LinkedIn', 'Other'],
      fn: (row, value) => !value || row.source === value
    }
  ];

  return (
    <div className="w-full min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 w-full sm:w-auto">
            <Heading primaryText="Prospect Management" fontSize="2xl" showAnimations={true} />
            <P text="View, manage, and track your leads." size="sm" className="text-slate-500 mt-2 ml-1" />
          </div>
          <div className="w-full sm:w-auto mt-4 sm:mt-0">
            <Button 
              text={<div className="flex items-center justify-center gap-2"><Plus size={16} /> Create Prospect</div>} 
              variant="primary"
              onClick={() => navigate('/sales-executive/create-prospect')}
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-semibold border border-rose-200">
            {error}
          </div>
        )}

        {/* Dashboard Summary Cards */}
        {!loading && (
          <DashGrid cols={12} gap={6} className="mb-6">
            <EnhancedDashCard
              title="TOTAL PROSPECTS"
              value={totalProspects.toString()}
              icon={<Users size={22} />}
              accentColor="#3b82f6"
              size={3}
            />
            <EnhancedDashCard
              title="ACTIVE PROSPECTS"
              value={activeProspects.toString()}
              icon={<Activity size={22} />}
              accentColor="#f59e0b"
              size={3}
            />
            <EnhancedDashCard
              title="WON DEALS"
              value={wonDeals.toString()}
              icon={<CheckCircle2 size={22} />}
              accentColor="#10b981"
              size={3}
            />
            <EnhancedDashCard
              title="PIPELINE VALUE"
              value={`₹${pipelineValue.toLocaleString('en-IN')}`}
              icon={<IndianRupee size={22} />}
              accentColor="#8b5cf6"
              size={3}
            />
          </DashGrid>
        )}

        {/* Data Table */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white animate-pulse rounded-xl shadow-sm border border-slate-100"></div>
            ))}
          </div>
        ) : (
          <div className="prospect-list-table">
            <EnhancedDataTable
              title="All Prospects"
              columns={columns}
              rows={prospects}
              actions={actions}
              filters={tableFilters}
              date={true} // Enables Date Range filtering if supported
              searchable={true}
              pageSize={10}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        )}
      </div>

      {/* Prospect Details Panel */}
      <ProspectDetailsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        prospectId={selectedProspectId}
      />
    </div>
  );
}
