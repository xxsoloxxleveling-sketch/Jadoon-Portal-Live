import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  GraduationCap, 
  Briefcase,
  Settings, 
  Search, 
  Bell, 
  LogOut,
  Banknote,
  Receipt
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'classes', label: 'Workspace', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'fees', label: 'Fee Challans', icon: FileText },
  { id: 'teachers', label: 'Teachers', icon: Briefcase },
  { id: 'employees', label: 'Staff', icon: Users },
  { id: 'payroll', label: 'Payroll', icon: Banknote },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Shell() {
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[1] || 'dashboard';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  React.useEffect(() => {
    if (!token) return;
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUserInfo(data);
      })
      .catch(console.error);

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setNotifications(data);
      })
      .catch(console.error);
  }, [token]);

  const handleMarkRead = async () => {
    if (!token) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/notifications/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({...n, isRead: true})));
    } catch (err) {
      console.error(err);
    }
  };

  const onLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
      {/* Floating Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-64 m-6 mr-0 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col z-20"
      >
        <div className="p-8 flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden border border-slate-100">
            <img src="/Logo.jpeg" alt="Jadoon Portal Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">Jadoon PS</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            if (userInfo?.role === 'TEACHER' && !['dashboard', 'attendance', 'students'].includes(item.id)) return null;

            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50/80 text-[var(--color-primary)] font-semibold shadow-sm border-l-4 border-[var(--color-primary)]' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium border-l-4 border-transparent'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[var(--color-primary)]' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-24 px-8 flex items-center justify-between z-10">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search students, teachers, or IDs..." 
                className="w-full h-12 pl-12 pr-4 bg-white rounded-2xl border-none shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:outline-none transition-all text-sm font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 ml-8">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer active:scale-95">
                <Bell size={24} />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[var(--color-background)]"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <button onClick={handleMarkRead} className="text-xs text-[var(--color-primary)] hover:underline font-semibold">Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">No notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                          <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{n.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <div 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 cursor-pointer p-1.5 pr-4 rounded-full hover:bg-white/50 transition-colors">
                <img 
                  src={`https://ui-avatars.com/api/?name=${userInfo ? userInfo.name.replace(/ /g, '+') : 'User'}&background=c7d2fe&color=3730a3`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div className="hidden md:block text-sm">
                  <p className="font-semibold text-slate-900">{userInfo ? userInfo.name : 'Loading...'}</p>
                  <p className="text-slate-500 text-xs font-medium">{userInfo ? userInfo.role.replace('_', ' ') : 'User'}</p>
                </div>
              </div>
              
              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-2">
                  <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center">
                    <Settings size={16} className="mr-2" /> Settings
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button onClick={onLogout} className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 text-sm font-medium flex items-center">
                    <LogOut size={16} className="mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-8 pb-8">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
