import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, CheckCircle2, XCircle, AlertCircle, Loader2, Save } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE';

interface GridStudent {
  student_id: string;
  name: string;
  admission_number: string;
  status: AttendanceStatus;
  avatarId: number;
}

export default function Attendance() {
  const [students, setStudents] = useState<GridStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const cReq = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/academic/classes`, { headers: { 'Authorization': `Bearer ${token}` }});
        const cData = await cReq.json();
        setClasses(cData);
        if (cData.length > 0) {
          setClassId(cData[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, [token]);

  useEffect(() => {
    if (!classId) return;
    const fetchGrid = async () => {
      setLoading(true);
      try {
        const gridReq = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/grid/${classId}`, { headers: { 'Authorization': `Bearer ${token}` }});
        const gridData = await gridReq.json();
        
        setStudents(gridData.grid.map((s: any, i: number) => ({
          ...s,
          avatarId: (i % 50) + 1 
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrid();
  }, [classId, token]);

  const cycleStatus = (id: string, currentStatus: AttendanceStatus) => {
    const role = localStorage.getItem('user_role');
    let next: AttendanceStatus = 'PRESENT';
    
    if (role === 'TEACHER') {
      if (currentStatus === 'PRESENT') next = 'ABSENT';
      else next = 'PRESENT';
    } else {
      if (currentStatus === 'PRESENT') next = 'ABSENT';
      else if (currentStatus === 'ABSENT') next = 'LEAVE';
      else if (currentStatus === 'LEAVE') next = 'PRESENT';
    }

    setStudents(students.map(s => s.student_id === id ? { ...s, status: next } : s));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/attendance/fast-entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          class_id: classId,
          date: new Date(selectedDate).toISOString(),
          records: students.map(s => ({ student_id: s.student_id, status: s.status }))
        })
      });
      const data = await res.json();
      alert(data.message || 'Saved successfully');
    } catch (err) {
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-600', fill: 'bg-emerald-500', name: 'Present', icon: CheckCircle2 };
      case 'ABSENT': return { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-600', fill: 'bg-rose-500', name: 'Absent', icon: XCircle, dim: true };
      case 'LEAVE': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-600', fill: 'bg-amber-500', name: 'Leave', icon: AlertCircle };
    }
  };

  return (
    <div className="space-y-8 relative min-h-full pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Swipe & Go Attendance</h1>
          <p className="text-slate-500 mt-1 font-medium">Bespoke Fast-Entry Glassmorphic Grid</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <div className="relative w-full sm:w-auto shrink-0">
            <select
              aria-label="Select Class"
              title="Select Class"
              value={classId || ''}
              onChange={(e) => setClassId(e.target.value)}
              className="h-12 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-lg focus:ring-2 focus:ring-[var(--color-primary)]/20 shadow-sm font-bold text-slate-700 outline-none w-full appearance-none cursor-pointer"
            >
              {classes.length === 0 && <option value="">No Classes Found</option>}
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-12 px-4 rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-lg focus:ring-2 focus:ring-[var(--color-primary)]/20 shadow-sm font-bold text-slate-700 w-full sm:w-auto"
          />
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white/60 backdrop-blur-lg rounded-2xl border border-white focus:ring-2 focus:ring-[var(--color-primary)]/20 shadow-sm font-medium"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24 text-[var(--color-primary)]">
          <Loader2 className="animate-spin" size={48} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {filteredStudents.map((student, i) => {
              const config = getStatusConfig(student.status);
              const SvgIcon = config.icon;
              return (
                <motion.div
                  key={student.student_id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: config.dim ? 0.6 : 1, scale: config.dim ? 0.95 : 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => cycleStatus(student.student_id, student.status)}
                  className={`relative cursor-pointer select-none rounded-3xl p-4 transition-all duration-300 border backdrop-blur-xl shadow-lg hover:shadow-xl flex flex-col items-center text-center overflow-hidden
                    ${config.bg} ${config.border}
                  `}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${config.fill} opacity-50`} />
                  
                  <div className="relative w-16 h-16 mb-3">
                    <img 
                      src={`https://i.pravatar.cc/150?img=${student.avatarId}`} 
                      className={`w-full h-full rounded-2xl object-cover shadow-sm ${config.dim ? 'grayscale' : ''}`}
                      alt="avatar"
                    />
                    <div className={`absolute -bottom-2 -right-2 p-1 rounded-full bg-white shadow-sm ${config.text}`}>
                      <SvgIcon size={16} className="fill-current text-white" />
                    </div>
                  </div>

                  <h3 className={`font-bold text-sm tracking-tight ${config.dim ? 'text-slate-500' : 'text-slate-900'} line-clamp-1`}>
                    {student.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 mt-1">{student.admission_number}</p>

                  <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold w-full ${config.fill} text-white`}>
                    {config.name}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSave}
        disabled={saving || loading}
        className="fixed bottom-8 right-8 z-50 flex items-center space-x-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] font-semibold tracking-wide border border-slate-700/50"
      >
        {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
        <span>Submit Daily Roster</span>
      </motion.button>
    </div>
  );
}
