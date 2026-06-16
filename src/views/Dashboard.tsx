import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Users, UserCheck, Wallet, UserCog, TrendingUp, AlertCircle, Award, Plus, FileText, Banknote, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const TODAY_TEXT = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const FORMATTED_DATE = new Date().toISOString().split('T')[0];

const PIE_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

export default function Dashboard() {
  const token = useAuthStore(state => state.token);
  const role = useAuthStore(state => state.role);
  const navigate = useNavigate();

  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [todaysPercentage, setTodaysPercentage] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [feeCollection, setFeeCollection] = useState<number>(0);
  const [activeStaff, setActiveStaff] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  
  // New functional stats
  const [cashFlow, setCashFlow] = useState<{income: number, expenses: number}>({ income: 0, expenses: 0 });
  const [defaulters, setDefaulters] = useState<{count: number, amount: number}>({ count: 0, amount: 0 });
  const [genderDemographics, setGenderDemographics] = useState<any[]>([]);
  const [lowAttendance, setLowAttendance] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  useEffect(() => {
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
          
          setCashFlow(data.cashFlow || { income: 0, expenses: 0 });
          setDefaulters(data.defaulters || { count: 0, amount: 0 });
          setGenderDemographics(data.genderDemographics || []);
          setLowAttendance(data.lowAttendance || []);
          setTopPerformers(data.topPerformers || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">{TODAY_TEXT}</p>
        </div>
        {role === 'SUPER_ADMIN' && (
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/students')} className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
              <Plus size={16} />
              <span>Add Student</span>
            </button>
            <button onClick={() => navigate('/attendance')} className="flex items-center space-x-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
              <UserCheck size={16} />
              <span>Mark Attendance</span>
            </button>
            <button onClick={() => navigate('/finances')} className="flex items-center space-x-2 bg-[var(--color-primary)] hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg">
              <Banknote size={16} />
              <span>Generate Fee</span>
            </button>
          </div>
        )}
      </div>

      {/* Warning Banners */}
      {(defaulters.count > 0 || lowAttendance.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaulters.count > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
              <AlertCircle className="text-rose-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-bold text-rose-900">Unpaid Fees Alert</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  <span className="font-bold">{defaulters.count} students</span> have pending fee challans. 
                  Total outstanding: <span className="font-bold">Rs. {defaulters.amount.toLocaleString()}</span>.
                </p>
              </div>
            </div>
          )}
          {lowAttendance.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
              <ShieldAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Low Attendance Warning</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  <span className="font-bold">{lowAttendance.length} students</span> have 3 or more absences in the last 30 days.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-md">
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

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-md">
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

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-md">
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

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 bg-white/90 backdrop-blur-md">
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
        {/* Attendance Trend Chart */}
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
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="attendance" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Demographics & Financials */}
        <div className="space-y-8">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Financial Flow (This Month)</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 font-medium">Fee Income</span>
                    <span className="font-bold text-emerald-600">Rs. {cashFlow.income.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 font-medium">Salary Expenses</span>
                    <span className="font-bold text-rose-500">Rs. {cashFlow.expenses.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-rose-500 h-2 rounded-full" style={{ width: cashFlow.income > 0 ? `${Math.min((cashFlow.expenses / cashFlow.income) * 100, 100)}%` : '0%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-md">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Student Demographics</h3>
              {genderDemographics.length > 0 ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderDemographics}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderDemographics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic mt-4">No demographic data available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performers */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-md">
          <CardContent className="p-8">
            <div className="flex items-center space-x-2 mb-6">
              <Award className="text-[var(--color-primary)]" size={24} />
              <h3 className="text-xl font-bold text-slate-900">Top Performers</h3>
            </div>
            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No evaluations recorded yet.</p>
              ) : (
                topPerformers.map((perf, index) => (
                  <div key={perf.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{perf.name}</p>
                        <p className="text-xs text-slate-500">{perf.type}</p>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 text-sm font-bold text-[var(--color-primary)]">
                      {perf.score}/100
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/90 backdrop-blur-md">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">System Activities</h3>
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
