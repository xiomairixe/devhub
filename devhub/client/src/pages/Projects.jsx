import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, DollarSign, X, FolderKanban } from 'lucide-react';
import api from '../utils/api';

const STATUS_STYLES = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700',
  'On Hold': 'bg-gray-100 text-gray-600',
};

function ProjectModal({ onClose, onSave }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', client: '', budget: '', status: 'Pending',
    startDate: '', deadline: '', progress: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data));
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.client) return alert('Title and client are required');
    setLoading(true);
    try {
      // Find the selected client's linked user account by email
      const selectedClient = clients.find(c => c._id === form.client);
      const User = await api.get(`/clients/${form.client}`);
      const res = await api.post('/projects', {
        ...form,
        clientUserId: User.data.userId || null
      });
      onSave(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-lg mx-4 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl text-[#0f172a]">New Project</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Real Estate Listing Platform" className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="input">
              <option value="">Select a client</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name} — {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input resize-none" placeholder="Project overview..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
              <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="8500" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                {['Pending', 'In Progress', 'Done', 'On Hold'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress ({form.progress}%)</label>
            <input type="range" min="0" max="100" value={form.progress}
              onChange={e => setForm({ ...form, progress: Number(e.target.value) })}
              className="w-full accent-amber-500" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Statuses' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = (proj) => setProjects(prev => [proj, ...prev]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Projects</h1>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
            {['All Statuses', 'Pending', 'In Progress', 'Done', 'On Hold'].map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-52" />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {filtered.map(proj => (
            <div key={proj._id} onClick={() => navigate(`/admin/projects/${proj._id}`)}
              className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[proj.status] || 'bg-gray-100 text-gray-600'}`}>
                  {proj.status}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  <DollarSign size={14} className="text-gray-400" />
                  ${(proj.budget || 0).toLocaleString()}
                </span>
              </div>
              <h3 className="font-bold text-[#0f172a] text-base mb-0.5">{proj.title}</h3>
              <p className="text-sm text-amber-600 mb-3">{proj.client?.name}</p>
              {proj.deadline && (
                <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                  <Calendar size={13} />
                  Due {new Date(proj.deadline).toLocaleDateString()}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress</span>
                <span>{proj.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${proj.progress}%` }} />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-16 text-center text-gray-400 card">
              <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects found</p>
            </div>
          )}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
