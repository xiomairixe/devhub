import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, CheckCircle, ArrowRight } from 'lucide-react';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'login' | 'register' | null

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center">
            <Code2 size={16} className="text-amber-400" />
          </div>
          <span className="font-bold text-xl text-[#0f172a]">DevHub</span>
        </div>
        <div className="flex items-center gap-8">
          <button onClick={() => scrollTo('services')} className="text-gray-600 hover:text-gray-900 text-sm font-medium">Services</button>
          <button onClick={() => scrollTo('portfolio')} className="text-gray-600 hover:text-gray-900 text-sm font-medium">Portfolio</button>
          {user ? (
            <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Dashboard
            </button>
          ) : (
            <button onClick={() => setModal('login')} className="bg-[#0f172a] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-amber-500 rounded-full" />
          Available for new projects
        </div>
        <h1 className="text-6xl font-black text-[#0f172a] leading-tight mb-4">
          I Build Digital Products That<br />
          <span className="text-amber-500">Drive Results</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl">
          Specializing in custom web applications, internal dashboards, and workflow automation for growing businesses.
        </p>
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={() => navigate('/start')}
            className="flex items-center gap-2 bg-[#0f172a] text-white px-7 py-4 rounded-xl font-semibold text-base hover:bg-slate-800 transition-colors"
          >
            Start a Project <ArrowRight size={18} />
          </button>
          <button className="px-7 py-4 rounded-xl font-semibold text-base border-2 border-gray-200 hover:border-gray-300 transition-colors">
            View My Work
          </button>
        </div>
        <div className="flex items-center gap-8">
          {['Fast Delivery', 'Clean Code', 'Modern Tech Stack'].map(label => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-500" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-gray-50 py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-[#0f172a] mb-4 text-center">How I Can Help</h2>
          <p className="text-gray-500 text-center mb-12">End-to-end development for your digital needs</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { title: 'Web Development', desc: 'Custom web apps built with modern frameworks and clean code.', icon: '🌐' },
              { title: 'Dashboard & Analytics', desc: 'Internal tools and data dashboards that give your team clarity.', icon: '📊' },
              { title: 'Workflow Automation', desc: 'Automate repetitive tasks and streamline your business processes.', icon: '⚙️' },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-[#0f172a] text-lg mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-[#0f172a] mb-4">Ready to build something great?</h2>
          <p className="text-gray-500 mb-8">Tell me about your project and I'll get back to you within 24 hours.</p>
          <button
            onClick={() => setModal('login')}
            className="bg-amber-500 hover:bg-amber-400 text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors"
          >
            Start a Project →
          </button>
        </div>
      </section>

      {/* Modals */}
      {modal === 'login' && (
        <LoginModal onClose={() => setModal(null)} onSwitchToRegister={() => setModal('register')} />
      )}
      {modal === 'register' && (
        <RegisterModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />
      )}
    </div>
  );
}