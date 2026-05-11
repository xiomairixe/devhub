import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, DollarSign,
  CheckCircle, Circle, Plus, Upload, FileText,
  Trash2, MessageSquare
} from 'lucide-react';
import api from '../utils/api';
import MessageThread from '../components/MessageThread';

const STATUS_STYLES = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'Pending':     'bg-yellow-100 text-yellow-700',
  'Done':        'bg-green-100 text-green-700',
  'On Hold':     'bg-gray-100 text-gray-600',
};

const TABS = ['Overview', 'Messages'];

export default function ProjectDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const fileRef    = useRef();

  const [project,           setProject]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [uploading,         setUploading]         = useState(false);
  const [deletingFile,      setDeletingFile]      = useState(null);
  const [newMilestone,      setNewMilestone]      = useState({ title: '', dueDate: '' });
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [activeTab,         setActiveTab]         = useState('Overview');

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(res => setProject(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const updateProject = async (updates) => {
    const res = await api.put(`/projects/${id}`, { ...project, ...updates });
    setProject(res.data);
  };

  const toggleMilestone = async (idx) => {
    const milestones = project.milestones.map((m, i) =>
      i === idx ? { ...m, completed: !m.completed } : m
    );
    await updateProject({ milestones });
  };

  const addMilestone = async () => {
    if (!newMilestone.title) return;
    const milestones = [...(project.milestones || []), { ...newMilestone, completed: false }];
    await updateProject({ milestones });
    setNewMilestone({ title: '', dueDate: '' });
    setShowMilestoneForm(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/projects/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProject(res.data);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!window.confirm(`Remove "${file.name}"?`)) return;
    setDeletingFile(file.publicId);
    try {
      const res = await api.delete(`/projects/${id}/files/${encodeURIComponent(file.publicId)}`);
      setProject(res.data);
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingFile(null);
    }
  };

  const saveProgress = async () => {
    setSaving(true);
    await updateProject({ progress: project.progress });
    setSaving(false);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!project) return <div className="text-center py-12 text-gray-400">Project not found</div>;

  return (
    <div>
      <button onClick={() => navigate('/admin/projects')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </button>

      {/* Header card */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-black text-[#0f172a]">{project.title}</h1>
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${STATUS_STYLES[project.status] || 'bg-gray-100 text-gray-600'}`}>
            {project.status}
          </span>
        </div>
        {project.description && <p className="text-gray-500 text-sm mb-5">{project.description}</p>}

        <div className="grid grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><User size={12} /> Client</p>
            <p className="font-semibold text-sm text-[#0f172a]">{project.client?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><DollarSign size={12} /> Budget</p>
            <p className="font-semibold text-sm text-[#0f172a]">${(project.budget || 0).toLocaleString()}</p>
          </div>
          {project.startDate && (
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12} /> Start</p>
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
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0f172a]">{project.progress}%</span>
              <button onClick={saveProgress} disabled={saving}
                className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-md hover:bg-amber-400 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          <input type="range" min="0" max="100" value={project.progress}
            onChange={e => setProject(p => ({ ...p, progress: Number(e.target.value) }))}
            className="w-full accent-amber-500 mb-1" />
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#0f172a] text-base">Milestones</h2>
              <button onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                className="text-amber-500 hover:text-amber-600 transition-colors">
                <Plus size={20} />
              </button>
            </div>
            {showMilestoneForm && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
                <input value={newMilestone.title}
                  onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="Milestone title" className="input text-sm" />
                <input type="date" value={newMilestone.dueDate}
                  onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                  className="input text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setShowMilestoneForm(false)} className="flex-1 btn-secondary text-sm py-1.5">Cancel</button>
                  <button onClick={addMilestone} className="flex-1 btn-primary text-sm py-1.5">Add</button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {(project.milestones || []).map((m, i) => (
                <div key={i} onClick={() => toggleMilestone(i)}
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {m.completed
                      ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      : <Circle     size={18} className="text-gray-300 flex-shrink-0" />
                    }
                    <span className={`text-sm ${m.completed ? 'line-through text-gray-400' : 'text-[#0f172a] font-medium'}`}>
                      {m.title}
                    </span>
                  </div>
                  {m.dueDate && <span className="text-xs text-gray-400">{new Date(m.dueDate).toLocaleDateString()}</span>}
                </div>
              ))}
              {!project.milestones?.length && <p className="text-sm text-gray-400 text-center py-4">No milestones yet</p>}
            </div>
          </div>

          {/* Delivery Files */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#0f172a] text-base">
                Delivery Files
                {project.deliveryFiles?.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">({project.deliveryFiles.length})</span>
                )}
              </h2>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 text-sm text-amber-500 hover:text-amber-600 font-medium disabled:opacity-60">
                {uploading
                  ? <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
                  : <Upload size={16} />
                }
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
            </div>
            <div className="space-y-2">
              {(project.deliveryFiles || []).map(f => (
                <div key={f.publicId}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                  <a href={f.url} target="_blank" rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText size={18} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-[#0f172a] truncate">{f.name}</span>
                  </a>
                  <button onClick={() => handleDeleteFile(f)} disabled={deletingFile === f.publicId}
                    className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50">
                    {deletingFile === f.publicId
                      ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                      : <Trash2 size={15} />
                    }
                  </button>
                </div>
              ))}
              {!project.deliveryFiles?.length && <p className="text-sm text-gray-400 text-center py-4">No files uploaded yet</p>}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Messages */}
      {activeTab === 'Messages' && (
        <div className="card p-5">
          <h2 className="font-bold text-[#0f172a] text-base mb-4">Project Messages</h2>
          <MessageThread
            projectId={id}
            clientUserId={project.clientUserId}
          />
        </div>
      )}
    </div>
  );
}