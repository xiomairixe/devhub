import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, FolderKanban, Users, DollarSign, ChevronDown, ChevronRight, GitMerge } from 'lucide-react';
import api from '../utils/api';

const STATUS_COLORS = {
  New:          'bg-yellow-100 text-yellow-700',
  Contacted:    'bg-blue-100 text-blue-700',
  Negotiating:  'bg-purple-100 text-purple-700',
  Converted:    'bg-green-100 text-green-700',
  'Closed Won': 'bg-green-100 text-green-700',
  'Closed Lost':'bg-red-100 text-red-700',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [inquiries,    setInquiries]    = useState([]);
  const [projects,     setProjects]     = useState([]);
  const [clients,      setClients]      = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [converting,   setConverting]   = useState(null); // inquiry id being converted
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/inquiries'),
      api.get('/projects'),
      api.get('/clients')
    ]).then(([inqRes, projRes, cliRes]) => {
      setInquiries(inqRes.data);
      setProjects(projRes.data);
      setClients(cliRes.data);
    }).finally(() => setLoading(false));
  }, []);

  // Convert an inquiry into a real project, then navigate to it
  const handleConvert = async (inq) => {
    if (converting) return;
    setConverting(inq._id);
    try {
      const res = await api.post(`/inquiries/${inq._id}/convert`);
      // Mark inquiry as Converted in local state so the badge updates instantly
      setInquiries(prev =>
        prev.map(i => i._id === inq._id ? { ...i, status: 'Converted' } : i)
      );
      // Navigate straight to the new project
      navigate(`/admin/projects/${res.data.project._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not convert inquiry');
    } finally {
      setConverting(null);
    }
  };

  const filteredInquiries = statusFilter === 'All'
    ? inquiries
    : inquiries.filter(i => i.status === statusFilter);

  const activeProjects = projects.filter(p => p.status === 'In Progress');
  const estRevenue     = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const stats = [
    { label: 'Total Inquiries', value: inquiries.length,          icon: Inbox,        color: 'text-amber-500' },
    { label: 'Active Projects', value: activeProjects.length,     icon: FolderKanban, color: 'text-blue-500'  },
    { label: 'Total Clients',   value: clients.length,            icon: Users,        color: 'text-purple-500'},
    { label: 'Est. Revenue',    value: `$${estRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a] mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
              </div>
              <Icon size={22} className={color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Inquiries */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0f172a] text-lg">Recent Inquiries</h2>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none border border-gray-200 rounded-lg px-3 py-1.5 text-sm pr-8 focus:outline-none">
                {['All', 'New', 'Contacted', 'Negotiating', 'Converted', 'Closed Won', 'Closed Lost'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="text-left pb-3 font-medium">Client</th>
                <th className="text-left pb-3 font-medium">Project</th>
                <th className="text-left pb-3 font-medium">Budget</th>
                <th className="text-left pb-3 font-medium">Status</th>
                <th className="text-left pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.slice(0, 8).map(inq => (
                <tr key={inq._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3.5">
                    <p className="font-medium text-sm text-[#0f172a]">{inq.name}</p>
                    <p className="text-xs text-gray-400">{new Date(inq.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3.5 text-sm text-gray-600">{inq.projectType}</td>
                  <td className="py-3.5 text-sm text-gray-600">{inq.budgetRange}</td>
                  <td className="py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[inq.status] || 'bg-gray-100 text-gray-600'}`}>
                      {inq.status}
                    </span>
                  </td>
                  <td className="py-3.5">
                    {/* Only show Convert button for non-converted inquiries */}
                    {inq.status !== 'Converted' && inq.status !== 'Closed Lost' ? (
                      <button
                        onClick={() => handleConvert(inq)}
                        disabled={converting === inq._id}
                        className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                        {converting === inq._id
                          ? <span className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                          : <GitMerge size={12} />
                        }
                        {converting === inq._id ? 'Converting...' : 'Convert'}
                      </button>
                    ) : inq.status === 'Converted' ? (
                      <span className="text-xs text-gray-400 italic">Converted</span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                    No inquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Active Projects */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0f172a] text-lg">Active Projects</h2>
            <button
              onClick={() => navigate('/admin/projects')}
              className="text-amber-500 text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-5">
            {activeProjects.slice(0, 3).map(proj => (
              <div key={proj._id} className="cursor-pointer"
                onClick={() => navigate(`/admin/projects/${proj._id}`)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm text-[#0f172a]">{proj.title}</p>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 mb-2">{proj.client?.name}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>Progress</span>
                  <span>{proj.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${proj.progress}%` }} />
                </div>
              </div>
            ))}
            {activeProjects.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No active projects</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}