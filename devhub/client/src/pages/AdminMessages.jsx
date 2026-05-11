import { useState, useEffect } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import api from '../utils/api';
import MessageThread from '../components/MessageThread';

export default function AdminMessages() {
  const [clients,  setClients]  = useState([]);
  const [selected, setSelected] = useState(null); // { _id, name, userId }
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Load all clients that have a linked user account (can receive messages)
    api.get('/clients').then(res => {
      setClients(res.data);
      setLoading(false);
    });
  }, []);

  // Fetch userId for a client when selected (needed for MessageThread)
  const handleSelect = async (client) => {
    if (selected?._id === client._id) return;
    const res = await api.get(`/clients/${client._id}`);
    setSelected({ ...client, userId: res.data.userId });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a] mb-6">Messages</h1>

      <div className="flex gap-5 h-[calc(100vh-180px)]">
        {/* Client list */}
        <div className="w-72 flex-shrink-0 card p-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No clients yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clients.map(c => (
                <button
                  key={c._id}
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
                    selected?._id === c._id ? 'bg-amber-50 border-r-2 border-amber-500' : ''
                  }`}>
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#0f172a] truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.company || c.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message thread */}
        <div className="flex-1 card p-5 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={40} className="mb-3 opacity-20" />
              <p className="text-sm">Select a client to start messaging</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[#0f172a] text-sm">{selected.name}</p>
                  <p className="text-xs text-gray-400">{selected.company || selected.email}</p>
                </div>
              </div>

              {selected.userId && selected.userId !== 'undefined' ? (
                <MessageThread
                  projectId={null}
                  clientUserId={selected.userId}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <MessageSquare size={28} className="opacity-20" />
                  <p className="text-sm">This client hasn't created a portal account yet.</p>
                  <p className="text-xs text-gray-300">They need to register at /start to receive messages.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}