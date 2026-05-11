import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, LogOut, Code2, ExternalLink, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/clients',  icon: Users,           label: 'Clients' },
  { to: '/admin/projects', icon: FolderKanban,    label: 'Projects' },
  { to: '/admin/messages', icon: MessageSquare,   label: 'Messages' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  // Poll unread count every 30s
  useEffect(() => {
    const fetchUnread = () => {
      const token = localStorage.getItem('token');
      fetch('/api/messages/unread', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setUnread(d.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ME';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-72 bg-[#0f172a] flex flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">DevHub Admin</span>
          </div>
          <nav className="space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`
                }>
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {/* Unread badge on Messages nav item */}
                {label === 'Messages' && unread > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm w-full mb-1">
            <ExternalLink size={18} /> Back to Site
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-900/40 hover:text-red-400 transition-colors text-sm w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}