import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckCircle, Calendar,
  ChevronRight, LogOut, Code2, Plus, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending':     'bg-yellow-100 text-yellow-700',
  'Done':        'bg-green-100 text-green-700',
  'On Hold':     'bg-gray-100 text-gray-600',
};

const INQUIRY_STATUS_STYLES = {
  'New':         'bg-yellow-100 text-yellow-700',
  'Contacted':   'bg-blue-100 text-blue-700',
  'Negotiating': 'bg-purple-100 text-purple-700',
  'Closed Won':  'bg-green-100 text-green-700',
  'Closed Lost': 'bg-red-100 text-red-600',
};

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects,  setProjects]  = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/projects/my-projects', { headers }).then(r => r.json()),
      fetch('/api/inquiries/mine',        { headers }).then(r => r.json()),
    ])
      .then(([proj, inq]) => {
        setProjects(Array.isArray(proj) ? proj : []);
        // Only show inquiries not yet converted into a project
        setInquiries(Array.isArray(inq)
          ? inq.filter(i => i.status !== 'Converted')
          : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeProjects    = projects.filter(p => p.status === 'In Progress');
  const completedProjects = projects.filter(p => p.status === 'Done');

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center">
            <Code2 size={16} className="text-amber-400" />
          </div>
          <span className="font-bold text-[#0f172a]">Client Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-medium">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#0f172a]">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's the latest on your projects.</p>
          </div>
          <button
            onClick={() => navigate('/portal/request')}
            className="btn-primary flex items-center gap-2 px-5 py-3">
            <Plus size={18} /> Request a Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <FolderKanban size={22} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Projects</p>
              <p className="text-3xl font-black text-[#0f172a]">{activeProjects.length}</p>
            </div>
          </div>
          <div className="card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle size={22} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-black text-[#0f172a]">{completedProjects.length}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Pending Requests ─────────────────────────────────── */}
            {inquiries.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-[#0f172a] mb-4">Pending Requests</h2>
                <div className="space-y-3">
                  {inquiries.map(inq => (
                    <div key={inq._id} className="card p-5 border-l-4 border-amber-400">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={14} className="text-amber-500" />
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${INQUIRY_STATUS_STYLES[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                              {inq.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-[#0f172a]">{inq.projectType}</h3>
                          {inq.budgetRange && (
                            <p className="text-sm text-gray-400 mt-0.5">Budget: {inq.budgetRange}</p>
                          )}
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{inq.description}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Submitted {new Date(inq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Projects ──────────────────────────────────────────── */}
            <h2 className="text-xl font-bold text-[#0f172a] mb-4">Your Projects</h2>
            <div className="space-y-4">
              {projects.map(proj => (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/portal/projects/${proj._id}`)}
                  className="card p-5 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[proj.status] || 'bg-gray-100 text-gray-600'}`}>
                      {proj.status}
                    </span>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                  <h3 className="font-bold text-[#0f172a] text-lg mb-1">{proj.title}</h3>
                  {proj.deadline && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
                      <Calendar size={14} />
                      Target: {new Date(proj.deadline).toLocaleDateString()}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1.5">
                    <span>Progress</span>
                    <span className="font-medium">{proj.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="card py-16 text-center text-gray-400">
                  <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No projects yet — your approved requests will appear here.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}