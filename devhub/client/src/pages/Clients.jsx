import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Mail, Phone, ChevronRight, X, Users } from 'lucide-react';
import api from '../utils/api';

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(
    client || { name: '', company: '', email: '', phone: '', notes: '' }
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return alert('Name and email are required');
    setLoading(true);
    try {
      if (client) {
        const res = await api.put(`/clients/${client._id}`, form);
        onSave(res.data);
      } else {
        const res = await api.post('/clients', form);
        onSave(res.data);
      }
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
          <h2 className="font-bold text-xl text-[#0f172a]">{client ? 'Edit Client' : 'Add Client'}</h2>
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
                value={form[key] || ''}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="input"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={form.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="input resize-none"
              placeholder="Any notes about this client..."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 btn-secondary">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 btn-primary">
            {loading ? 'Saving...' : client ? 'Update' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const navigate  = useNavigate();
  const [clients, setClients] = useState([]);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (saved) => {
    setClients(prev => {
      const exists = prev.find(c => c._id === saved._id);
      return exists
        ? prev.map(c => c._id === saved._id ? saved : c)
        : [{ ...saved, projectCount: 0 }, ...prev];
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Clients</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 w-56"
            />
          </div>
          <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Client
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {filtered.map(client => (
            <div
              key={client._id}
              onClick={() => navigate(`/admin/clients/${client._id}`)}
              className="flex items-center gap-4 p-5 hover:bg-gray-50/80 cursor-pointer transition-colors">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#0f172a] text-sm">{client.name}</p>
                <p className="text-xs text-gray-400">{client.company || 'No company'}</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                {client.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-300" /> {client.email}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-gray-300" /> {client.phone}
                  </span>
                )}
                <span className="text-gray-400 text-xs">
                  {client.projectCount || 0} project{client.projectCount !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No clients found</p>
            </div>
          )}
        </div>
      )}

      {(modal === 'add' || (modal && modal._id)) && (
        <ClientModal
          client={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}