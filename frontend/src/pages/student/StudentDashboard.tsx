import { useQuery } from '@tanstack/react-query';
import { enrollAPI, activityAPI, aiAPI, analyticsAPI } from '../../lib/api';
import { Enrollment, ActivityLog } from '../../types';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { useState } from 'react';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&auto=format&fit=crop&q=60',
];
function getCover(id: string) {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % COVER_IMAGES.length;
  return COVER_IMAGES[idx];
}

export default function StudentDashboard() {
  const user = useAuthStore(s => s.user);
  const [aiPath, setAiPath]       = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: enrollData } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollAPI.mine().then(r => r.data.enrollments as Enrollment[]),
  });

  const { data: actData } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: () => activityAPI.summary().then(r => r.data.logs as ActivityLog[]),
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['weekly-report'],
    queryFn: () => analyticsAPI.weeklyReport().then(r => r.data),
  });

  const enrollments = enrollData ?? [];
  const logs        = actData ?? [];
  const today       = logs[0];
  const streak      = today?.streak ?? 0;
  const todayMin    = today?.timeSpentMinutes ?? 0;
  const totalXp     = logs.reduce((s, l) => s + l.xpGained, 0);

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const log = logs.find(l => l.date === d);
    return { day: format(parseISO(d), 'EEE'), minutes: log?.timeSpentMinutes ?? 0 };
  });

  const fetchAiPath = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.learningPath();
      setAiPath(res.data.suggestion);
    } catch {
      setAiPath('Could not load AI suggestion. Make sure your OpenAI key is configured.');
    } finally { setAiLoading(false); }
  };

  const stats = [
    { label: 'Day Streak',     value: streak,    suffix: '🔥', cls: 'stat-orange',  text: 'text-orange-600'  },
    { label: 'Total XP',       value: totalXp,   suffix: '⭐', cls: 'stat-amber',   text: 'text-amber-600'   },
    { label: 'Today',          value: todayMin,  suffix: 'm',  cls: 'stat-blue',    text: 'text-blue-600'    },
    { label: 'Active Courses', value: enrollments.filter(e => e.status === 'active').length, suffix: '', cls: 'stat-emerald', text: 'text-emerald-600' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Hey, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-500">Keep the streak going — you're on a roll!</p>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {[
          { label: 'Browse Courses', to: '/student/courses',      icon: '◈', from: 'from-indigo-500', to2: 'to-violet-500' },
          { label: 'My Learning',    to: '/student/my-learning',  icon: '◉', from: 'from-emerald-500', to2: 'to-teal-500' },
          { label: 'Game Zone',      to: '/student/games',           icon: '🎮', from: 'from-pink-500', to2: 'to-rose-500' },
          { label: 'Daily Challenge',to: '/student/daily-challenge', icon: '🎯', from: 'from-amber-500', to2: 'to-orange-500' },
          { label: 'Badges',         to: '/student/badges',       icon: '◎', from: 'from-amber-500', to2: 'to-orange-500' },
          { label: 'Certificates',   to: '/student/certificates', icon: '✦', from: 'from-violet-500', to2: 'to-purple-500' },
        ].map(({ label, to, icon, from, to2 }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${from} ${to2} text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
            <span>{icon}</span>{label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, suffix, cls, text }) => (
          <div key={label} className={`card-gradient border ${cls}`}>
            <div className={`text-4xl font-black ${text} mb-1`}>
              {value}<span className="text-2xl ml-1">{suffix}</span>
            </div>
            <div className="text-sm text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Activity chart */}
          <div className="card">
            <h2 className="section-title mb-5">Weekly Activity</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e0e7ff', background: '#fff', color: '#1e293b', boxShadow: '0 4px 20px rgba(99,102,241,0.12)' }} cursor={{ fill: 'rgba(99,102,241,0.04)' }} />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 6 ? 'url(#barGrad)' : '#e0e7ff'} />
                  ))}
                </Bar>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Active courses */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-title">Active Courses</h2>
              <Link to="/student/my-learning" className="text-sm text-indigo-600 hover:text-indigo-500 font-semibold transition">All →</Link>
            </div>
            {enrollments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm mb-4">No courses yet</p>
                <Link to="/student/courses" className="btn-student text-sm">Browse courses</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.slice(0, 4).map(e => (
                  <Link to={`/student/my-learning/${e.course._id}`} key={e._id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50/50 transition group">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm">
                      <img src={getCover(e.course._id)} alt={e.course.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition">{e.course.title}</div>
                      <div className="progress-bar mt-1.5">
                        <div className="progress-fill" style={{ width: `${e.completionPercent}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 font-semibold">{e.completionPercent}%</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* AI Learning Path */}
          <div className="card-gradient border bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm shadow-sm">✦</div>
                <h2 className="section-title">AI Learning Path</h2>
              </div>
              <button onClick={fetchAiPath} disabled={aiLoading} className="btn-secondary text-xs py-1.5 px-3">
                {aiLoading ? <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-slate-300 border-t-violet-500 rounded-full animate-spin" />Thinking…</span> : aiPath ? '↻ Refresh' : '✦ Generate'}
              </button>
            </div>
            {aiPath
              ? <p className="text-slate-700 text-sm leading-relaxed">{aiPath}</p>
              : <p className="text-slate-400 text-sm">Click Generate to get a personalized AI-powered learning recommendation.</p>
            }
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* This week */}
          <div className="card">
            <h2 className="section-title mb-4">This Week</h2>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }, (_, i) => {
                const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
                const log = logs.find(l => l.date === d);
                const active = (log?.timeSpentMinutes ?? 0) > 0;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      active
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_2px_8px_rgba(99,102,241,0.4)]'
                        : 'bg-slate-100 border border-slate-200 text-slate-400'
                    }`}>
                      {active ? '✓' : format(parseISO(d), 'd')}
                    </div>
                    <span className="text-[10px] text-slate-400">{format(parseISO(d), 'EEE')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Streak card */}
          <div className="card-gradient border bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800">Daily Streak</h2>
              <span className="text-2xl font-black text-orange-600">🔥 {streak}</span>
            </div>
            <div className="text-sm text-slate-500">{todayMin} min studied today</div>
            <div className="mt-3 h-2 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all" style={{ width: `${Math.min(100, (todayMin / 60) * 100)}%` }} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Goal: 60 min/day</div>
          </div>

          {/* Weekly report */}
          {weeklyData && (
            <div className="card-gradient border stat-indigo">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-3">📊 This Week</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Minutes',   value: weeklyData.totalMins,         color: 'text-blue-600 dark:text-blue-400'    },
                  { label: 'XP Earned', value: `+${weeklyData.totalXp}`,     color: 'text-amber-600 dark:text-amber-400'  },
                  { label: 'Active Days',value: weeklyData.activeDays,       color: 'text-indigo-600 dark:text-indigo-400'},
                  { label: 'Quizzes',   value: weeklyData.quizzesThisWeek,   color: 'text-violet-600 dark:text-violet-400'},
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white/60 dark:bg-slate-700/60 rounded-xl p-2.5 text-center">
                    <div className={`text-xl font-black ${color}`}>{value}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="card">
            <h2 className="section-title mb-3">Quick Links</h2>            <div className="space-y-2">
              {[
                { label: 'Activity Log',  to: '/student/activity',     icon: '📅', color: 'text-indigo-600' },
                { label: 'Leaderboard',   to: '/student/badges',       icon: '🏆', color: 'text-amber-600'  },
                { label: 'Certificates',  to: '/student/certificates', icon: '🎓', color: 'text-violet-600' },
              ].map(({ label, to, icon, color }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition group">
                  <span className="text-lg">{icon}</span>
                  <span className={`text-sm font-medium ${color} group-hover:underline`}>{label}</span>
                  <span className="ml-auto text-slate-300 group-hover:text-slate-400">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
