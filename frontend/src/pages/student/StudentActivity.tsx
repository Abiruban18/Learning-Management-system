import { useQuery } from '@tanstack/react-query';
import { activityAPI } from '../../lib/api';
import { ActivityLog } from '../../types';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentActivity() {
  const { data } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: () => activityAPI.summary().then(r => r.data.logs as ActivityLog[]),
  });

  const logs = data ?? [];
  const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  const logByDate = Object.fromEntries(logs.map(l => [l.date, l]));

  const chartDays = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), 'yyyy-MM-dd');
    const log = logByDate[d];
    return { day: format(parseISO(d), 'MMM d'), minutes: log?.timeSpentMinutes ?? 0, xp: log?.xpGained ?? 0 };
  });

  const totalDays = logs.length;
  const totalMins = logs.reduce((s, l) => s + l.timeSpentMinutes, 0);
  const totalXp   = logs.reduce((s, l) => s + l.xpGained, 0);
  const maxStreak = logs.reduce((s, l) => Math.max(s, l.streak), 0);
  const todayLog  = logByDate[format(new Date(), 'yyyy-MM-dd')];

  const heatColor = (mins: number) => {
    if (!mins)     return 'bg-slate-100';
    if (mins < 10) return 'bg-indigo-200';
    if (mins < 30) return 'bg-indigo-400';
    if (mins < 60) return 'bg-indigo-500';
    return 'bg-indigo-700';
  };

  const stats = [
    { label: 'Active days',   value: totalDays,         bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
    { label: 'Total minutes', value: totalMins,         bg: 'bg-cyan-50 border-cyan-200',     text: 'text-cyan-700'   },
    { label: 'Total XP',      value: totalXp,           bg: 'bg-amber-50 border-amber-200',   text: 'text-amber-700'  },
    { label: 'Best streak',   value: `${maxStreak} 🔥`, bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  ];

  const tooltipStyle = {
    borderRadius: 12, border: '1px solid #e2e8f0',
    background: '#fff', color: '#1e293b', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Activity</h1>
        <p className="text-slate-500">Your learning habits over time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, bg, text }) => (
          <div key={label} className={`card border ${bg}`}>
            <div className={`text-3xl font-black ${text} mb-1`}>{value}</div>
            <div className="text-sm text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Today snapshot */}
      {todayLog && (
        <div className="card mb-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Today</span>
            <span className="streak-badge">🔥 {todayLog.streak} day streak</span>
          </div>
          <div className="flex gap-8 text-sm">
            <div><span className="font-black text-slate-800 text-xl">{todayLog.timeSpentMinutes}</span> <span className="text-slate-500">min spent</span></div>
            <div><span className="font-black text-slate-800 text-xl">{todayLog.xpGained}</span> <span className="text-slate-500">XP gained</span></div>
            <div><span className="font-black text-slate-800 text-xl">{todayLog.coursesActive.length}</span> <span className="text-slate-500">courses active</span></div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="card mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">30-Day Learning Heatmap</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {days.map(day => {
            const d = format(day, 'yyyy-MM-dd');
            const log = logByDate[d];
            return (
              <div key={d} title={`${format(day, 'MMM d')}: ${log?.timeSpentMinutes ?? 0} min`}
                className={`aspect-square rounded-md transition-all duration-200 hover:scale-110 cursor-default ${heatColor(log?.timeSpentMinutes ?? 0)}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
          <span>Less</span>
          {['bg-slate-100','bg-indigo-200','bg-indigo-400','bg-indigo-500','bg-indigo-700'].map(c => (
            <div key={c} className={`w-4 h-4 rounded ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Time Spent (14 days)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartDays}>
              <defs>
                <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={2} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} min`, 'Time']} />
              <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} fill="url(#gm)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">XP Gained (14 days)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartDays}>
              <defs>
                <linearGradient id="gx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={2} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} XP`, 'XP']} />
              <Area type="monotone" dataKey="xp" stroke="#f59e0b" strokeWidth={2} fill="url(#gx)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
