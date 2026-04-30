import React, { useState } from 'react';
import { Button, DashGrid, DataTable, Modal, openModal, closeModal, P, InputField } from '../../components/shared/Common_Components';
import { Eye, Download } from 'lucide-react';

export default function InvoiceManagement({ isEmbedded }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ client: '', amount: '' });
  const rawInvoices = [
    { idText: 'INV-2023-001', client: 'Acme Corp', date: 'Oct 24, 2023', amount: '1,200.00', status: 'Paid' },
    { idText: 'INV-2023-002', client: 'Global Tech', date: 'Oct 25, 2023', amount: '3,450.00', status: 'Pending' },
    { idText: 'INV-2023-003', client: 'Stark Ind.', date: 'Oct 26, 2023', amount: '890.00', status: 'Overdue' },
    { idText: 'INV-2023-004', client: 'Wayne Ent.', date: 'Oct 27, 2023', amount: '4,500.00', status: 'Paid' },
    { idText: 'INV-2023-005', client: 'Oscorp', date: 'Oct 28, 2023', amount: '2,100.00', status: 'Pending' },
  ];

  const columns = [
    { key: "idText", label: "Invoice ID", width: "15%" },
    { key: "client", label: "Client", width: "25%" },
    { key: "date", label: "Date", width: "20%" },
    { key: "amount", label: "Amount", width: "20%" },
    { key: "status", label: "Status", width: "20%" }
  ];

  const invoices = rawInvoices.map(inv => ({
    ...inv,
    status: inv.status === 'Paid' ? 'Completed' : inv.status === 'Pending' ? 'Pending' : 'Failed'
  }));

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    openModal('view-invoice-modal');
  };

  const handleCreateInvoice = () => {
    closeModal('create-invoice-modal');
    setNewInvoice({ client: '', amount: '' });
  };

  const handleDownloadInvoice = (invoice) => {
    const headers = ['Invoice ID', 'Client', 'Date', 'Amount', 'Status'];
    const row = `"${invoice.idText}","${invoice.client}","${invoice.date}","${invoice.amount}","${invoice.status}"`;
    const csvContent = headers.join(',') + '\\n' + row;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoice.idText}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full ${isEmbedded ? '' : 'min-h-screen bg-white p-4 md:p-8'}`}>
      <style>{`
        .invoice-table-container table {
          table-layout: fixed;
          width: 100%;
        }
        .invoice-table-container th, 
        .invoice-table-container td {
          white-space: normal !important;
          word-break: break-word;
          padding: 12px 8px !important;
        }
        .invoice-table-container th:nth-child(1) { width: 18%; }
        .invoice-table-container th:nth-child(2) { width: 20%; }
        .invoice-table-container th:nth-child(3) { width: 18%; }
        .invoice-table-container th:nth-child(4) { width: 15%; }
        .invoice-table-container th:nth-child(5) { width: 15%; }
        .invoice-table-container th:last-child,
        .invoice-table-container td:last-child {
          width: 100px !important;
          min-width: 100px !important;
          text-align: center;
        }
        .invoice-table-container .data-table-scroll {
          overflow-x: hidden !important;
        }
      `}</style>

      <div className="flex flex-col gap-4 mb-6 w-full">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="primary" text="Create Invoice" onClick={() => openModal('create-invoice-modal')} />
        </div>
      </div>

      <DashGrid cols={12} gap={6}>
        <div className="col-span-12 w-full invoice-table-container">
          <DataTable
            title="All Invoices"
            columns={columns}
            rows={invoices}
            actions={[
              { icon: <Eye size={16} />, tooltip: "View", variant: "ghost", onClick: (row) => handleViewInvoice(row) },
              { icon: <Download size={16} />, tooltip: "Download", variant: "primary", onClick: (row) => handleDownloadInvoice(row) }
            ]}
            size={12}
            pageSize={10}
            hideTopBar={true}
            hidePagination={true}
          />
        </div>
      </DashGrid>

      <Modal id="view-invoice-modal" title="Invoice Details" size="md">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <P text="Invoice ID" size="xs" className="text-slate-500" />
                <P text={selectedInvoice.idText} className="font-medium" />
              </div>
              <div>
                <P text="Client" size="xs" className="text-slate-500" />
                <P text={selectedInvoice.client} className="font-medium" />
              </div>
              <div>
                <P text="Date" size="xs" className="text-slate-500" />
                <P text={selectedInvoice.date} className="font-medium" />
              </div>
              <div>
                <P text="Amount" size="xs" className="text-slate-500" />
                <P text={`$${selectedInvoice.amount}`} className="font-medium" />
              </div>
              <div>
                <P text="Status" size="xs" className="text-slate-500" />
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${selectedInvoice.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    selectedInvoice.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                  }`}>
                  {selectedInvoice.status}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <div onClick={() => closeModal('view-invoice-modal')}>
                <Button variant="ghost" text="Close" />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal id="create-invoice-modal" title="Create Invoice" size="md">
        <div className="space-y-4">
          <P text="Submit a new invoice record." size="sm" />
          <InputField
            type="text"
            placeholder="Client Name e.g. Acme Corp"
            value={newInvoice.client}
            onChange={e => setNewInvoice({ ...newInvoice, client: e.target.value })}
          />
          <InputField
            type="number"
            placeholder="Amount ($)"
            value={newInvoice.amount}
            onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })}
          />
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
            <div onClick={() => closeModal('create-invoice-modal')}>
              <Button variant="ghost" text="Cancel" />
            </div>
            <div onClick={handleCreateInvoice}>
              <Button variant="primary" text="Create Invoice" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
