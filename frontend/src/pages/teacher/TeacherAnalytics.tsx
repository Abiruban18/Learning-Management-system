import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';

export default function TeacherAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-analytics'],
    queryFn: () => analyticsAPI.teacher().then(r => r.data),
  });

  const tooltipStyle = {
    borderRadius: 10, border: '1px solid #e2e8f0',
    background: '#fff', color: '#1e293b', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  };

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading analytics…
    </div>
  );

  const stats = [
    { label: 'Total Courses',    value: data?.totalCourses ?? 0,    bg: 'stat-indigo',  text: 'text-indigo-700 dark:text-indigo-300'  },
    { label: 'Total Enrollments',value: data?.totalEnrollments ?? 0, bg: 'stat-emerald', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Completion Rate',  value: `${data?.completionRate ?? 0}%`, bg: 'stat-amber', text: 'text-amber-700 dark:text-amber-300' },
    { label: 'Quiz Pass Rate',   value: `${data?.quizPassRate ?? 0}%`,   bg: 'stat-violet', text: 'text-violet-700 dark:text-violet-300' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400">Insights into your courses and student performance</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, bg, text }) => (
          <div key={label} className={`card-gradient border ${bg}`}>
            <div className={`text-3xl font-black ${text} mb-1`}>{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Enrollment trend */}
      <div className="card mb-6">
        <h2 className="section-title mb-5">Enrollment Trend (30 days)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data?.trend ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} interval={6} />
            <YAxis hide />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-course stats */}
      <div className="card mb-6">
        <h2 className="section-title mb-5">Course Performance</h2>
        {data?.courseStats?.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">No courses yet</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data?.courseStats ?? []} barCategoryGap="30%">
                <XAxis dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v: string) => v.length > 15 ? v.slice(0, 15) + '…' : v} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v}%`, name === 'completionRate' ? 'Completion' : 'Quiz Pass']} />
                <Bar dataKey="completionRate" fill="#6366f1" radius={[4,4,0,0]} name="completionRate" />
                <Bar dataKey="quizPassRate"   fill="#10b981" radius={[4,4,0,0]} name="quizPassRate" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Course</th><th>Enrolled</th><th>Completed</th><th>Completion %</th><th>Quiz Pass %</th></tr></thead>
                <tbody>
                  {data?.courseStats?.map((c: any) => (
                    <tr key={c._id}>
                      <td className="font-medium text-slate-800 dark:text-slate-200">{c.title}</td>
                      <td>{c.enrolled}</td>
                      <td>{c.completed}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c.completionRate >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400'}`}>
                          {c.completionRate}%
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${c.quizPassRate >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400'}`}>
                          {c.quizPassRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
