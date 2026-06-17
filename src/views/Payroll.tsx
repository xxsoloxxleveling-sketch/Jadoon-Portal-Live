import React, { useState, useEffect } from 'react';
import { 
  Banknote, Plus, Download, Filter, Search, CheckCircle, 
  Clock, MoreVertical, X, TrendingUp, Users, Calendar
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';

export default function Payroll() {
  const token = useAuthStore(state => state.token);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [targetType, setTargetType] = useState<'teacher' | 'employee'>('teacher');
  const [targetId, setTargetId] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');

  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salRes, teachRes, empRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/salary?month=${selectedMonth}&year=${selectedYear}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (salRes.ok) {
        const data = await salRes.json();
        setSalaries(data);
      }
      if (teachRes.ok) {
        const data = await teachRes.json();
        setTeachers(data);
      }
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, token]);

  const handleCreateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/salary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          base_amount: parseFloat(baseAmount),
          allowances: parseFloat(allowances) || 0,
          deductions: parseFloat(deductions) || 0,
          teacher_id: targetType === 'teacher' ? targetId : null,
          employee_id: targetType === 'employee' ? targetId : null,
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setTargetId('');
        setBaseAmount('');
        setAllowances('');
        setDeductions('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to create salary:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/salary/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, payment_date: status === 'PAID' ? new Date().toISOString() : null })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const totalExpense = salaries.reduce((acc, curr) => acc + curr.net_amount, 0);
  const totalPaid = salaries.filter(s => s.status === 'PAID').reduce((acc, curr) => acc + curr.net_amount, 0);
  const totalPending = totalExpense - totalPaid;

  const filteredSalaries = salaries.filter(salary => {
    const person = salary.teacher || salary.employee;
    const name = `${person?.first_name || ''} ${person?.last_name || ''}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payroll & Salaries</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage compensation for teachers and staff</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Calendar size={18} className="text-slate-400" />
            <select 
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select 
              className="bg-transparent border-none text-sm font-semibold text-slate-700 focus:ring-0 cursor-pointer pl-1"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            <span>Issue Salary</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Expense</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-4">Rs {totalExpense.toLocaleString()}</h3>
          <p className="text-sm text-slate-500 mt-2">For {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-4">Rs {totalPaid.toLocaleString()}</h3>
          <p className="text-sm text-emerald-600 mt-2 font-medium">{Math.round((totalPaid / (totalExpense || 1)) * 100)}% of total</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Pending Release</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mt-4">Rs {totalPending.toLocaleString()}</h3>
          <p className="text-sm text-amber-600 mt-2 font-medium">Action required</p>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Salary Roster</h3>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <button className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
              <Filter size={18} />
            </button>
            <button className="p-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
              <Download size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Base Amount</th>
                <th className="px-6 py-4">Adjustments</th>
                <th className="px-6 py-4">Net Payable</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading payroll data...</td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <Banknote size={48} className="text-slate-300 mb-3" />
                      <p className="text-lg font-medium text-slate-700">No salary records found</p>
                      <p className="text-sm">No salaries have been issued for this month.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((salary) => {
                  const person = salary.teacher || salary.employee;
                  const isTeacher = !!salary.teacher;
                  
                  return (
                    <tr key={salary.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                            {person?.first_name?.charAt(0)}{person?.last_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{person?.first_name} {person?.last_name}</p>
                            <p className="text-xs text-slate-500">{person?.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${isTeacher ? 'bg-indigo-100 text-indigo-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                          {isTeacher ? 'Teacher' : 'Employee'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">Rs {salary.base_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        {salary.allowances > 0 && <span className="text-emerald-600 block">+ Rs {salary.allowances.toLocaleString()}</span>}
                        {salary.deductions > 0 && <span className="text-rose-600 block">- Rs {salary.deductions.toLocaleString()}</span>}
                        {salary.allowances === 0 && salary.deductions === 0 && <span className="text-slate-400">None</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">Rs {salary.net_amount.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {salary.status === 'PAID' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle size={12} className="mr-1" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <Clock size={12} className="mr-1" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/salary/${salary.id}/download?token=${token}`)}
                            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                          >
                            <Download size={16} />
                          </button>
                          {salary.status === 'PENDING' ? (
                            <button 
                              onClick={() => updateStatus(salary.id, 'PAID')}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-sm text-slate-400">Settled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Salary Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Issue New Salary</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateSalary} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Staff Type</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={targetType}
                    onChange={(e) => {
                      setTargetType(e.target.value as 'teacher' | 'employee');
                      setTargetId('');
                    }}
                    required
                  >
                    <option value="teacher">Teacher</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Person</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {targetType === 'teacher' ? (
                      teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)
                    ) : (
                      employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Base Amount (Rs)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={baseAmount}
                  onChange={(e) => setBaseAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Allowances / Bonus</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={allowances}
                    onChange={(e) => setAllowances(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deductions</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-sm font-semibold text-slate-500 mb-1">
                  <span>Net Payable:</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  Rs {(parseFloat(baseAmount || '0') + parseFloat(allowances || '0') - parseFloat(deductions || '0')).toLocaleString()}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Issue Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
