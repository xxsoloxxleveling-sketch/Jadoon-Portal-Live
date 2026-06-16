import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Login from './views/Login';
import Shell from './views/Shell';
import Dashboard from './views/Dashboard';
import Attendance from './views/Attendance';
import FeeChallan from './views/FeeChallan';
import Students from './views/Students';
import ClassManager from './views/ClassManager';
import Teachers from './views/Teachers';
import Employees from './views/Employees';
import Payroll from './views/Payroll';
import Settings from './views/Settings';
import { useAuthStore } from './store/useStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login onLogin={() => {}} /> // We will refactor Login to use useNavigate instead of prop
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'students', element: <Students /> },
      { path: 'classes', element: <ClassManager /> },
      { path: 'attendance', element: <Attendance /> },
      { path: 'fees', element: <FeeChallan /> },
      { path: 'teachers', element: <Teachers /> },
      { path: 'employees', element: <Employees /> },
      { path: 'payroll', element: <Payroll /> },
      { path: 'settings', element: <Settings /> },
    ]
  }
]);

export default function App() {
  const token = useAuthStore(state => state.token);
  
  useEffect(() => {
    // Check if user is already logged in on refresh
    const storedToken = localStorage.getItem('auth_token');
    const storedRole = localStorage.getItem('user_role');
    if (storedToken && storedRole) {
      useAuthStore.getState().setAuth(storedToken, storedRole);
    }
  }, []);

  return <RouterProvider router={router} />;
}
