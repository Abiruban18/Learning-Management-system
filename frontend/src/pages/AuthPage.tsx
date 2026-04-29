import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../lib/api';
import { useAuthStore, AuthUser } from '../store/authStore';

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1200&auto=format&fit=crop&q=85',
    title: 'Learn Without Limits',
    sub: 'Access world-class courses from expert instructors',
  },
  {
    url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&auto=format&fit=crop&q=85',
    title: 'Master New Skills',
    sub: 'Structured learning paths built by industry experts',
  },
  {
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=85',
    title: 'Earn Certificates',
    sub: 'Prove your skills with verified course certificates',
  },
  {
    url: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=1200&auto=format&fit=crop&q=85',
    title: 'Beat the Clock',
    sub: 'Gamified quizzes that make learning addictive',
  },
];

export default function AuthPage() {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [role, setRole]         = useState<'student' | 'teacher'>('student');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPass]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [slide, setSlide]       = useState(0);
  const [fading, setFading]     = useState(false);

  const nav     = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  useEffect(() => {
    const id = setInterval(() => {
      setFading(true);
      setTimeout(() => { setSlide(s => (s + 1) % SLIDES.length); setFading(false); }, 600);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = mode === 'login' ? { email, password } : { name, email, password, role };
      const { data } = await (mode === 'login' ? authAPI.login(payload) : authAPI.register(payload));
      setAuth(data.token, data.user as AuthUser);
      nav(data.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const current = SLIDES[slide];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ── LEFT — full-height image ── */}
      <div className="hidden lg:block w-[55%] relative overflow-hidden">
        {/* Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url(${current.url})`, opacity: fading ? 0 : 1 }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 via-indigo-900/40 to-transparent" />

        {/* Top logo */}
        <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg">
            <span className="text-indigo-600 font-black text-sm">EQ</span>
          </div>
          <span className="text-2xl font-black text-white drop-shadow-lg">EduQuest</span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
          <div
            className="transition-all duration-600"
            style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(12px)' : 'translateY(0)' }}
          >
            <h2 className="text-4xl font-black text-white mb-3 leading-tight drop-shadow-lg">{current.title}</h2>
            <p className="text-indigo-100 text-lg mb-8 drop-shadow">{current.sub}</p>
          </div>

          {/* Slide dots */}
          <div className="flex gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => { setFading(true); setTimeout(() => { setSlide(i); setFading(false); }, 300); }}
                className={`rounded-full transition-all duration-300 ${i === slide ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[{ val: 'Free', label: 'Always free' }, { val: '15+', label: 'Courses' }, { val: '100%', label: 'Hands-on' }].map(({ val, label }) => (
              <div key={label} className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-white">{val}</div>
                <div className="text-xs text-indigo-200 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — form ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">EQ</span>
            </div>
            <span className="text-xl font-black text-slate-800">EduQuest</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-800 mb-2">
              {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </h1>
            <p className="text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
              <button className="text-indigo-600 font-semibold hover:text-indigo-500 transition"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">Full name</label>
                  <input className="input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['student', 'teacher'] as const).map(r => (
                      <button key={r} type="button" onClick={() => setRole(r)}
                        className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                          role === r
                            ? r === 'student'
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                              : 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}>
                        {r === 'student' ? '🎓 Student' : '🏫 Teacher'}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email address</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPass(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition text-sm">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3.5 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Please wait…
                </span>
              ) : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100">
            <p className="w-full text-xs text-slate-400 mb-2">Everything you need to learn:</p>
            {['🎯 Timed Quizzes', '🔥 Daily Streaks', '⭐ XP & Levels', '🏆 Leaderboard', '🎓 Certificates', '🎮 Game Zone'].map(f => (
              <span key={f} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
