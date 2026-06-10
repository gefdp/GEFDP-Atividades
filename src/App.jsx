import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Productivity from './pages/Productivity';
import Achievements from './pages/Achievements';
import TeamReport from './pages/TeamReport';
import Profile from './pages/Profile';
import Events from './pages/Events';
import AccessManagement from './pages/AccessManagement';

import { useCurrentUser } from '@/lib/useCurrentUser';
import { Navigate } from 'react-router-dom';
import { ThemeProvider } from "@/context/ThemeContext";


function AdminRoute({ children }) {
  const { isAdmin, isLoading } = useCurrentUser();
  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AccessRoute({ children }) {
  const { isAccessManager, isLoading } = useCurrentUser();
  if (isLoading) return null;
  if (!isAccessManager) return <Navigate to="/" replace />;
  return children;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/atividades" element={<Activities />} />
          <Route path="/produtividade" element={<Productivity />} />
          <Route path="/conquistas" element={<Achievements />} />
          <Route path="/relatorio" element={<AdminRoute><TeamReport /></AdminRoute>} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/eventos" element={<Events />} />
          <Route path="/acessos" element={<AccessRoute><AccessManagement /></AccessRoute>} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router basename={import.meta.env.BASE_URL}>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
