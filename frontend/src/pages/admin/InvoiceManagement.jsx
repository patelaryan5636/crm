import React from 'react';
import { Search, Plus, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function InvoiceManagement() {
  const invoices = [
    { id: 'INV-2023-001', client: 'Acme Corp', date: 'Oct 24, 2023', amount: '1,200.00', status: 'Paid' },
    { id: 2, idText: 'INV-2023-002', client: 'Global Tech', date: 'Oct 25, 2023', amount: '3,450.00', status: 'Pending' },
    { id: 3, idText: 'INV-2023-003', client: 'Stark Ind.', date: 'Oct 26, 2023', amount: '890.00', status: 'Overdue' },
    { id: 4, idText: 'INV-2023-004', client: 'Wayne Ent.', date: 'Oct 27, 2023', amount: '4,500.00', status: 'Paid' },
    { id: 5, idText: 'INV-2023-005', client: 'Oscorp', date: 'Oct 28, 2023', amount: '2,100.00', status: 'Pending' },
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create, view, and download client invoices.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#355872] hover:bg-[#2a465a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-gray-500 bg-gray-100/80 w-full md:w-auto px-4 py-2 rounded-lg focus-within:bg-gray-100 transition-colors">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search invoices by ID or Client..."
            className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-full md:w-64 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="w-full flex-1 overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-4 px-2 font-medium">Invoice ID</th>
              <th className="py-4 px-2 font-medium">Client</th>
              <th className="py-4 px-2 font-medium">Date</th>
              <th className="py-4 px-2 font-medium">Amount</th>
              <th className="py-4 px-2 font-medium">Status</th>
              <th className="py-4 px-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {invoices.map((invoice, idx) => (
              <tr key={idx} className="hover:bg-white transition-colors group">
                <td className="py-4 px-2 text-blue-600 font-medium cursor-pointer hover:underline">{invoice.idText || invoice.id}</td>
                <td className="py-4 px-2 text-gray-800">{invoice.client}</td>
                <td className="py-4 px-2 text-gray-500">{invoice.date}</td>
                <td className="py-4 px-2 text-gray-900 font-bold">${invoice.amount}</td>
                <td className="py-4 px-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium 
                    ${invoice.status === 'Paid' ? 'bg-green-100/50 text-green-600' : 
                      invoice.status === 'Overdue' ? 'bg-red-100/50 text-red-500' : 'bg-blue-100/50 text-blue-600'}
                  `}>
                    {invoice.status}
                  </span>
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex justify-end items-center gap-3 text-gray-400">
                    <button className="hover:text-blue-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                    <button className="hover:text-blue-600 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
         <span>Showing 1 to 5 of 5 entries</span>
         <div className="flex items-center gap-1">
             <button className="p-1 hover:text-gray-900 focus:outline-none"><ChevronLeft className="w-4 h-4" /></button>
             <button className="w-6 h-6 rounded bg-[#355872] text-white flex items-center justify-center font-medium">1</button>
             <button className="p-1 hover:text-gray-900 focus:outline-none"><ChevronRight className="w-4 h-4" /></button>
         </div>
      </div>
    </div>
  );
}
