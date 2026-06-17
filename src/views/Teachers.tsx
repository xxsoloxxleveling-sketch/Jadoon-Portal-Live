import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Briefcase, Calendar, ShieldCheck, Loader2, X, Plus, UserPlus, Fingerprint, Clock, FileText, UploadCloud, Star } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { Dialog } from '@/src/components/ui/Dialog';

interface TeacherData {
  id: string;
  employee_id: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  dob?: string;
  address?: string;
  phone?: string;
  email: string;
  qualifications: string;
  hire_date: string;
  role: string;
  documents?: Array<{ id: string, title: string, url: string }>;
  evaluations?: Array<{ id: string, score: number, remarks: string, evaluation_date: string, evaluator_name: string }>;
}

interface AttendanceData {
  id: string;
  date: string;
  status: string;
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [deleteDialogConfig, setDeleteDialogConfig] = useState<{isOpen: boolean, teacherId: string | null}>({isOpen: false, teacherId: null});
  
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setTeachers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    if (role !== 'TEACHER') return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAttendanceHistory(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchMyAttendance();
  }, [token, role]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(Object.fromEntries(fd.entries()))
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add teacher');
      }
      setShowAddModal(false);
      fetchTeachers();
    } catch (err: any) {
      alert("Error adding teacher: " + err.message);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacherId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/${activeTeacherId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(Object.fromEntries(fd.entries()))
      });
      if (!res.ok) throw new Error('Failed to update teacher');
      setShowEditModal(false);
      fetchTeachers();
    } catch (err: any) {
      alert("Error updating teacher: " + err.message);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialogConfig({isOpen: true, teacherId: id});
  };

  const confirmDelete = async () => {
    const id = deleteDialogConfig.teacherId;
    if (!id) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete teacher');
      setActiveTeacherId(null);
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (err: any) {
      alert("Error deleting teacher: " + err.message);
    } finally {
      setDeleteDialogConfig({isOpen: false, teacherId: null});
    }
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeTeacherId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('teacher_id', activeTeacherId);
    fd.append('title', file.name);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) fetchTeachers();
      else alert('Failed to upload document');
    } catch (err) {}
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeacherId) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    data.teacher_id = activeTeacherId;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/employees/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) fetchTeachers();
    } catch (err) {}
    (e.target as HTMLFormElement).reset();
  };

  const handleMarkAttendance = async () => {
    setMarkingAttendance(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/attendance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PRESENT' })
      });
      if (res.ok) {
        fetchMyAttendance();
      } else {
        alert('Failed to mark attendance');
      }
    } catch(err) {
      alert('Error marking attendance');
    }
    setMarkingAttendance(false);
  };

  const activeTeacher = teachers.find(t => t.id === activeTeacherId);

  if (loading) return <div className="flex justify-center p-24 text-[var(--color-primary)]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="relative h-full flex overflow-hidden">
      <div className="flex-1 space-y-8 pr-4 overflow-y-auto pb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faculty Directory</h1>
            <p className="text-slate-500 mt-1 font-medium">Manage and review all registered instructional staff</p>
          </div>
          <div className="flex space-x-4">
            {role === 'TEACHER' && (
              <button 
                onClick={() => setShowAttendanceModal(true)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center transition-all">
                <Fingerprint size={18} className="mr-2"/> My Attendance
              </button>
            )}
            {role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg flex items-center transition-all">
                <Plus size={18} className="mr-2"/> New Teacher
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {teachers.map((teacher, index) => (
            <motion.div
              key={teacher.id}
              onClick={() => setActiveTeacherId(teacher.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/60 backdrop-blur-xl border border-white/40 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden ${activeTeacherId===teacher.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm ring-4 ring-white">
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{teacher.first_name || 'Teacher'} {teacher.last_name || ''}</h3>
                  <p className="text-xs text-slate-500">{teacher.designation || 'Faculty'}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-wider mt-1">{teacher.role}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-slate-600 font-medium bg-slate-50/50 p-2.5 rounded-xl">
                  <Briefcase size={16} className="text-[var(--color-primary)] mr-3 opacity-70" />
                  <span className="truncate">{teacher.employee_id}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeTeacher && (
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-96 shrink-0 bg-white/90 backdrop-blur-2xl border-l border-white/50 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col h-full -my-8 -mr-8 py-8 px-6 rounded-l-[40px] z-20"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center"><UserPlus size={20} className="mr-2 text-[var(--color-primary)]" /> Detailed Profile</h2>
              <button onClick={() => setActiveTeacherId(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-8">
              <div className="text-center space-y-2">
                <div className="w-24 h-24 mx-auto rounded-full bg-indigo-50 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-indigo-500">
                  <UserPlus size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900">{activeTeacher.first_name || 'Teacher'} {activeTeacher.last_name || ''}</h3>
                <p className="text-sm text-slate-500 font-medium">{activeTeacher.designation || 'Faculty Member'}</p>
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full tracking-wider">{activeTeacher.employee_id}</span>
                
                <div className="flex justify-center space-x-2 mt-4">
                  <button onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/${activeTeacher.id}/download?token=${token}`)} className="px-3 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">Download</button>
                  {role === 'SUPER_ADMIN' && (
                    <>
                      <button onClick={() => setShowEditModal(true)} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Edit</button>
                      <button onClick={() => handleDeleteClick(activeTeacher.id)} className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Delete</button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">Information</h4>
                 <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                    <div className="flex items-center text-sm"><Mail size={16} className="text-rose-400 mr-3" /> <span className="font-semibold">{activeTeacher.email}</span></div>
                    {activeTeacher.phone && <div className="flex items-center text-sm"><span className="font-semibold text-slate-600 mr-2">Phone:</span> <span className="font-semibold">{activeTeacher.phone}</span></div>}
                    {activeTeacher.address && <div className="flex items-center text-sm"><span className="font-semibold text-slate-600 mr-2">Address:</span> <span className="font-semibold">{activeTeacher.address}</span></div>}
                    <div className="flex items-center text-sm"><ShieldCheck size={16} className="text-emerald-500 mr-3" /> <span className="font-semibold">{activeTeacher.qualifications || 'N/A'}</span></div>
                    <div className="flex items-center text-sm"><Calendar size={16} className="text-amber-500 mr-3" /> <span className="font-semibold">Joined {activeTeacher.hire_date ? new Date(activeTeacher.hire_date).toLocaleDateString() : 'N/A'}</span></div>
                 </div>

                 {/* Document Storage */}
                 <div className="p-4 bg-slate-50 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center"><FileText size={16} className="mr-2"/> Documents</h4>
                      <label className="cursor-pointer text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center">
                        <UploadCloud size={14} className="mr-1"/> Upload
                        <input type="file" className="hidden" onChange={handleUploadDoc} />
                      </label>
                    </div>
                    {activeTeacher.documents && activeTeacher.documents.length > 0 ? activeTeacher.documents.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-200 last:border-0">
                        <span className="truncate flex-1 font-medium">{doc.title}</span>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs font-bold">View</a>
                      </div>
                    )) : <p className="text-xs text-slate-400 font-medium italic">No documents uploaded.</p>}
                 </div>

                 {/* Performance */}
                 {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                   <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                     <h4 className="text-sm font-bold text-amber-800 flex items-center mb-4"><Star size={16} className="mr-2"/> Performance Evaluations</h4>
                     <div className="max-h-40 overflow-y-auto mb-4 space-y-2">
                       {activeTeacher.evaluations?.map(ev => (
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
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Teacher Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && role === 'TEACHER' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 max-w-md w-full shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                  <Fingerprint className="mr-3 text-emerald-500" /> Attendance
                </h2>
                <button onClick={() => setShowAttendanceModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"><X size={20} className="text-slate-400" /></button>
              </div>
              
              <button 
                onClick={handleMarkAttendance} 
                disabled={markingAttendance}
                className="w-full h-16 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center text-lg mb-8 transition-all disabled:opacity-50"
              >
                {markingAttendance ? <Loader2 className="animate-spin mr-2" /> : <Clock className="mr-2" />}
                {markingAttendance ? 'Recording...' : 'Clock In Now'}
              </button>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recent History</h3>
                {attendanceHistory.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No records found.</p>
                ) : (
                  attendanceHistory.map(record => (
                    <div key={record.id} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3"></div>
                        <span className="font-semibold text-slate-700">{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{new Date(record.date).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Teacher Modal */}
      <AnimatePresence>
        {showAddModal && role === 'SUPER_ADMIN' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Add New Teacher</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <input name="email" type="email" placeholder="Email Address" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="password" type="password" placeholder="Password" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="first_name" type="text" placeholder="First Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                  <input name="last_name" type="text" placeholder="Last Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                </div>
                <input name="designation" type="text" placeholder="Designation" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="phone" type="text" placeholder="Phone" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="address" type="text" placeholder="Address" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="dob" type="date" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="employee_id" type="text" placeholder="Employee ID (e.g., T-001)" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="qualifications" type="text" placeholder="Qualifications (e.g., MSc Physics)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="hire_date" type="date" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:bg-blue-600 shadow-lg">Save Teacher</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Edit Teacher Modal */}
      <AnimatePresence>
        {showEditModal && role === 'SUPER_ADMIN' && activeTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Edit Teacher</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input name="first_name" defaultValue={activeTeacher.first_name} type="text" placeholder="First Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                  <input name="last_name" defaultValue={activeTeacher.last_name} type="text" placeholder="Last Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                </div>
                <input name="designation" defaultValue={activeTeacher.designation} type="text" placeholder="Designation" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="phone" defaultValue={activeTeacher.phone} type="text" placeholder="Phone" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="address" defaultValue={activeTeacher.address} type="text" placeholder="Address" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="dob" defaultValue={activeTeacher.dob ? activeTeacher.dob.substring(0, 10) : ''} type="date" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="employee_id" defaultValue={activeTeacher.employee_id} type="text" placeholder="Employee ID (e.g., T-001)" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="qualifications" defaultValue={activeTeacher.qualifications} type="text" placeholder="Qualifications (e.g., MSc Physics)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="hire_date" defaultValue={activeTeacher.hire_date ? activeTeacher.hire_date.substring(0, 10) : ''} type="date" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <div className="flex justify-end space-x-3 mt-8">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:bg-blue-600 shadow-lg">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Dialog
        isOpen={deleteDialogConfig.isOpen}
        onClose={() => setDeleteDialogConfig({isOpen: false, teacherId: null})}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone and will remove their record from the faculty directory."
        type="CONFIRM"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
