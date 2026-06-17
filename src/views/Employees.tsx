import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Loader2, X, Plus, UserPlus, DollarSign, Star, FileText, UploadCloud, Users } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { Dialog } from '@/src/components/ui/Dialog';

interface Document {
  id: string;
  title: string;
  url: string;
}

interface SalaryRecord {
  id: string;
  month: number;
  year: number;
  net_amount: number;
  status: string;
}

interface Evaluation {
  id: string;
  score: number;
  remarks: string;
  evaluator_name: string;
  evaluation_date: string;
}

interface EmployeeData {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  designation: string;
  department: string;
  phone: string;
  address: string;
  hire_date: string;
  documents?: Document[];
  salary_records?: SalaryRecord[];
  evaluations?: Evaluation[];
}

export default function Employees() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const fetchProfile = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(prev => prev.map(e => e.id === id ? data : e));
      }
    } catch (err) {}
  };

  const handleRowClick = (id: string) => {
    setActiveId(id);
    fetchProfile(id);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(Object.fromEntries(fd.entries()))
      });
      if (!res.ok) throw new Error('Failed to add employee');
      setShowAddModal(false);
      fetchEmployees();
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(Object.fromEntries(fd.entries()))
      });
      if (!res.ok) throw new Error('Failed to update employee');
      setShowEditModal(false);
      fetchEmployees();
      fetchProfile(activeId);
    } catch (err: any) { alert("Error: " + err.message); }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees/${deleteDialog.id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      setActiveId(null);
      fetchEmployees();
    } catch (err) {} finally {
      setDeleteDialog({isOpen: false, id: null});
    }
  };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    data.employee_id = activeId;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees/salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) fetchProfile(activeId);
    } catch (err) {}
    (e.target as HTMLFormElement).reset();
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    data.employee_id = activeId;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) fetchProfile(activeId);
    } catch (err) {}
    (e.target as HTMLFormElement).reset();
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('employee_id', activeId);
    fd.append('title', file.name);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) fetchProfile(activeId);
      else alert('Failed to upload document');
    } catch (err) {}
  };

  const activeEmp = employees.find(e => e.id === activeId);

  if (loading) return <div className="flex justify-center p-24 text-[var(--color-primary)]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="relative h-full flex overflow-hidden">
      <div className="flex-1 space-y-8 pr-4 overflow-y-auto pb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Directory</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage non-teaching staff, salaries, evaluations, and documents.</p>
          </div>
          {role === 'SUPER_ADMIN' && (
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg flex items-center transition-all">
              <Plus size={18} className="mr-2"/> New Employee
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {employees.map((emp, idx) => (
            <motion.div
              key={emp.id} onClick={() => handleRowClick(emp.id)}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className={`bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer ${activeId === emp.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Users size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{emp.first_name} {emp.last_name}</h3>
                  <p className="text-xs text-slate-500">{emp.designation}</p>
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded mt-2">{emp.employee_id}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeEmp && (
          <motion.div
            initial={{ x: 500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 500, opacity: 0 }} transition={{ type: 'spring', damping: 25 }}
            className="w-[28rem] shrink-0 bg-white/95 backdrop-blur-2xl shadow-2xl flex flex-col h-full -my-8 -mr-8 py-8 px-6 rounded-l-[40px] z-20 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">Employee Profile</h2>
              <button onClick={() => setActiveId(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} className="text-slate-400" /></button>
            </div>
            
            <div className="text-center space-y-2 mb-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><UserPlus size={32} /></div>
              <h3 className="text-2xl font-black">{activeEmp.first_name} {activeEmp.last_name}</h3>
              <p className="text-slate-500 text-sm font-medium">{activeEmp.designation} • {activeEmp.department}</p>
              
              {role === 'SUPER_ADMIN' && (
                <div className="flex justify-center space-x-2 pt-2">
                  <button onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/salary/statement/employee/${activeEmp.id}?token=${token}`)} className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg">Salary</button>
                  <button onClick={() => setShowEditModal(true)} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">Edit</button>
                  <button onClick={() => setDeleteDialog({isOpen: true, id: activeEmp.id})} className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-lg">Delete</button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Documents */}
              <div className="bg-slate-50 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center"><FileText size={16} className="mr-2"/> Documents</h4>
                  <label className="cursor-pointer text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center">
                    <UploadCloud size={14} className="mr-1"/> Upload
                    <input type="file" className="hidden" onChange={handleUploadDoc} />
                  </label>
                </div>
                {activeEmp.documents?.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-200 last:border-0">
                    <span className="truncate flex-1 font-medium">{doc.title}</span>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs font-bold">View</a>
                  </div>
                ))}
              </div>

              {/* Salary Records */}
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-800 flex items-center mb-4"><DollarSign size={16} className="mr-2"/> Salaries</h4>
                <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                  {activeEmp.salary_records?.map(sal => (
                    <div key={sal.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg">
                      <span className="font-semibold">{sal.month}/{sal.year}</span>
                      <span className="font-black text-emerald-600">Rs. {sal.net_amount}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddSalary} className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <input name="month" type="number" min="1" max="12" placeholder="MM" required className="w-full text-xs p-2 rounded-lg border outline-none" />
                    <input name="year" type="number" min="2000" max="2100" placeholder="YYYY" required className="w-full text-xs p-2 rounded-lg border outline-none" />
                  </div>
                  <input name="base_amount" type="number" placeholder="Base Amount" required className="w-full text-xs p-2 rounded-lg border outline-none" />
                  <button type="submit" className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">Add Salary</button>
                </form>
              </div>

              {/* Performance */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-sm font-bold text-amber-800 flex items-center mb-4"><Star size={16} className="mr-2"/> Performance</h4>
                <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                  {activeEmp.evaluations?.map(ev => (
                    <div key={ev.id} className="text-sm bg-white p-2 rounded-lg">
                      <div className="flex justify-between font-bold"><span>{ev.score}/100</span><span className="text-[10px] text-slate-400">{new Date(ev.evaluation_date).toLocaleDateString()}</span></div>
                      <p className="text-xs mt-1 text-slate-600">{ev.remarks}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddEvaluation} className="flex flex-col space-y-2">
                  <input name="score" type="number" min="0" max="100" placeholder="Score (0-100)" required className="w-full text-xs p-2 rounded-lg border outline-none" />
                  <input name="remarks" type="text" placeholder="Remarks" required className="w-full text-xs p-2 rounded-lg border outline-none" />
                  <input name="evaluator_name" type="text" placeholder="Evaluator Name" required className="w-full text-xs p-2 rounded-lg border outline-none" />
                  <button type="submit" className="w-full py-2 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600">Add Evaluation</button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Add Employee</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input name="employee_id" type="text" placeholder="Employee ID (e.g. E-001)" className="w-full h-12 px-4 border rounded-xl" />
              <div className="flex space-x-4">
                <input name="first_name" type="text" placeholder="First Name" required className="w-full h-12 px-4 border rounded-xl" />
                <input name="last_name" type="text" placeholder="Last Name" required className="w-full h-12 px-4 border rounded-xl" />
              </div>
              <input name="designation" type="text" placeholder="Designation" className="w-full h-12 px-4 border rounded-xl" />
              <input name="department" type="text" placeholder="Department" className="w-full h-12 px-4 border rounded-xl" />
              <input name="phone" type="text" placeholder="Phone" className="w-full h-12 px-4 border rounded-xl" />
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && activeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Edit Employee</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="flex space-x-4">
                <input name="first_name" defaultValue={activeEmp.first_name} type="text" placeholder="First Name" required className="w-full h-12 px-4 border rounded-xl" />
                <input name="last_name" defaultValue={activeEmp.last_name} type="text" placeholder="Last Name" required className="w-full h-12 px-4 border rounded-xl" />
              </div>
              <input name="designation" defaultValue={activeEmp.designation} type="text" placeholder="Designation" className="w-full h-12 px-4 border rounded-xl" />
              <input name="department" defaultValue={activeEmp.department} type="text" placeholder="Department" className="w-full h-12 px-4 border rounded-xl" />
              <input name="phone" defaultValue={activeEmp.phone} type="text" placeholder="Phone" className="w-full h-12 px-4 border rounded-xl" />
              <div className="flex justify-end space-x-3 mt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Dialog
        isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({isOpen: false, id: null})}
        title="Delete Employee" message="Are you sure? This deletes all evaluations, salaries, and documents."
        type="CONFIRM" variant="danger" confirmLabel="Delete" onConfirm={confirmDelete}
      />
    </div>
  );
}
