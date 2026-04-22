import React, { useState } from 'react';
import { Search, Settings, Download, Eye, Check, X, Plus } from 'lucide-react';

export default function ExpenseManagement() {
  const [expenseLimit, setExpenseLimit] = useState(1000);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(1000);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', category: '', amount: '' });
  
  const [expenses, setExpenses] = useState([
    { id: 1, title: 'Office Supplies', category: 'Operations', date: 'Oct 20, 2023', amount: 450, status: 'Approved' },
    { id: 2, title: 'Software Licenses', category: 'IT', date: 'Oct 21, 2023', amount: 1500, status: 'Pending Admin Approval' },
    { id: 3, title: 'Team Lunch', category: 'HR', date: 'Oct 22, 2023', amount: 300, status: 'Approved' },
    { id: 4, title: 'New Laptops', category: 'Hardware', date: 'Oct 24, 2023', amount: 4500, status: 'Pending Admin Approval' },
    { id: 5, title: 'Marketing Ads', category: 'Marketing', date: 'Oct 25, 2023', amount: 800, status: 'Approved' },
  ]);

  const handleApprove = (id) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'Approved' } : exp));
  };

  const handleReject = (id) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: 'Rejected' } : exp));
  };

  const handleSetLimit = () => {
    setExpenseLimit(Number(tempLimit));
    setIsEditingLimit(false);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amount = Number(newExpense.amount);
    const status = amount > expenseLimit ? 'Pending Admin Approval' : 'Approved';
    
    setExpenses([
      ...expenses,
      {
        id: Date.now(),
        title: newExpense.title || 'New Expense',
        category: newExpense.category || 'Other',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: amount,
        status: status
      }
    ]);
    setShowAddForm(false);
    setNewExpense({ title: '', category: '', amount: '' });
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track company expenses and manage approvals.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
             <Settings className="w-4 h-4" /> Limits & Rules
          </button>
          <button className="flex items-center gap-2 bg-[#355872] hover:bg-[#2a465a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-gray-500 bg-gray-100/80 w-full md:w-auto px-4 py-2 rounded-lg focus-within:bg-gray-100 transition-colors">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search expenses..."
            className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-full md:w-64 placeholder:text-gray-400"
          />
        </div>
        <div className="text-sm font-medium text-gray-600 flex gap-4 items-center">
            {isEditingLimit ? (
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={tempLimit} 
                  onChange={(e) => setTempLimit(e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#355872]"
                />
                <button onClick={handleSetLimit} className="text-[#355872] hover:opacity-80 font-semibold">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Active Limit: <span className="font-semibold text-gray-900">${expenseLimit}</span>
                <button onClick={() => setIsEditingLimit(true)} className="text-[#355872] text-xs hover:underline cursor-pointer ml-1">Edit</button>
              </div>
            )}
            
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 bg-[#355872] hover:bg-[#2a465a] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddExpense} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-300 flex flex-wrap gap-4 flex-col md:flex-row md:items-end">
          <div className="flex flex-col gap-1 w-full md:w-auto md:flex-1">
            <label className="text-xs text-gray-500 font-medium">Title</label>
            <input required type="text" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full" placeholder="e.g. Travel" />
          </div>
          <div className="flex flex-col gap-1 w-full md:w-auto md:flex-1">
            <label className="text-xs text-gray-500 font-medium">Category</label>
            <input required type="text" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full" placeholder="e.g. Sales" />
          </div>
          <div className="flex flex-col gap-1 w-full md:w-auto md:flex-1">
            <label className="text-xs text-gray-500 font-medium">Amount ($)</label>
            <input required type="number" min="0" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-full" placeholder="0.00" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 w-full md:w-auto rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Submit Expense
          </button>
        </form>
      )}

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="py-4 px-2 font-medium">Expense Title</th>
              <th className="py-4 px-2 font-medium">Category</th>
              <th className="py-4 px-2 font-medium">Date</th>
              <th className="py-4 px-2 font-medium">Amount</th>
              <th className="py-4 px-2 font-medium">Status</th>
              <th className="py-4 px-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-white transition-colors group">
                <td className="py-4 px-2 text-gray-800 font-medium">{expense.title}</td>
                <td className="py-4 px-2 text-gray-500">{expense.category}</td>
                <td className="py-4 px-2 text-gray-500">{expense.date}</td>
                <td className="py-4 px-2 text-gray-900 font-bold">${expense.amount}</td>
                <td className="py-4 px-2">
                  <span className={`text-xs font-medium 
                    ${expense.status === 'Approved' ? 'text-green-600' : 
                      expense.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'}
                  `}>
                    {expense.status}
                  </span>
                </td>
                <td className="py-4 px-2 text-right">
                  <div className="flex justify-end items-center gap-3 text-gray-400">
                    <button className="hover:text-blue-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                    <button className="hover:text-blue-600 transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                    {expense.status === 'Pending Admin Approval' && (
                      <>
                        <button onClick={() => handleApprove(expense.id)} className="hover:text-green-600 transition-colors" title="Approve"><Check className="w-4 h-4" /></button>
                        <button onClick={() => handleReject(expense.id)} className="hover:text-red-600 transition-colors" title="Reject"><X className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
