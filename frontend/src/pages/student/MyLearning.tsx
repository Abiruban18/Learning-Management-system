import { useQuery } from '@tanstack/react-query';
import { enrollAPI } from '../../lib/api';
import { Enrollment } from '../../types';
import { Link } from 'react-router-dom';

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

export default function MyLearning() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: () => enrollAPI.mine().then(r => r.data.enrollments as Enrollment[]),
  });

  const enrollments = (data ?? []).filter(e => e.course != null);
  const active    = enrollments.filter(e => e.status === 'active');
  const completed = enrollments.filter(e => e.status === 'completed');

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
      Loading…
    </div>
  );

  const CourseCard = ({ e }: { e: Enrollment }) => (
    <Link to={`/student/my-learning/${e.course._id}`} className="card-hover flex gap-4 group">
      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
        <img src={getCover(e.course._id)} alt={e.course.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition truncate">{e.course.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-1 mb-2">{e.course.description}</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${e.completionPercent}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-slate-400">{e.completionPercent}% complete</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
            e.status === 'completed'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>{e.status}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">My Learning</h1>
        <p className="text-slate-500">{enrollments.length} total enrollments</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-slate-500 mb-5">You haven't enrolled in any courses yet.</p>
          <Link to="/student/courses" className="btn-primary">Browse courses</Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">In Progress ({active.length})</h2>
              <div className="space-y-3">{active.map(e => <CourseCard key={e._id} e={e} />)}</div>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Completed ({completed.length})</h2>
              <div className="space-y-3">{completed.map(e => <CourseCard key={e._id} e={e} />)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
