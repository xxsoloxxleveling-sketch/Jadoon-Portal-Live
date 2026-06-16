import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'motion/react';
import { Users, GripVertical, CheckCircle2, Loader2, Save, Plus } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

interface StudentData {
  id: string;
  name: string;
  admission_number: string;
  avatarId: number;
}

interface ClassData {
  id: string;
  name: string;
  _count: { students: number };
}

const DraggableStudent: React.FC<{ student: StudentData }> = ({ student }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: student.id,
    data: student,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`relative flex items-center p-4 mb-3 bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all
        ${isDragging ? 'ring-2 ring-[var(--color-primary)] scale-105 cursor-grabbing' : 'cursor-grab'}
      `}
    >
      <div {...listeners} className="mr-4 text-slate-300 hover:text-slate-500 transition-colors cursor-grab p-2 rounded-xl hover:bg-slate-100">
        <GripVertical size={20} />
      </div>
      <img src={`https://i.pravatar.cc/150?img=${student.avatarId}`} className="w-12 h-12 rounded-2xl object-cover shadow-sm mr-4" alt="avatar" />
      <div>
        <h3 className="font-bold text-slate-900 text-sm">{student.name}</h3>
        <p className="font-mono text-xs text-slate-500 mt-0.5">{student.admission_number}</p>
      </div>
    </div>
  );
};

