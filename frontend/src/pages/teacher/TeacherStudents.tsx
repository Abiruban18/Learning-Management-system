import { useQuery } from '@tanstack/react-query';
import { coursesAPI } from '../../lib/api';
import { Course } from '../../types';
import { Link } from 'react-router-dom';

export default function TeacherStudents() {
  const { data } = useQuery({ queryKey: ['teacher-courses'], queryFn: () => coursesAPI.mine().then(r => r.data.courses as Course[]) });
  const courses = (data ?? []).filter(c => c.isPublished);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Students</h1>
        <p className="text-slate-500">Select a published course to view its enrolled students</p>
      </div>
      {courses.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-500 mb-5">No published courses yet.</p>
          <Link to="/teacher/courses" className="btn-primary">Manage courses</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(c => (
            <Link key={c._id} to={`/teacher/courses/${c._id}/students`} className="card-hover group block">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-lg mb-4">
                {c.title[0]?.toUpperCase()}
              </div>
              <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition mb-1">{c.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{c.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{c.modules.length} modules</span>
                <span className="text-sm text-indigo-600 font-semibold group-hover:text-indigo-500 transition">View students →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
