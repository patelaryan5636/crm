import React, { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import InvoiceManagement from './InvoiceManagement';
import ExpenseManagement from './ExpenseManagement';

export default function FinanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingExpanded, setPendingExpanded] = useState(false);
  const [failedExpanded, setFailedExpanded] = useState(false);
  
  const pendingRef = useRef(null);
  const failedRef = useRef(null);

  useEffect(() => {
    if (pendingExpanded && pendingRef.current) {
      // Use setTimeout to ensure DOM is fully painted before scrolling
      setTimeout(() => {
        pendingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [pendingExpanded]);

  useEffect(() => {
    if (failedExpanded && failedRef.current) {
      setTimeout(() => {
        failedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [failedExpanded]);
  
  // Chart Data
  const weeklyRevenue = [
    { name: 'Mon', revenue: 3500 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2800 },
    { name: 'Fri', revenue: 5000 },
    { name: 'Sat', revenue: 1000 },
    { name: 'Sun', revenue: 3490 },
  ];

  const revenueStreams = [
    { name: 'Services', value: 55, color: '#355872' },
    { name: 'Products', value: 30, color: '#7AAACE' },
    { name: 'Subscriptions', value: 15, color: '#9CD5FF' },
  ];

  const pendingList = [
    { id: 'INV-012', client: 'Alpha Corp', product: 'Cloud Services', branch: 'NY-East', role: 'Admin', amount: 3200, date: 'Nov 01' },
    { id: 'INV-013', client: 'Beta LLC', product: 'Consulting', branch: 'SF-West', role: 'Manager', amount: 1450, date: 'Nov 02' },
    { id: 'INV-014', client: 'Gamma Inc', product: 'Software License', branch: 'LDN-Central', role: 'User', amount: 800, date: 'Nov 02' }
  ];

  const failedList = [
    { id: 'TRX-981', client: 'Delta Co', product: 'Cloud Services', branch: 'NY-East', role: 'Admin', amount: 2100, date: 'Oct 30' },
    { id: 'TRX-982', client: 'Epsilon Ltd', product: 'Hardware', branch: 'TX-South', role: 'User', amount: 550, date: 'Oct 31' }
  ];

  const pendingSum = pendingList.reduce((acc, curr) => acc + curr.amount, 0);
  const failedSum = failedList.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="w-full h-full flex flex-col font-sans bg-[#F7F8F0] p-6 lg:p-8 min-h-screen">
      
      {/* Header & Tabs */}
      <div className="flex flex-col mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#355872]">Finance Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Overview of your revenue and transactions.</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-8 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
          <button 
            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'overview' ? 'text-[#355872]' : 'text-gray-500 hover:text-[#355872]'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
            {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#355872] rounded-t-lg"></div>}
          </button>
          <button 
            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'invoices' ? 'text-[#355872]' : 'text-gray-500 hover:text-[#355872]'}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoice Management
            {activeTab === 'invoices' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#355872] rounded-t-lg"></div>}
          </button>
          <button 
            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'expenses' ? 'text-[#355872]' : 'text-gray-500 hover:text-[#355872]'}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expense Management
            {activeTab === 'expenses' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#355872] rounded-t-lg"></div>}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-8">

          {/* Top 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            
            {/* Total Revenue */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300 flex flex-col justify-center">
              <p className="text-sm font-bold text-[#355872] mb-2 uppercase tracking-wide">Total Revenue</p>
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-900">124,500.00</h3>
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-[#7AAACE] font-medium">↗ +12.5%</span> from last month
              </p>
            </div>

            {/* Today's Revenue */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-300 flex flex-col justify-center">
              <p className="text-sm font-bold text-[#355872] mb-2 uppercase tracking-wide">Today's Revenue</p>
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-900">3,450.00</h3>
              <p className="text-xs text-gray-500 mt-2">
                <span className="text-[#7AAACE] font-medium">↗ +5.2%</span> from last month
              </p>
            </div>

            {/* Pending Payments */}
            <div 
              className={`bg-white rounded-xl p-6 shadow-sm border ${pendingExpanded ? 'border-[#355872] ring-1 ring-[#355872]' : 'border-gray-300'} flex flex-col justify-center cursor-pointer transition-all hover:shadow-md`}
              onClick={() => setPendingExpanded(!pendingExpanded)}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-[#355872] uppercase tracking-wide">Pending Payments</p>
                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              </div>
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-900">{pendingSum.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
              <p className="text-xs text-gray-500 mt-2 hover:text-[#355872] transition-colors">{pendingExpanded ? 'Hide details' : 'View details'}</p>
            </div>

            {/* Failed Payments */}
            <div 
              className={`bg-white rounded-xl p-6 shadow-sm border ${failedExpanded ? 'border-[#355872] ring-1 ring-[#355872]' : 'border-gray-300'} flex flex-col justify-center cursor-pointer transition-all hover:shadow-md`}
              onClick={() => setFailedExpanded(!failedExpanded)}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-[#355872] uppercase tracking-wide">Failed Payments</p>
                <div className="w-2 h-2 rounded-full bg-[#355872] opacity-80"></div>
              </div>
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-900">{failedSum.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
              <p className="text-xs text-gray-500 mt-2 hover:text-[#355872] transition-colors">{failedExpanded ? 'Hide details' : 'View details'}</p>
            </div>

          </div>

          {/* Middle Section: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             <div className="lg:col-span-2 min-w-0 bg-white rounded-xl p-6 shadow-sm border border-gray-300 flex flex-col">
                <h3 className="font-bold text-[#355872] mb-6 text-lg">Weekly Revenue</h3>
                <div className="flex-1 w-full min-h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyRevenue} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                      <Tooltip 
                        cursor={{fill: '#F3F4F6'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="revenue" fill="#7AAACE" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="lg:col-span-1 flex flex-col bg-white rounded-xl p-6 shadow-sm border border-gray-300">
                <h3 className="font-bold text-[#355872] mb-6 text-lg">Revenue Streams</h3>
                <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[300px]">
                  <div className="h-[240px] w-full relative mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueStreams}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {revenueStreams.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-gray-600 font-medium">
                   {revenueStreams.map((entry, idx) => (
                     <div key={idx} className="flex items-center gap-1.5">
                       <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: entry.color}}></div>
                       {entry.name}
                     </div>
                   ))}
                </div>
              </div>
             </div>

          </div>

          {/* Expanded Sections Below Charts */}
          {pendingExpanded && (
            <div ref={pendingRef} className="w-full bg-white rounded-xl shadow-sm border border-gray-300 p-6 scroll-mt-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#355872] text-lg flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Pending Payments Details
                </h3>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-sm font-semibold text-gray-500">Invoice ID</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Client</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Product Name</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Branch</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Role</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Date</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingList.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-4 text-sm text-gray-600 font-medium">{item.id}</td>
                        <td className="py-4 text-sm text-gray-900 font-semibold">{item.client}</td>
                        <td className="py-4 text-sm text-gray-600">{item.product}</td>
                        <td className="py-4 text-sm text-gray-600">{item.branch}</td>
                        <td className="py-4 text-sm text-gray-600">{item.role}</td>
                        <td className="py-4 text-sm text-gray-500">{item.date}</td>
                        <td className="py-4 text-sm font-bold text-gray-900 text-right">${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {failedExpanded && (
            <div ref={failedRef} className="w-full bg-white rounded-xl shadow-sm border border-gray-300 p-6 scroll-mt-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-[#355872] text-lg flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#355872] opacity-80"></div> Failed Payments Details
                </h3>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-sm font-semibold text-gray-500">Transaction ID</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Client</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Product Name</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Branch</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Role</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500">Date</th>
                      <th className="pb-3 text-sm font-semibold text-gray-500 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedList.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-4 text-sm text-gray-600 font-medium">{item.id}</td>
                        <td className="py-4 text-sm text-gray-900 font-semibold">{item.client}</td>
                        <td className="py-4 text-sm text-gray-600">{item.product}</td>
                        <td className="py-4 text-sm text-gray-600">{item.branch}</td>
                        <td className="py-4 text-sm text-gray-600">{item.role}</td>
                        <td className="py-4 text-sm text-gray-500">{item.date}</td>
                        <td className="py-4 text-sm font-bold text-gray-900 text-right">${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6 flex-1 mt-6">
          <InvoiceManagement isEmbedded={true} />
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6 flex-1 mt-6">
          <ExpenseManagement isEmbedded={true} />
        </div>
      )}
      
    </div>
  );
}
