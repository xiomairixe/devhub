import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const PROJECT_TYPES = ['Web Development', 'Mobile App', 'Dashboard & Analytics', 'Automation', 'UI/UX Design', 'Other'];
const BUDGET_RANGES = ['Under $1k', '$1k-$5k', '$5k-$10k', '$10k-$25k', '$25k+'];

export default function InquiryForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', projectType: 'Web Development',
    budgetRange: '$5k-$10k', deadline: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/inquiries', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-[#0f172a] mb-2">Inquiry Sent!</h2>
          <p className="text-gray-500 mb-7">Thanks for reaching out! I'll review your project and get back to you within 24 hours.</p>
          <button onClick={() => navigate('/')} className="btn-primary px-8 py-3">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors mt-4">
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {/* Header */}
          <div className="bg-[#0f172a] px-8 py-8">
            <h1 className="text-3xl font-black text-white mb-1">Let's build something.</h1>
            <p className="text-slate-400">Fill out the form below and I'll get back to you within 24 hours.</p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" placeholder="Jane Doe" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" placeholder="jane@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                  <select value={form.projectType} onChange={e => setForm({ ...form, projectType: e.target.value })} className="input">
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                  <select value={form.budgetRange} onChange={e => setForm({ ...form, budgetRange: e.target.value })} className="input">
                    {BUDGET_RANGES.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Deadline</label>
                <input type="date" value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                <textarea rows={4} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Tell me about your goals, requirements, and any specific features you need..."
                  className="input resize-none" required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base disabled:opacity-60">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Send size={18} /> Send Inquiry</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
