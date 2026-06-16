import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Users, UserCheck, Wallet, UserCog, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/useStore';

const TODAY_TEXT = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const FORMATTED_DATE = new Date().toISOString().split('T')[0];

export default function Dashboard() {
  const token = useAuthStore(state => state.token);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [todaysPercentage, setTodaysPercentage] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [feeCollection, setFeeCollection] = useState<number>(0);
  const [activeStaff, setActiveStaff] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // We only fetch summary since the DB doesn't have 7 days of historical seed data yet
    // The chart will show a mock curve mixed with our real single-day point.
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/dashboard/stats?date=${FORMATTED_DATE}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setTotalStudents(data.totalStudents);
          setTodaysPercentage(data.todaysPercentage);
          setFeeCollection(data.feeCollection);
          setActiveStaff(data.activeStaff);
          setAttendanceTrend(data.attendanceTrend);
          setRecentActivities(data.recentActivities);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning</h1>
        <p className="text-slate-500 mt-1 font-medium">{TODAY_TEXT}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-md">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-[var(--color-primary)]">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{totalStudents.toLocaleString()}</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-md">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
              <div className="flex items-center space-x-2 mt-1">
                <h2 className="text-3xl font-bold text-slate-900">{todaysPercentage}%</h2>
                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  <TrendingUp size={12} className="mr-1" /> LIVE
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-md">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-[var(--color-accent)]">
              <Wallet size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Fee Collection</p>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{feeCollection}%</h2>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-white/90 backdrop-blur-md">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <UserCog size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Staff</p>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{activeStaff}</h2>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Attendance Trends</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Simulated historical + live metric</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-md hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Activities</h3>
            <div className="space-y-6">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No recent activities found.</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-colors">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      activity.type === 'fee' ? 'bg-amber-500' :
                      activity.type === 'attendance' ? 'bg-emerald-500' :
                      activity.type === 'leave' ? 'bg-rose-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm text-slate-900 font-medium">
                        <span className="font-bold">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
