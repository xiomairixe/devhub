import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import InquiryForm from './pages/InquiryForm';
import AdminLayout from './components/layout/AdminLayout';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientProjectDetail from './pages/client/ClientProjectDetail';
import ClientDetail from './pages/ClientDetail';
import ClientRequestProject from './pages/client/ClientRequestProject';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return children;
}

function ClientRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user || user.role !== 'client') return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<InquiryForm />} />

          {/* Client Portal */}
          <Route path="/portal" element={
            <ClientRoute>
              <ClientDashboard />
            </ClientRoute>
          } />
          <Route path="/portal/projects/:id" element={
            <ClientRoute>
              <ClientProjectDetail />
            </ClientRoute>
          } />
          <Route path="/portal/request" element={
            <ClientRoute>
              <ClientRequestProject />
            </ClientRoute>
          } />
          {/* Admin */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="clients" element={<Clients />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="clients/:id" element={<ClientDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
} 