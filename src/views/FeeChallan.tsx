import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { FileText, Send, Download, QrCode, Loader2, UserPlus, Users, Edit3, Settings, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useStore';
import { Dialog, DialogProps } from '@/src/components/ui/Dialog';
import { Input } from '@/src/components/ui/Input';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface CustomFieldDef {
  id: string;
  name: string;
  defaultValue: string;
}

interface CustomFee {
  amount: string;
  dueDate: string;
  customFields: Record<string, string>;
  amountPaid: string;
}

export default function FeeChallan() {
  const [selectedMonth, setSelectedMonth] = useState('4');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [globalAmount, setGlobalAmount] = useState('4500');
  const [globalDueDate, setGlobalDueDate] = useState('2026-04-10');
  const [globalPaidAmount, setGlobalPaidAmount] = useState('0');
  const [globalCustomFields, setGlobalCustomFields] = useState<CustomFieldDef[]>([
    { id: 'cf_fine', name: 'Fine', defaultValue: '0' },
    { id: 'cf_discount', name: 'Discount', defaultValue: '0' },
    { id: 'cf_prevbal', name: 'Prev. Bal', defaultValue: '0' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'custom_bulk' | 'individual'>('custom_bulk');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentChallans, setStudentChallans] = useState<any[]>([]);
  
  // State for data grid
  const [studentFees, setStudentFees] = useState<Record<string, CustomFee>>({});

  // Dialog State
  const [dialog, setDialog] = useState<Omit<DialogProps, 'isOpen' | 'onClose'>>({
    type: 'ALERT',
    title: '',
    message: '',
    variant: 'primary'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const showDialog = (config: Omit<DialogProps, 'isOpen' | 'onClose'>) => {
    setDialog(config);
    setIsDialogOpen(true);
  };

  const token = useAuthStore(state => state.token);

  // Fetch all students immediately
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setStudents(data);
    })
    .catch(console.error);
  }, [token]);

  // Sync grid to global defaults
  useEffect(() => {
    const defaultFees: Record<string, CustomFee> = {};
    students.forEach(s => {
      // Retain previously customized values if they exist, to prevent accidental overwrites
      const existing = studentFees[s.id] || { amount: globalAmount, dueDate: globalDueDate, customFields: {}, amountPaid: globalPaidAmount };
      const newCustomFields: Record<string, string> = { ...existing.customFields };
      globalCustomFields.forEach(cf => {
        if (!newCustomFields[cf.id]) newCustomFields[cf.id] = cf.defaultValue;
      });
      defaultFees[s.id] = { ...existing, customFields: newCustomFields };
    });
    setStudentFees(defaultFees);
  }, [students, globalAmount, globalDueDate, globalPaidAmount, globalCustomFields]);

  const refreshStudentChallans = () => {
    if (selectedStudent) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/finance/student/${selectedStudent}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setStudentChallans(data))
      .catch(console.error);
    }
  };

  useEffect(() => {
    refreshStudentChallans();
  }, [selectedStudent, token, loading]);

  const handleAddField = () => {
    showDialog({
      type: 'INPUT',
      title: 'New Fee Category',
      message: 'Enter the name of the new field (e.g., Admission Fee, Advance).',
      confirmLabel: 'Next',
      variant: 'info',
      onConfirm: (name) => {
        if (!name) return;
        setTimeout(() => {
          showDialog({
            type: 'INPUT',
            title: `Cost for ${name}`,
            message: `What is the default PKR amount for ${name}?`,
            confirmLabel: 'Add Field',
            variant: 'info',
            onConfirm: (cost) => {
              if (cost === null) return;
              setGlobalCustomFields(prev => [...prev, { id: 'cf_' + Date.now().toString(), name, defaultValue: cost || '0' }]);
            }
          });
        }, 100);
      }
    });
  };

  const handleCustomBulkGenerate = async () => {
    setLoading(true);
    try {
      const payload = {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        student_fees: students.map(s => {
           const sFee = studentFees[s.id];
           return {
             student_id: s.id,
             amount_due: parseFloat(sFee?.amount) || parseFloat(globalAmount),
             amount_paid: parseFloat(sFee?.amountPaid) || parseFloat(globalPaidAmount) || 0,
             due_date: new Date(sFee?.dueDate || globalDueDate).toISOString(),
             custom_fields: globalCustomFields.map(cf => ({
               name: cf.name,
               amount: parseFloat(sFee?.customFields[cf.id]) || 0
             }))
           }
        })
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/finance/bulk-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      showDialog({
        type: 'ALERT',
        title: 'Batch Generation Success',
        message: data.message || 'Custom bulk orchestration sequence complete.',
        variant: 'success'
      });
    } catch (err) {
      showDialog({
        type: 'ALERT',
        title: 'Sequence Error',
        message: 'The financial engine failed to generate bulk records.',
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualGenerate = async () => {
    if (!selectedStudent) return showDialog({ type: 'ALERT', title: 'Target Missing', message: 'Select a scholar from the registry before deployment.', variant: 'danger' });
    setLoading(true);
    try {
      const sFee = studentFees[selectedStudent];
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/finance/student/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          student_id: selectedStudent,
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
          amount_due: parseFloat(globalAmount) || 4500,
          amount_paid: parseFloat(globalPaidAmount) || 0,
          due_date: new Date(globalDueDate).toISOString(),
          custom_fields: globalCustomFields.map(cf => ({
               name: cf.name,
               amount: parseFloat(cf.defaultValue) || 0
          }))
        })
      });
      const data = await res.json();
      showDialog({
        type: 'ALERT',
        title: 'Generation Success',
        message: data.message || 'Individual challan generated and archived.',
        variant: 'success'
      });
    } catch (err) {
      showDialog({
        type: 'ALERT',
        title: 'Deployment Error',
        message: 'The individual generation sequence failed.',
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (challanId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/finance/${challanId}/pay`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showDialog({
          type: 'ALERT',
          title: 'Balance Settled',
          message: 'Scholar balance marked as paid effectively.',
          variant: 'success'
        });
        refreshStudentChallans();
      }
    } catch (err) {
      console.error(err);
      showDialog({
        type: 'ALERT',
        title: 'Transaction Error',
        message: 'Failed to settle the balance in system registry.',
        variant: 'danger'
      });
    }
  };

  const deleteChallan = async (challanId: string) => {
    showDialog({
      type: 'CONFIRM',
      title: 'Destructive Action',
      message: 'Are you sure you want to permanently delete this challan? This action is irreversible.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/finance/${challanId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showDialog({
              type: 'ALERT',
              title: 'Entry Removed',
              message: 'The challan record has been wiped from the database.',
              variant: 'success'
            });
            refreshStudentChallans();
          }
        } catch (err) {
          console.error(err);
          showDialog({
            type: 'ALERT',
            title: 'Deletion Error',
            message: 'An error occurred while wiping the record.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const updateStudentFee = (id: string, field: keyof CustomFee, value: string) => {
    setStudentFees(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { amount: globalAmount, dueDate: globalDueDate, customFields: {}, amountPaid: globalPaidAmount }),
        [field]: value
      }
    }));
  };

  const updateStudentCustomField = (studentId: string, customFieldId: string, value: string) => {
    setStudentFees(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { amount: globalAmount, dueDate: globalDueDate, customFields: {}, amountPaid: globalPaidAmount }),
        customFields: {
          ...(prev[studentId]?.customFields || {}),
          [customFieldId]: value
        }
      }
    }));
  };

  const updateGlobalCustomField = (id: string, newDefault: string) => {
    setGlobalCustomFields(prev => prev.map(cf => cf.id === id ? { ...cf, defaultValue: newDefault } : cf));
  };

  const applyGlobalConfig = () => {
    const updatedFees: Record<string, CustomFee> = {};
    const defaultCFs: Record<string, string> = {};
    globalCustomFields.forEach(cf => defaultCFs[cf.id] = cf.defaultValue);

    students.forEach(s => {
      updatedFees[s.id] = { amount: globalAmount, dueDate: globalDueDate, customFields: defaultCFs, amountPaid: globalPaidAmount };
    });
    setStudentFees(updatedFees);
  };

  const downloadPDF = (id: string) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/finance/${id}/pdf?token=${token}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8 pb-12 overflow-y-auto h-full pr-4"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-800 tracking-tight">Advanced Financial Engine</h1>
          <p className="text-slate-500 mt-2 font-medium max-w-xl leading-relaxed">Dynamic fee generation. Oversee and orchestrate custom challans globally, with absolute control over individual student parameters.</p>
        </div>
        <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit shadow-inner">
          <button
            onClick={() => setMode('custom_bulk')}
            className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'custom_bulk' ? 'bg-white text-indigo-600 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={18} className="mr-2" /> Custom Bulk Orchestration
          </button>
          <button
            onClick={() => setMode('individual')}
            className={`flex items-center px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${mode === 'individual' ? 'bg-white text-indigo-600 shadow-[0_2px_10px_rgb(0,0,0,0.06)]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <UserPlus size={18} className="mr-2" /> Individual Generation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* GLOBAL CONFIGURATION PANEL */}
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <CardContent className="p-8 space-y-7">
              <div className="flex items-center space-x-3 text-slate-800 pb-2 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <Settings size={20} />
                </div>
                <h3 className="text-lg font-bold tracking-tight">Global Parameters</h3>   
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Month</label>
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 transition-all outline-none"
                    >
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 transition-all outline-none"
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Study Fee (PKR)</label>
                  <input 
                    type="number" 
                    value={globalAmount}
                    onChange={(e) => setGlobalAmount(e.target.value)}
                    placeholder="e.g. 4500"
                    className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Advance Paid Amount (PKR)</label>
                  <input 
                    type="number" 
                    value={globalPaidAmount}
                    onChange={(e) => setGlobalPaidAmount(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                  <input 
                    type="date" 
                    value={globalDueDate}
                    onChange={(e) => setGlobalDueDate(e.target.value)}
                    className="w-full h-12 px-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 outline-none transition-all"
                  />
                </div>

                {globalCustomFields.map(cf => (
                   <div key={cf.id} className="flex justify-between items-center bg-indigo-50/50 p-2 pl-4 rounded-xl border border-indigo-100">
                     <span className="text-sm font-bold text-indigo-900">{cf.name}</span>
                     <div className="flex items-center space-x-2">
                       <span className="text-xs font-bold text-indigo-400">PKR</span>
                       <input 
                         type="number" 
                         value={cf.defaultValue} 
                         onChange={(e) => updateGlobalCustomField(cf.id, e.target.value)}
                         className="w-20 h-9 px-2 bg-white rounded-lg border border-indigo-200 text-sm font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                       />
                     </div>
                   </div>
                ))}
                
                <Button onClick={handleAddField} variant="outline" className="w-full border-dashed border-2 border-indigo-200 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-all font-semibold rounded-xl space-x-2">
                  <Plus size={16} /> <span>Add Custom Dynamic Field</span>
                </Button>

                {mode === 'individual' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 pt-2">Select Target Student</label>
                    <select 
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full h-12 px-4 bg-indigo-50 rounded-xl border border-indigo-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 font-semibold text-indigo-900 transition-all outline-none"
                    >
                      <option value="">-- Dropdown Target --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_number})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {mode === 'custom_bulk' && (
                <div className="pt-2">
                  <Button onClick={applyGlobalConfig} variant="secondary" className="w-full h-12 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-xl space-x-2">
                    <Edit3 size={16} /> <span>Override Below Grid</span>
                  </Button>
                </div>
              )}

              <div className="pt-6">
                <Button 
                  onClick={mode === 'custom_bulk' ? handleCustomBulkGenerate : handleIndividualGenerate} 
                  disabled={loading || (mode === 'individual' && !selectedStudent)} 
                  className="w-full h-14 rounded-xl text-md font-bold shadow-[0_8px_20px_rgb(79,70,229,0.25)] bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 border-none space-x-3 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin text-white" size={22} /> : <Send size={22} className="text-white" />}
                  <span className="text-white tracking-wide">{loading ? 'Executing Engine...' : mode === 'custom_bulk' ? 'Deploy Custom Bulk DB' : 'Deploy Individual Challan'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DETAILS PANEL */}
        <div className="xl:col-span-8">
          
          {mode === 'custom_bulk' ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-full max-h-[800px]">
              <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Student Configuration Grid</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Found {students.length} active scholars. Adjust parameters granularly.</p>
                </div>
              </div>
              <div className="overflow-auto flex-1 p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 sticky left-0 bg-white z-10">Student Identity</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">Study Fee (PKR)</th>
                      {globalCustomFields.map(cf => (
                        <th key={cf.id} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-100">{cf.name}</th>
                      ))}
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-emerald-500 border-b border-slate-100">Paid Amt.</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map(s => {
                      const sFee = studentFees[s.id] || { amount: globalAmount, dueDate: globalDueDate, customFields: {}, amountPaid: globalPaidAmount };
                      return (
                        <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-6 py-4 bg-white group-hover:bg-indigo-50/30 sticky left-0 z-10">
                            <div className="flex items-center w-48">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 mr-4 border border-slate-200">
                                {s.first_name[0]}{s.last_name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{s.first_name} {s.last_name}</p>
                                <p className="text-xs text-slate-400 font-medium">{s.admission_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rs</span>
                              <input 
                                type="number" 
                                value={sFee.amount}
                                onChange={(e) => updateStudentFee(s.id, 'amount', e.target.value)}
                                className="w-28 h-10 pl-9 pr-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all group-hover:border-indigo-200 shadow-sm"
                              />
                            </div>
                          </td>
                          {globalCustomFields.map(cf => (
                            <td key={cf.id} className="px-6 py-4">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 text-sm font-bold">Rs</span>
                                <input 
                                  type="number" 
                                  value={sFee.customFields?.[cf.id] !== undefined ? sFee.customFields[cf.id] : cf.defaultValue}
                                  onChange={(e) => updateStudentCustomField(s.id, cf.id, e.target.value)}
                                  className="w-24 h-10 pl-9 pr-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all group-hover:border-indigo-200 shadow-sm"
                                />
                              </div>
                            </td>
                          ))}
                          <td className="px-6 py-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300 text-sm font-bold">Rs</span>
                              <input 
                                type="number" 
                                value={sFee.amountPaid}
                                onChange={(e) => updateStudentFee(s.id, 'amountPaid', e.target.value)}
                                className="w-24 h-10 pl-9 pr-2 bg-emerald-50/30 border border-emerald-100 rounded-lg text-sm font-bold text-emerald-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all group-hover:border-emerald-200 shadow-sm"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="date" 
                              value={sFee.dueDate}
                              onChange={(e) => updateStudentFee(s.id, 'dueDate', e.target.value)}
                              className="w-36 h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all group-hover:border-indigo-200 shadow-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {students.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center opacity-60">
                    <QrCode size={48} className="text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No students enrolled to generate challans.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            selectedStudent && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg sticky top-0 bg-transparent z-10 px-2 flex items-center"><FileText size={20} className="mr-2 text-indigo-500"/> Generated PDF Artifacts</h3>
                <div className="space-y-3">
                  {studentChallans.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200 shadow-sm">
                      <QrCode size={32} className="mx-auto mb-3 opacity-50" />
                      No challans exist in the database for this scholar.
                    </div>
                  ) : (
                    studentChallans.map(challan => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        key={challan.id} 
                        className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center justify-between hover:border-indigo-100 transition-colors group"
                      >
                        <div className="flex items-center space-x-5">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300">
                            <FileText className="text-indigo-600" size={24} />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 tracking-tight text-lg">{challan.student?.first_name} {challan.student?.last_name} • {challan.month} / {challan.year}</h4>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-xs font-black px-2 py-1 bg-green-50 text-green-600 rounded-md">
                                PKR {(() => {
                                  let fine = 0, discount = 0, prev = 0, other = 0;
                                  (challan.custom_fields || []).forEach((cf: any) => {
                                    let n = cf.name.toLowerCase().replace('.', '').trim();
                                    let amt = Number(cf.amount) || 0;
                                    if (n === 'fine') fine = amt;
                                    else if (n === 'discount') discount = amt;
                                    else if (n === 'prev bal' || n === 'prevbal') prev = amt;
                                    else other += amt;
                                  });
                                  const gross = Number(challan.amount_due) + other;
                                  return gross + fine + prev - discount - Number(challan.amount_paid || 0);
                                })()}
                              </span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${challan.status === 'PAID' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>{challan.status}</span>
                              <span className="text-xs font-semibold text-slate-400">Due {new Date(challan.due_date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {challan.status !== 'PAID' && (
                            <button 
                              onClick={() => markAsPaid(challan.id)}
                              title="Mark as Paid"
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 border border-indigo-100 text-xs"
                            >
                              <CheckCircle size={16} className="mr-2" /> Mark Paid
                            </button>
                          )}
                          <button 
                            onClick={() => downloadPDF(challan.id)}
                            className="w-12 h-12 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 border border-slate-100 hover:border-indigo-100"
                          >
                            <Download size={20} />
                          </button>
                          <button 
                            onClick={() => deleteChallan(challan.id)}
                            className="w-12 h-12 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 border border-rose-100"
                            title="Delete permanently"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        {...dialog} 
      />
    </motion.div>
  );
}
