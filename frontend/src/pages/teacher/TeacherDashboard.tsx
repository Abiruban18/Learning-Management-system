import { useQuery } from '@tanstack/react-query';
import { coursesAPI } from '../../lib/api';
import { Course } from '../../types';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';

export default function TeacherDashboard() {
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');

  const { data: coursesData } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => coursesAPI.mine().then(r => r.data.courses as Course[]),
  });
  const courses = coursesData ?? [];

  const stats = [
    { label: 'Total Courses', value: courses.length,                                    bg: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-700'  },
    { label: 'Published',     value: courses.filter(c => c.isPublished).length,         bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    { label: 'Drafts',        value: courses.filter(c => !c.isPublished).length,        bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700'   },
    { label: 'Total Modules', value: courses.reduce((s, c) => s + c.modules.length, 0), bg: 'bg-violet-50 border-violet-200',  text: 'text-violet-700'  },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Dashboard</h1>
        <p className="text-slate-500">Here's what's happening with your courses today.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, bg, text }) => (
          <div key={label} className={`card border ${bg}`}>
            <div className={`text-4xl font-black ${text} mb-1`}>{value}</div>
            <div className="text-sm text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your Courses</h2>
          <Link to="/teacher/courses" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium transition">Manage all →</Link>
        </div>

        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input className="input pl-8 py-2 text-sm" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-slate-500 mb-5">No courses yet. Create your first one.</p>
            <Link to="/teacher/courses" className="btn-primary">Create first course</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map(course => (
              <div key={course._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {course.title[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 group-hover:text-indigo-700 transition">{course.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{course.modules.length} modules · {course.totalDuration} min</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/teacher/courses/${course._id}/students`} className="text-xs text-slate-400 hover:text-indigo-600 transition font-medium">Students →</Link>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                    course.isPublished ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>{course.isPublished ? 'Published' : 'Draft'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
