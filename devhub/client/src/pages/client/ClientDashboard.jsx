import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

let socket;
function getSocket() {
  if (!socket) {
    const base =
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      'http://localhost:5000';
    socket = io(base, { withCredentials: true });
  }
  return socket;
}

export default function MessageThread({ projectId, clientUserId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef  = useRef(null);
  const pendingRef = useRef(new Set());

  const room     = projectId ? `project:${projectId}` : `direct:${clientUserId}`;
  const fetchUrl = projectId
    ? `/messages/project/${projectId}`
    : `/messages/direct/${clientUserId}`;

  // Fetch initial messages
  useEffect(() => {
    if (!projectId && !clientUserId) return;
    setLoading(true);
    api
      .get(fetchUrl)
      .then(res => setMessages(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [fetchUrl]);

  // Socket.io — join room and listen
  useEffect(() => {
    const s = getSocket();
    s.emit('join_room', room);

    s.on('new_message', msg => {
      const belongs = projectId
        ? String(msg.projectId) === String(projectId)
        : !msg.projectId &&
          String(msg.clientUserId) === String(clientUserId);

      if (!belongs) return;

      setMessages(prev => {
        if (pendingRef.current.size > 0) {
          const tempId = [...pendingRef.current][0];
          const hasTemp = prev.find(m => m._id === tempId);
          if (hasTemp) {
            pendingRef.current.delete(tempId);
            return prev.map(m => (m._id === tempId ? msg : m));
          }
        }
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      s.emit('leave_room', room);
      s.off('new_message');
    };
  }, [room]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput('');

    const tempId = `temp-${Date.now()}`;
    pendingRef.current.add(tempId);

    const optimistic = {
      _id:        tempId,
      body:       trimmed,
      senderRole: user.role,
      senderId:   user.id,
      createdAt:  new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await api.post('/messages', {
        body:         trimmed,
        projectId:    projectId || null,
        clientUserId: clientUserId || null,
      });
    } catch {
      pendingRef.current.delete(tempId);
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setInput(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMe = msg => msg.senderRole === user?.role;

  return (
    <div className="flex flex-col h-[420px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-xl mb-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            No messages yet — start the conversation
          </p>
        ) : (
          messages.map(msg => (
            <div
              key={msg._id}
              className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe(msg)
                    ? 'bg-[#0f172a] text-white rounded-br-sm'
                    : 'bg-white text-[#0f172a] border border-gray-100 rounded-bl-sm shadow-sm'
                }`}
              >
                <p>{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMe(msg) ? 'text-slate-400' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour:   '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 input resize-none py-2.5 text-sm"
          style={{ minHeight: '42px', maxHeight: '120px' }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex-shrink-0 w-10 h-10 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 rounded-xl flex items-center justify-center transition-colors"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}