const DroppableBucket = ({ 
  enrolledStudents, 
  existingStudents,
  capacity,
  targetClass
}: { 
  enrolledStudents: StudentData[], 
  existingStudents: StudentData[],
  capacity: number,
  targetClass: ClassData | null
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'class_bucket' });

  const currentCount = targetClass ? existingStudents.length + enrolledStudents.length : existingStudents.length + enrolledStudents.length;
  const progress = (currentCount / capacity) * 100;
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

  return (
    <div
      ref={targetClass ? setNodeRef : undefined}
      className={`min-h-[600px] h-full rounded-[40px] p-8 flex flex-col transition-all duration-500 
        ${!targetClass ? 'bg-slate-50/50 grayscale opacity-50' : isOver ? 'bg-indigo-50/50 ring-4 ring-indigo-200 shadow-indigo-100' : 'bg-slate-50 border-2 border-dashed border-slate-200'}
      `}
    >
      <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-200 border-dashed">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {targetClass ? targetClass.name : 'Select a Class'}
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Target Bucket</p>
        </div>
        
        {/* SVG Progress Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="8" />
            <motion.circle 
              cx="50" cy="50" r={radius} fill="none" 
              stroke={targetClass ? "var(--color-primary)" : "#E2E8F0"} 
              strokeWidth="8" 
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ strokeDasharray: circumference }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-sm font-bold text-slate-900">{currentCount}</span>
            <span className="text-[10px] text-slate-500 font-bold">/{capacity}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {!targetClass ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p className="font-semibold text-lg">No Class Selected</p>
            <p className="text-sm mt-2">Select or create a class above first.</p>
          </div>
        ) : existingStudents.length === 0 && enrolledStudents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="font-semibold text-lg">Drop students here</p>
            <p className="text-sm mt-2">Build your class roster</p>
          </div>
        ) : (
          <AnimatePresence>
            {existingStudents.map((student) => (
              <motion.div
                key={`exist-${student.id}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white/60 p-4 rounded-3xl shadow-sm flex items-center justify-between border border-slate-200 grayscale-[20%]"
              >
                <div className="flex items-center">
                  <img src={`https://i.pravatar.cc/150?img=${student.avatarId}`} className="w-10 h-10 rounded-xl object-cover shadow-sm mr-4 opacity-80" alt="avatar" />
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">{student.name}</h3>
                    <p className="font-mono text-xs text-slate-500">{student.admission_number}</p>
                  </div>
                </div>
                <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-xl text-xs font-bold">
                  Enrolled
                </div>
              </motion.div>
            ))}
            {enrolledStudents.map((student) => (
              <motion.div
                key={`enroll-${student.id}`}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between border border-slate-100"
              >
                <div className="flex items-center">
                  <img src={`https://i.pravatar.cc/150?img=${student.avatarId}`} className="w-10 h-10 rounded-xl object-cover shadow-sm mr-4" alt="avatar" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{student.name}</h3>
                    <p className="font-mono text-xs text-slate-500">{student.admission_number}</p>
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl flex items-center space-x-1 px-3">
                  <CheckCircle2 size={16} />
                  <span className="text-xs font-bold">New</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

export default function ClassManager() {
  const [unassigned, setUnassigned] = useState<StudentData[]>([]);
  const [enrolled, setEnrolled] = useState<StudentData[]>([]);
  const [existingStudents, setExistingStudents] = useState<StudentData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const token = useAuthStore((state) => state.token);

  const CAPACITY = 35;
  const targetClass = classes.find(c => c.id === selectedClassId) || null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students?unassigned=true`, { headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }, cache: 'no-store' }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/academic/classes`, { headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }, cache: 'no-store' })
        ]);
        
        const studentsData = await studentsRes.json();
        const classesData = await classesRes.json();
        
        const mapped = studentsData.map((s: any, i: number) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          admission_number: s.admission_number,
          avatarId: (i % 50) + 1
        }));
        
        setUnassigned(mapped);
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClassId(classesData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!selectedClassId) {
      setExistingStudents([]);
      return;
    }
    const fetchExisting = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students?class_id=${selectedClassId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' },
          cache: 'no-store'
        });
        const data = await res.json();
        const mapped = data.map((s: any, i: number) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          admission_number: s.admission_number,
          avatarId: (i % 50) + 1
        }));
        setExistingStudents(mapped);
      } catch (err) {
        console.error('Failed to fetch existing students', err);
      }
    };
    fetchExisting();
  }, [selectedClassId, token]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && over.id === 'class_bucket' && targetClass) {
      const currentCount = existingStudents.length + enrolled.length;
      if (currentCount >= CAPACITY) return alert("Class is at full capacity!");

      const student = unassigned.find(s => s.id === active.id);
      if (student) {
        setUnassigned(unassigned.filter(s => s.id !== active.id));
        setEnrolled([...enrolled, student]);
      }
    }
  };

  const handleCreateClass = async () => {
    const name = prompt("Enter Class Name (e.g., Jadoon High - 10th Grade):");
    if (!name) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/academic/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      const newClass = await res.json();
      setClasses([...classes, { ...newClass, _count: { students: 0 } }]);
      setSelectedClassId(newClass.id);
    } catch (err) {
      alert("Failed to create class");
    }
  };

  const handleBatchEnroll = async () => {
    if (enrolled.length === 0 || !targetClass) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/students/classes/${targetClass.id}/enroll-batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ student_ids: enrolled.map(s => s.id) })
      });
      const payload = await res.json();
      alert(payload.message || 'Enrollment transaction submitted.');
      
      // Reset bucket
      setClasses(classes.map(c => c.id === targetClass.id ? { ...c, _count: { students: existingStudents.length + enrolled.length } } : c));
      setExistingStudents([...existingStudents, ...enrolled]);
      setEnrolled([]);
    } catch (err) {
      alert("Failed to submit enrollment payload.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-24 text-[var(--color-primary)]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Workspace Builder</h1>
          <p className="text-slate-500 mt-1 font-medium">Dynamically instantiate and populate Class logic models</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCreateClass}
            className="h-12 px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl shadow-sm flex items-center space-x-2 font-semibold transition-all text-slate-700"
          >
            <Plus size={18} />
            <span>New Drop Target</span>
          </button>

          <button 
            onClick={handleBatchEnroll}
            disabled={saving || enrolled.length === 0}
            className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-2xl shadow-lg flex items-center space-x-3 font-semibold transition-all disabled:opacity-50 h-12"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>Lock Deployment</span>
          </button>
        </div>
      </div>

      {classes.length > 0 && (
        <div className="flex items-center space-x-4 overflow-x-auto pb-4 mb-4 scrollbar-hide py-2">
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedClassId(c.id);
                setEnrolled([]); 
              }}
              className={`flex-shrink-0 flex flex-col justify-center px-6 py-4 rounded-[24px] transition-all text-left border-2 min-w-[200px]
                ${selectedClassId === c.id 
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-xl shadow-[var(--color-primary)]/10 scale-105' 
                  : 'border-white bg-white/60 backdrop-blur-md hover:border-[var(--color-primary)]/30 hover:shadow-md'
                }`}
            >
              <div className="flex items-center justify-between space-x-4 mb-2">
                <span className={`font-bold text-base ${selectedClassId === c.id ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>{c.name}</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-black tracking-wider ${c._count.students >= CAPACITY ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                  {c._count.students}/{CAPACITY}
                </span>
              </div>
              <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-1 overflow-hidden">
                <div className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all" style={{ width: `${Math.min((c._count.students / CAPACITY) * 100, 100)}%` }}></div>
              </div>
            </button>
          ))}
        </div>
      )}

      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-hidden">
          <div className="flex flex-col bg-slate-50/50 border border-slate-100 rounded-[40px] overflow-hidden p-6 relative">
            <h3 className="font-bold text-slate-800 text-lg mb-6 sticky top-0 bg-transparent z-10 px-2">Unassigned Roster</h3>
            <div className="flex-1 overflow-y-auto px-2 pb-20 scrollbar-hide">
              {unassigned.map(student => (
                <DraggableStudent key={student.id} student={student} />
              ))}
            </div>
          </div>

          <DroppableBucket enrolledStudents={enrolled} existingStudents={existingStudents} capacity={CAPACITY} targetClass={targetClass} />
        </div>
      </DndContext>
    </div>
  );
}
