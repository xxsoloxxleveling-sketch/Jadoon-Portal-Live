import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Download, Search, CheckCircle, 
  MoreVertical, X, TrendingUp, TrendingDown, Clock, Filter, Pencil, Trash2
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';

export default function Transactions() {
  const token = useAuthStore(state => state.token);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transaction Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('COMPLETED');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Category Form State
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [categoryDesc, setCategoryDesc] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const [transRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/transactions`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/transactions/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (transRes.ok) setTransactions(await transRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title, amount, type, date, status, reference, description, category_id: categoryId
        })
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        resetTransactionForm();
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/transactions/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: categoryName, type: categoryType, description: categoryDesc })
      });
      if (res.ok) {
        setIsCategoryModalOpen(false);
        setCategoryName('');
        setCategoryDesc('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Ensure no transactions are attached to it.')) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/transactions/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const resetTransactionForm = () => {
    setTitle('');
    setAmount('');
    setType('EXPENSE');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('COMPLETED');
    setReference('');
    setDescription('');
    setCategoryId('');
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Date', 'Title', 'Reference', 'Category', 'Type', 'Amount', 'Status'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.reference || t.description || '').replace(/"/g, '""')}"`,
      `"${t.category?.name || 'Uncategorized'}"`,
      t.type,
      t.amount,
      t.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Income_Expense_Sheet.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/transactions/export/pdf?token=${token}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Income & Expenses</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage all school financial transactions</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Download size={18} />
            <span className="hidden md:inline">Export CSV</span>
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Download size={18} />
            <span className="hidden md:inline">Export PDF</span>
          </button>
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Categories</span>
          </button>
          <button 
            onClick={() => { resetTransactionForm(); setIsAddModalOpen(true); }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Income</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-4">Rs {totalIncome.toLocaleString()}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Expense</p>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-4">Rs {totalExpense.toLocaleString()}</h3>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Net Balance</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt size={20} />
            </div>
          </div>
          <h3 className={`text-3xl font-bold mt-4 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            Rs {netBalance.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Title / Desc</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading transactions...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Receipt size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-lg font-medium text-slate-700">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.reference || t.description || 'No ref'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{t.category?.name || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'INCOME' ? '+' : '-'} Rs {t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {t.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle size={12} className="mr-1" /> {t.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock size={12} className="mr-1" /> {t.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/transactions/${t.id}/download?token=${token}`)}
                          className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Download Invoice"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(t.id)}
                          className="p-1 text-slate-500 hover:text-rose-600 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">New Transaction</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTransaction} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as 'INCOME' | 'EXPENSE');
                      setCategoryId('');
                    }}
                    required
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {categories.filter(c => c.type === type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Electricity Bill"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount (Rs)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reference No / Invoice #</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Manage Categories</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
              <div className="border-r border-slate-100 pr-6 overflow-y-auto">
                <h3 className="font-semibold text-slate-800 mb-4">Existing Categories</h3>
                <div className="space-y-3">
                  {categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                        <p className={`text-xs font-medium ${c.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{c.type}</p>
                      </div>
                      <button onClick={() => deleteCategory(c.id)} className="text-slate-400 hover:text-rose-600 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-slate-500">No categories found.</p>}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">Add New Category</h3>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={categoryType}
                      onChange={(e) => setCategoryType(e.target.value as 'INCOME' | 'EXPENSE')}
                      required
                    >
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg">
                    Add Category
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
