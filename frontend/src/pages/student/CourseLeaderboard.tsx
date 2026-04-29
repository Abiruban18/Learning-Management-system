import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { leaderboardAPI, coursesAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const PODIUM = ['bg-amber-400 text-white', 'bg-slate-400 text-white', 'bg-orange-600 text-white'];

export default function CourseLeaderboard() {
  const { courseId } = useParams<{ courseId: string }>();
  const user = useAuthStore(s => s.user);

  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesAPI.byId(courseId!).then(r => r.data.course),
  });

  const { data: lbData, isLoading } = useQuery({
    queryKey: ['course-leaderboard', courseId],
    queryFn: () => leaderboardAPI.course(courseId!).then(r => r.data.leaderboard),
  });

  const leaderboard = lbData ?? [];
  const myRank = leaderboard.findIndex((e: any) => e.studentId === user?._id) + 1;

  return (
    <div className="p-8 max-w-2xl">
      <Link to={`/student/my-learning/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mb-6 transition">
        ← Back to course
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-1">Course Leaderboard</h1>
        <p className="text-slate-500 dark:text-slate-400">{courseData?.title}</p>
      </div>

      {myRank > 0 && (
        <div className="card mb-6 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Your Rank</div>
            <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300">#{myRank}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Your XP</div>
            <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300">⭐ {leaderboard[myRank - 1]?.totalXp ?? 0}</div>
          </div>
        </div>
      )}

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map(pos => {
            const entry = leaderboard[pos];
            if (!entry) return <div key={pos} />;
            return (
              <div key={pos} className={`card text-center py-4 ${pos === 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : ''}`}>
                <div className={`w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-black ${PODIUM[pos]}`}>{pos + 1}</div>
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold mx-auto mb-1.5">
                  {entry.avatar || entry.name[0]?.toUpperCase()}
                </div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{entry.name}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">⭐ {entry.totalXp}</div>
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400"><span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading…</div>
      ) : leaderboard.length === 0 ? (
        <div className="card text-center py-16"><div className="text-4xl mb-3">🏆</div><p className="text-slate-500 dark:text-slate-400">No data yet</p></div>
      ) : (
        <div className="card overflow-hidden p-0">
          {leaderboard.map((entry: any, i: number) => (
            <div key={entry.studentId} className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0 transition-colors ${entry.studentId === user?._id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${PODIUM[i] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{i + 1}</div>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">
                {entry.avatar || entry.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {entry.name} {entry.studentId === user?._id && <span className="text-xs text-indigo-500 dark:text-indigo-400">(you)</span>}
                </div>
              </div>
              <div className="text-amber-600 dark:text-amber-400 font-bold text-sm shrink-0">⭐ {entry.totalXp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
