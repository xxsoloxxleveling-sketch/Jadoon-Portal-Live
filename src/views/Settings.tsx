import React, { useState, useEffect } from 'react';
import { Save, Building2, Lock, Bell, Mail, ShieldAlert, Loader2, Activity, Users, CalendarCheck } from 'lucide-react';
import { useAuthStore } from '../store/useStore';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  role: string;
  performed_by: string;
  details: string;
  timestamp: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [teacherLogs, setTeacherLogs] = useState<any[]>([]);
  const [loadingTeacherLogs, setLoadingTeacherLogs] = useState(false);
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminCreationMsg, setAdminCreationMsg] = useState('');

  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (activeTab === 'audit' && role === 'SUPER_ADMIN') {
      const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/audit`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setLogs(await res.json());
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab, role, token]);

  useEffect(() => {
    if (activeTab === 'teacherLogs' && role !== 'TEACHER') {
      const fetchTeacherLogs = async () => {
        setLoadingTeacherLogs(true);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/attendance/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setTeacherLogs(await res.json());
        } catch (err) { }
        finally { setLoadingTeacherLogs(false); }
      };
      fetchTeacherLogs();
    }
  }, [activeTab, role, token]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminCreationMsg('Creating...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: newAdminEmail, password: newAdminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdminCreationMsg('Admin created successfully!');
      setNewAdminEmail('');
      setNewAdminPassword('');
    } catch (err: any) {
      setAdminCreationMsg(err.message || 'Failed to create admin');
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage deployment variables and security contexts</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Settings Sidebar */}
        <div className="w-full lg:w-64 space-y-2 shrink-0">
          {[
            { id: 'general', icon: Building2, label: 'Institution Profile' },
            ...(role === 'SUPER_ADMIN' ? [{ id: 'admins', icon: Users, label: 'Admin Management' }] : []),
            { id: 'teacherLogs', icon: CalendarCheck, label: 'Teacher Attendance' },
            { id: 'security', icon: Lock, label: 'Access & Security' },
            { id: 'notifications', icon: Bell, label: 'Sms Gateway' },
            { id: 'smtp', icon: Mail, label: 'Email SMTP' },
            { id: 'audit', icon: ShieldAlert, label: 'Audit Logs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all font-semibold ${
                activeTab === tab.id 
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-primary/20' 
                  : 'bg-white/60 text-slate-600 hover:bg-white'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/40 p-8 rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-100 pb-4">Institution Profile</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">School Name</label>
                  <input type="text" defaultValue="Jadoon Public High School & College" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Registration ID</label>
                  <input type="text" defaultValue="JPHS-1994-XP" className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Campus Address</label>
                <textarea rows={3} defaultValue="Main Mansehra Road, Mandian, Abbottabad" className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium resize-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow mt-4 flex items-center space-x-2 font-bold hover:bg-black transition-colors">
                  <Save size={18} />
                  <span>Push Configurations</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'admins' && role === 'SUPER_ADMIN' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-100 pb-4">Create Administrator</h3>
              <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
                {adminCreationMsg && <div className="p-3 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl border border-blue-100">{adminCreationMsg}</div>}
                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-bold text-slate-700 mb-2">Admin Email</label>
                  <input id="adminEmail" type="email" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium" />
                </div>
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-bold text-slate-700 mb-2">Secure Password</label>
                  <input id="adminPassword" type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium" />
                </div>
                <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow w-full font-bold hover:bg-black transition-colors">
                  Provision Admin Account
                </button>
              </form>
            </div>
          )}

          {activeTab === 'teacherLogs' && role !== 'TEACHER' && (
            <div className="space-y-6 flex flex-col h-full max-h-[800px]">
              <h3 className="text-xl font-bold flex items-center border-b border-slate-100 pb-4"><CalendarCheck size={24} className="mr-3 text-emerald-500" /> Daily Teacher Logs</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {loadingTeacherLogs ? (
                  <div className="flex p-12 justify-center text-[var(--color-primary)]"><Loader2 className="animate-spin w-8 h-8"/></div>
                ) : teacherLogs.length === 0 ? (
                  <p className="text-center p-12 text-slate-400 font-medium">No teacher attendance records available.</p>
                ) : (
                  teacherLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col space-y-2">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                             <span className="font-bold text-slate-800">{log.email}</span>
                             <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">ID: {log.employee_id}</span>
                          </div>
                          <span className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                       </div>
                       <p className="text-sm font-medium text-emerald-600 pl-1">{log.status}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-slate-100 pb-4">Access Control & Security</h3>
              
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <h4 className="font-bold text-rose-800 flex items-center"><ShieldAlert size={18} className="mr-2" /> Global MFA Enforcement</h4>
                <p className="text-sm text-rose-600 mt-1 mb-4 font-medium">Require all Admin and Teacher roles to utilize Multi-Factor Authentication.</p>
                <div className="flex items-center space-x-3">
                  <button className="bg-rose-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-rose-700">Enable MFA Globallly</button>
                </div>
              </div>

              <div>
                <label htmlFor="jwtExp" className="block text-sm font-bold text-slate-700 mb-2">JWT Expiration Timer (Hours)</label>
                <input id="jwtExp" type="number" defaultValue="24" className="w-full max-w-[200px] h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all font-medium" />
              </div>

              <div className="pt-4 flex justify-end">
                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow mt-4 flex items-center space-x-2 font-bold hover:bg-black transition-colors">
                  <Save size={18} />
                  <span>Update Security</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audit' && role !== 'SUPER_ADMIN' && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Lock size={48} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-500">Feature Encrypted</h3>
              <p className="text-sm mt-2 font-medium">The Immutable Audit Engine requires Super Admin decryption keys.</p>
            </div>
          )}

          {activeTab === 'audit' && role === 'SUPER_ADMIN' && (
            <div className="space-y-6 flex flex-col h-full max-h-[800px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold flex items-center"><Activity size={24} className="mr-3 text-indigo-500" /> Immutable Event Log</h3>
                <div className="flex space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                   {['ALL', 'SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'].map(f => (
                     <button key={f} onClick={() => setAuditFilter(f)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${auditFilter === f ? 'bg-white shadow text-[var(--color-primary)]' : 'text-slate-500 hover:bg-white/50'}`}>{f}</button>
                   ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {loadingLogs ? (
                  <div className="flex p-12 justify-center text-[var(--color-primary)]"><Loader2 className="animate-spin w-8 h-8"/></div>
                ) : logs.filter(l => auditFilter === 'ALL' || l.role === auditFilter).length === 0 ? (
                  <p className="text-center p-12 text-slate-400 font-medium">No system activity registered under this sector.</p>
                ) : (
                  logs.filter(l => auditFilter === 'ALL' || l.role === auditFilter).map((log) => (
                    <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col space-y-2 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                           <span className={`px-2 py-1 text-[10px] font-black tracking-wider rounded-md ${log.role === 'SUPER_ADMIN' || log.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {log.role}
                           </span>
                           <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                           <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">Model: {log.entity}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 pl-1">{log.details}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Actor UUID: {log.performed_by}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {['notifications', 'smtp'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Lock size={48} className="mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-slate-500">Service Not Mounted</h3>
              <p className="text-sm mt-2 font-medium">Integration modules have not been registered.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
