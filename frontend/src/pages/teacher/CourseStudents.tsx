import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { coursesAPI } from '../../lib/api';

interface EnrolledStudent {
  _id: string; student: { _id: string; name: string; email: string };
  status: string; enrolledAt: string; completionPercent: number; totalXp?: number;
}

const PODIUM = ['bg-amber-400 text-white', 'bg-slate-400 text-white', 'bg-orange-600 text-white'];

export default function CourseStudents() {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeTab, setActiveTab] = useState<'students' | 'downloads'>('students');

  const { data: enrollData, isLoading } = useQuery({ queryKey: ['course-students', courseId], queryFn: () => coursesAPI.students(courseId!).then(r => r.data.enrollments as EnrolledStudent[]) });
  const { data: dlData } = useQuery({ queryKey: ['course-downloads', courseId], queryFn: () => coursesAPI.downloads(courseId!).then(r => r.data.downloads as any[]) });

  const enrollments = enrollData ?? [];
  const downloads   = dlData ?? [];

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading…
    </div>
  );

  const statusStyle = (s: string) =>
    s === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
    s === 'dropped'   ? 'bg-red-50 border-red-200 text-red-600' :
    'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-1">Course Engagement</h1>
          <p className="text-slate-500">{enrollments.length} students enrolled · {downloads.length} material downloads</p>
        </div>
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl gap-1">
          {(['students', 'downloads'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'students' && (
        enrollments.length === 0 ? (
          <div className="card text-center py-20"><div className="text-5xl mb-4">👥</div><p className="text-slate-500">No students enrolled yet.</p></div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="data-table">
              <thead><tr><th>Rank</th><th>Student</th><th>Enrolled</th><th>Status</th><th>Progress</th><th>XP</th></tr></thead>
              <tbody>
                {enrollments.map((e, idx) => (
                  <tr key={e._id}>
                    <td><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${PODIUM[idx] ?? 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div></td>
                    <td><div className="font-semibold text-slate-800">{e.student.name}</div><div className="text-xs text-slate-400">{e.student.email}</div></td>
                    <td className="text-slate-500 text-sm">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                    <td><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle(e.status)}`}>{e.status}</span></td>
                    <td>
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${e.completionPercent}%` }} /></div>
                        <span className="text-xs font-semibold text-slate-500 w-9 text-right">{e.completionPercent}%</span>
                      </div>
                    </td>
                    <td className="font-bold text-amber-600">⭐ {e.totalXp || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'downloads' && (
        downloads.length === 0 ? (
          <div className="card text-center py-20"><div className="text-5xl mb-4">📄</div><p className="text-slate-500">No material downloads recorded yet.</p></div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Material</th><th>Downloaded</th></tr></thead>
              <tbody>
                {downloads.map((dl) => (
                  <tr key={dl._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">{dl.student.name[0]?.toUpperCase()}</div>
                        <div><div className="font-semibold text-slate-800">{dl.student.name}</div><div className="text-xs text-slate-400">{dl.student.email}</div></div>
                      </div>
                    </td>
                    <td><span className="text-sm text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">📄 {dl.materialTitle}</span></td>
                    <td className="text-slate-500 text-sm">{new Date(dl.downloadedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
