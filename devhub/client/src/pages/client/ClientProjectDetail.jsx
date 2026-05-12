import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, DollarSign, CheckCircle,
  Circle, FileText, Code2, LogOut, MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MessageThread from '../../components/MessageThread';
import api from '../../utils/api';

const STATUS_STYLES = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending':     'bg-yellow-100 text-yellow-700',
  'Done':        'bg-green-100 text-green-700',
  'On Hold':     'bg-gray-100 text-gray-600',
};

const TABS = ['Overview', 'Messages'];

export default function ClientProjectDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user, logout } = useAuth();
  const [project,   setProject]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    api.get(`/projects/portal/${id}`)
      .then(res => setProject(res.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLogout = () => { logout(); navigate('/'); };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!project || project.message) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Project not found</div>
  );

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
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <button onClick={() => navigate('/portal')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Project Header */}
        <div className="card p-6 mb-5">
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-black text-[#0f172a]">{project.title}</h1>
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLES[project.status] || 'bg-gray-100 text-gray-600'}`}>
              {project.status}
            </span>
          </div>
          {project.description && <p className="text-gray-500 text-sm mb-5">{project.description}</p>}

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><DollarSign size={12} /> Budget</p>
              <p className="font-semibold text-sm text-[#0f172a]">${(project.budget || 0).toLocaleString()}</p>
            </div>
            {project.startDate && (
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12} /> Start Date</p>
                <p className="font-semibold text-sm text-[#0f172a]">{new Date(project.startDate).toLocaleDateString()}</p>
              </div>
            )}
            {project.deadline && (
              <div>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12} /> Deadline</p>
                <p className="font-semibold text-sm text-[#0f172a]">{new Date(project.deadline).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Progress</span>
              <span className="font-bold text-[#0f172a]">{project.progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab === 'Messages' && <MessageSquare size={14} />}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-2 gap-5">
            {/* Milestones */}
            <div className="card p-5">
              <h2 className="font-bold text-[#0f172a] text-base mb-4">Milestones</h2>
              <div className="space-y-2">
                {(project.milestones || []).map((m, i) => (
                  <div key={i}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      {m.completed
                        ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                        : <Circle     size={18} className="text-gray-300 flex-shrink-0" />
                      }
                      <span className={`text-sm ${m.completed ? 'line-through text-gray-400' : 'text-[#0f172a] font-medium'}`}>
                        {m.title}
                      </span>
                    </div>
                    {m.dueDate && (
                      <span className="text-xs text-gray-400">{new Date(m.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                ))}
                {!project.milestones?.length && <p className="text-sm text-gray-400 text-center py-4">No milestones yet</p>}
              </div>
            </div>

            {/* Delivery Files */}
            <div className="card p-5">
              <h2 className="font-bold text-[#0f172a] text-base mb-4">Delivery Files</h2>
              <div className="space-y-2">
                {(project.deliveryFiles || []).map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <FileText size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-[#0f172a] truncate">{f.name}</span>
                  </a>
                ))}
                {!project.deliveryFiles?.length && <p className="text-sm text-gray-400 text-center py-4">No files yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Messages */}
        {activeTab === 'Messages' && (
          <div className="card p-5">
            <h2 className="font-bold text-[#0f172a] text-base mb-4">Project Messages</h2>
            {user?.id ? (
              <MessageThread
                projectId={id}
                clientUserId={user.id}
              />
            ) : (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}