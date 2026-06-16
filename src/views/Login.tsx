import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { useAuthStore } from '../store/useStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [role, setRole] = useState<'Admin' | 'Teacher' | 'Attendance Kiosk'>('Admin');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      if (role === 'Attendance Kiosk') {
        if (data.role !== 'TEACHER') throw new Error('Only teachers can use the Attendance Kiosk.');
        
        const attRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/teachers/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` }
        });
        const attData = await attRes.json();
        
        if (!attRes.ok) throw new Error(attData.error || 'Failed to mark attendance');
        
        alert(`Attendance formally recorded at ${attData._pkt_time}. Check-in successful!`);
        reset();
      } else {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_role', data.role);
        // Sync useAuthStore correctly
        useAuthStore.getState().setAuth(data.token, data.role);
        onLogin(data.token);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[var(--color-primary)] overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-primary-dark)] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-center text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/20 overflow-hidden">
              <img src="/Logo.jpeg" alt="Jadoon Portal Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Jadoon Public School</h1>
            <p className="text-lg text-blue-100/80 max-w-md font-medium">Empowering Futures, Nurturing Excellence, and Building Tomorrow's Leaders.</p>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 lg:p-24">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md space-y-10"
        >
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-slate-500">Please enter your details to sign in.</p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-2xl">
            {['Admin', 'Teacher', 'Attendance Kiosk'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r as any)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  role === r 
                    ? 'bg-white text-[var(--color-primary)] shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-medium text-sm text-center shadow-sm"
              >
                {error}
              </motion.div>
            )}
            
            <div className="space-y-4">
              <div>
                <Input 
                  type="email" 
                  placeholder="Email Address" 
                  icon={<Mail size={20} />}
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-rose-500 mt-1 pl-1">{errors.email.message}</p>}
              </div>
              <div>
                <Input 
                  type="password" 
                  placeholder="Password" 
                  icon={<Lock size={20} />}
                  {...register('password')}
                />
                {errors.password && <p className="text-sm text-rose-500 mt-1 pl-1">{errors.password.message}</p>}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : (role === 'Attendance Kiosk' ? 'Punch In (Present)' : 'Sign In')}
            </Button>
          </form>

          {/* Production UI - Credentials Hidden */}
        </motion.div>
      </div>
    </div>
  );
}
