import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Building2, FileText,
  Calendar, DollarSign, FolderKanban, Edit2, X
} from 'lucide-react';
import api from '../utils/api';

const STATUS_STYLES = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending':     'bg-yellow-100 text-yellow-700',
  'Done':        'bg-green-100 text-green-700',
  'On Hold':     'bg-gray-100 text-gray-600',
};

function EditModal({ client, onClose, onSave }) {
  const [form, setForm] = useState({
    name:    client.name    || '',
    company: client.company || '',
    email:   client.email   || '',
    phone:   client.phone   || '',
    notes:   client.notes   || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return alert('Name and email are required');
    setLoading(true);
    try {
      const res = await api.put(`/clients/${client._id}`, form);
      onSave(res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl text-[#0f172a]">Edit Client</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          {[
            { key: 'name',    label: 'Full Name', placeholder: 'Jessica Taylor' },
            { key: 'company', label: 'Company',   placeholder: 'Taylor Real Estate' },
            { key: 'email',   label: 'Email',     placeholder: 'jessica@example.com', type: 'email' },
            { key: 'phone',   label: 'Phone',     placeholder: '(555) 123-4567' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type || 'text'}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="input"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="input resize-none"
              placeholder="Any notes about this client..."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary">
            {loading ? 'Saving...' : 'Update Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [client,   setClient]   = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    api.get(`/clients/${id}`)
      .then(res => {
        setClient(res.data);
        setProjects(res.data.projects || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!client) return (
    <div className="text-center py-12 text-gray-400">Client not found</div>
  );

  const activeProjects    = projects.filter(p => p.status === 'In Progress');
  const completedProjects = projects.filter(p => p.status === 'Done');
  const totalBudget       = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div>
      <button
        onClick={() => navigate('/admin/clients')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Clients
      </button>

      {/* Profile card */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-black text-2xl flex-shrink-0">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0f172a]">{client.name}</h1>
              {client.company && (
                <p className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                  <Building2 size={14} /> {client.company}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 transition-colors">
            <Edit2 size={14} /> Edit
          </button>
        </div>

        {/* Contact info */}
        <div className="flex items-center gap-6 mt-5 pt-5 border-t border-gray-100">
          {client.email && (
            <a href={`mailto:${client.email}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors">
              <Mail size={15} className="text-gray-400" /> {client.email}
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors">
              <Phone size={15} className="text-gray-400" /> {client.phone}
            </a>
          )}
        </div>

        {/* Notes */}
        {client.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <FileText size={12} /> Notes
            </p>
            <p className="text-sm text-gray-600">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <FolderKanban size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-2xl font-black text-[#0f172a]">{activeProjects.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <FolderKanban size={18} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-2xl font-black text-[#0f172a]">{completedProjects.length}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
            <DollarSign size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Budget</p>
            <p className="text-2xl font-black text-[#0f172a]">${totalBudget.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div className="card p-6">
        <h2 className="font-bold text-[#0f172a] text-lg mb-4">Projects</h2>
        {projects.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <FolderKanban size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No projects yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(proj => (
              <div
                key={proj._id}
                onClick={() => navigate(`/admin/projects/${proj._id}`)}
                className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[proj.status] || 'bg-gray-100 text-gray-600'}`}>
                      {proj.status}
                    </span>
                  </div>
                  <p className="font-semibold text-[#0f172a] text-sm truncate">{proj.title}</p>
                  {proj.deadline && (
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Calendar size={11} />
                      Due {new Date(proj.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {proj.budget > 0 && (
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-0.5">
                      <DollarSign size={13} className="text-gray-400" />
                      {proj.budget.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{proj.progress}% done</p>
                </div>
                {/* Progress bar */}
                <div className="w-24 flex-shrink-0">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEdit && (
        <EditModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSave={updated => setClient(c => ({ ...c, ...updated }))}
        />
      )}
    </div>
  );
}