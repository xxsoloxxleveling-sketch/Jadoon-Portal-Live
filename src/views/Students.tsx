import React, { useState } from 'react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Users, Loader2, X, FileText, CheckCircle2, ChevronRight, Activity, Calendar, UploadCloud, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/useStore';
import { Dialog } from '@/src/components/ui/Dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  guardian_name: string;
  guardian_phone: string;
  gender: string;
}

interface ProfileDetails extends Student {
  fee_challans?: Array<{ id: string, amount_due: number, status: string, due_date: string }>;
  attendances?: Array<{ id: string, status: string, date: string }>;
  documents?: Array<{ id: string, title: string, url: string }>;
}

export default function Students() {
  const token = useAuthStore(state => state.token);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogConfig, setDeleteDialogConfig] = useState<{isOpen: boolean, studentId: string | null}>({isOpen: false, studentId: null});
  const role = useAuthStore((state) => state.role);

  const queryClient = useQueryClient();

  const { data: students = [], isLoading: loading } = useQuery({
    queryKey: ['students', filterType],
    queryFn: async () => {
      let url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students`;
      if (filterType === 'ORPHAN') url += '?is_orphan=true';
      if (filterType === 'NEEDY') url += '?is_needy=true';

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    },
    enabled: !!token
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['student', activeStudentId],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students/${activeStudentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!activeStudentId && !!token
  });

  const addMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Unknown Server Error');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddModal(false);
    },
    onError: (err: any) => {
      alert("Registration Failed: " + err.message);
    }
  });

  const editMutation = useMutation({
    mutationFn: async (formData: any) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students/${profile?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', activeStudentId] });
      setShowEditModal(false);
    },
    onError: (err: any) => {
      alert("Update Failed: " + err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      closeProfile();
      setDeleteDialogConfig({isOpen: false, studentId: null});
    },
    onError: (err: any) => {
      alert("Delete Failed: " + err.message);
      setDeleteDialogConfig({isOpen: false, studentId: null});
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    if (data.sibling_ids) {
      data.sibling_ids = (data.sibling_ids as string).split(',').map(s => s.trim()).filter(Boolean) as any;
    }
    addMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(fd.entries());
    if (data.sibling_ids) {
      data.sibling_ids = (data.sibling_ids as string).split(',').map(s => s.trim()).filter(Boolean) as any;
    }
    editMutation.mutate(data);
  };

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeStudentId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('student_id', activeStudentId);
    fd.append('title', file.name);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) queryClient.invalidateQueries({ queryKey: ['student', activeStudentId] });
      else alert('Failed to upload document');
    } catch (err) {}
  };

  const handleDeleteClick = (id: string) => {
    setDeleteDialogConfig({isOpen: true, studentId: id});
  };

  const confirmDelete = () => {
    if (deleteDialogConfig.studentId) {
      deleteMutation.mutate(deleteDialogConfig.studentId);
    }
  };

  const closeProfile = () => {
    setActiveStudentId(null);
  };

  const handleDownloadProfile = async (id: string, firstName: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students/${id}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Student_Profile_${firstName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download profile");
    }
  };

  if (loading) return <div className="flex items-center justify-center p-24 text-[var(--color-primary)]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="relative h-full flex overflow-hidden">
      <div className="flex-1 space-y-8 pr-4 overflow-y-auto">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Student Directory</h1>
            <p className="text-slate-500 mt-1 font-medium">Select a student row to view customized contextual profiles</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              <option value="ALL">All Students</option>
              <option value="ORPHAN">Orphans Only</option>
              <option value="NEEDY">Needy / Zakat Only</option>
            </select>
            {role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-lg flex items-center">
                + New Student
              </button>
            )}
          </div>
        </div>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-semibold uppercase tracking-wider">
                    <th className="p-6">Student Info</th>
                    <th className="p-6">Admission No</th>
                    <th className="p-6">Guardian (Decrypted)</th>
                    <th className="p-6">Contact (Decrypted)</th>
                    <th className="p-6">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.filter((s: any) => {
                    if (!searchTerm) return true;
                    const q = searchTerm.toLowerCase();
                    return s.first_name.toLowerCase().includes(q) || 
                           s.last_name.toLowerCase().includes(q) || 
                           (s.admission_number && s.admission_number.toLowerCase().includes(q));
                  }).map((student: any, index: number) => (
                    <motion.tr 
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setActiveStudentId(student.id)}
                      className={`cursor-pointer transition-colors ${activeStudentId === student.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'} `}
                    >
                      <td className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[var(--color-primary)] shadow-inner">
                            <Users size={20} />
                          </div>
                          <span className="font-bold text-slate-900">{student.first_name} {student.last_name}</span>
                        </div>
                      </td>
                      <td className="p-6"><span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">{student.admission_number}</span></td>
                      <td className="p-6 font-semibold text-slate-700">{student.guardian_name}</td>
                      <td className="p-6 font-medium text-slate-500">{student.guardian_phone}</td>
                      <td className="p-6 text-slate-400"><ChevronRight size={20} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <div className="p-12 text-center text-slate-500 font-medium">No students found. Are you sure you seeded the database?</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Slide-out Contextual Profile */}
      <AnimatePresence>
        {activeStudentId && (
          <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-96 shrink-0 bg-white/90 backdrop-blur-2xl border-l border-white/50 shadow-[-10px_0_40px_rgba(0,0,0,0.05)] flex flex-col h-full -my-8 -mr-8 py-8 px-6 rounded-l-[40px] z-20"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 flex items-center"><Activity size={20} className="mr-2 text-[var(--color-primary)]" /> Detailed Profile</h2>
              <button onClick={closeProfile} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>

            {loadingProfile || !profile ? (
               <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin w-8 h-8 text-[var(--color-primary)]" /></div>
            ) : (
               <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                 <div className="text-center space-y-2">
                   <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-[var(--color-primary)]">
                      <Users size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900">{profile.first_name} {profile.last_name}</h3>
                   <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full tracking-wider">#{profile.admission_number}</span>
                   
                   <div className="flex justify-center space-x-2 mt-4">
                     {role === 'SUPER_ADMIN' && (
                       <>
                         <button onClick={() => setShowEditModal(true)} className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Edit</button>
                         <button onClick={() => handleDeleteClick(profile.id)} className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Delete</button>
                       </>
                     )}
                     <button onClick={() => handleDownloadProfile(profile.id, profile.first_name)} className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center">
                       <FileText size={14} className="mr-1" /> Download Profile
                     </button>
                   </div>
                 </div>

                 {/* Document Storage */}
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center"><FileText size={16} className="mr-2"/> Documents</h4>
                      <label className="cursor-pointer text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center">
                        <UploadCloud size={14} className="mr-1"/> Upload
                        <input type="file" className="hidden" onChange={handleUploadDoc} />
                      </label>
                    </div>
                    {profile.documents && profile.documents.length > 0 ? profile.documents.map(doc => (
                      <div key={doc.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-200 last:border-0">
                        <span className="truncate flex-1 font-medium">{doc.title}</span>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs font-bold">View</a>
                      </div>
                    )) : <p className="text-xs text-slate-400 font-medium italic">No documents uploaded.</p>}
                 </div>

                 {/* Role-Based Rendering Sections */}
                 {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
                   <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center"><FileText size={14} className="mr-2" /> Financial Status</h4>
                     {profile.fee_challans && profile.fee_challans.length > 0 ? (
                       profile.fee_challans.map(fee => (
                         <div key={fee.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-slate-100 transition-colors">
                           <div>
                             <p className="font-bold text-slate-900 text-sm flex items-center">
                               Rs. {fee.amount_due} 
                               {fee.status === 'PAID' ? <CheckCircle2 size={14} className="ml-2 text-emerald-500" /> : <X size={14} className="ml-2 text-rose-500" />}
                             </p>
                             <p className="text-xs text-slate-500 font-medium">Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                           </div>
                           <span className={`px-2 py-1 text-[10px] font-black tracking-wider rounded-md ${fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{fee.status}</span>
                         </div>
                       ))
                     ) : <p className="text-sm text-slate-400 font-medium italic">No fee records linked.</p>}
                   </div>
                 )}

                 {(role === 'TEACHER' || role === 'SUPER_ADMIN') && (
                   <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center"><Calendar size={14} className="mr-2" /> Attendance History</h4>
                     {profile.attendances && profile.attendances.length > 0 ? (
                       profile.attendances.map(att => (
                         <div key={att.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">{new Date(att.date).toLocaleDateString()}</span>
                            <span className={`w-2 h-2 rounded-full ${att.status === 'PRESENT' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : att.status === 'ABSENT' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                         </div>
                       ))
                     ) : <p className="text-sm text-slate-400 font-medium italic">No attendance records generated yet.</p>}
                   </div>
                 )}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Add New Student</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input name="email" type="email" placeholder="Student Email (Optional)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <input name="password" type="password" placeholder="Password (Optional)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input name="first_name" type="text" placeholder="First Name" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="last_name" type="text" placeholder="Last Name" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              </div>
              <input name="admission_number" type="text" placeholder="Admission Number (Optional)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input name="dob" type="date" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <select name="gender" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="blood_group" type="text" placeholder="Blood Group" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="sibling_ids" type="text" placeholder="Sibling IDs (Comma sep)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              </div>
              <input name="guardian_name" type="text" placeholder="Guardian Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <input name="guardian_phone" type="text" placeholder="Guardian Phone" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <textarea name="address" placeholder="Address" className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"></textarea>
              <div className="flex space-x-6 items-center">
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" name="is_orphan" value="true" className="w-5 h-5 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  <span>Is Orphan</span>
                </label>
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" name="is_needy" value="true" className="w-5 h-5 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  <span>Is Needy / Zakat</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:bg-blue-600 shadow-lg">Save Student</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showEditModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Edit Student</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="first_name" defaultValue={profile.first_name} type="text" placeholder="First Name" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="last_name" defaultValue={profile.last_name} type="text" placeholder="Last Name" required className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              </div>
              <input name="admission_number" defaultValue={profile.admission_number} type="text" placeholder="Admission Number (Optional)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input name="dob" defaultValue={profile.dob ? profile.dob.substring(0, 10) : ''} type="date" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <select name="gender" defaultValue={profile.gender || ''} className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="blood_group" defaultValue={(profile as any).blood_group || ''} type="text" placeholder="Blood Group" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
                <input name="sibling_ids" defaultValue={((profile as any).sibling_ids || []).join(', ')} type="text" placeholder="Sibling IDs (Comma sep)" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              </div>
              <input name="guardian_name" defaultValue={profile.guardian_name || ''} type="text" placeholder="Guardian Name" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <input name="guardian_phone" defaultValue={profile.guardian_phone || ''} type="text" placeholder="Guardian Phone" className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none" />
              <textarea name="address" defaultValue={(profile as any).address || ''} placeholder="Address" className="w-full h-24 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"></textarea>
              <div className="flex space-x-6 items-center">
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" name="is_orphan" value="true" defaultChecked={(profile as any).is_orphan} className="w-5 h-5 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  <span>Is Orphan</span>
                </label>
                <label className="flex items-center space-x-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" name="is_needy" value="true" defaultChecked={(profile as any).is_needy} className="w-5 h-5 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                  <span>Is Needy / Zakat</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:bg-blue-600 shadow-lg">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Dialog
        isOpen={deleteDialogConfig.isOpen}
        onClose={() => setDeleteDialogConfig({isOpen: false, studentId: null})}
        title="Delete Student"
        message="Are you sure you want to delete this student and all related records? This action cannot be undone."
        type="CONFIRM"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
