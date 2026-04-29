import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { quizAPI } from '../../lib/api';

interface QuizAttempt {
  _id: string; student: { _id: string; name: string };
  score: number; xpEarned: number; passed: boolean; timeTakenSeconds: number; attemptedAt: string;
}

const PODIUM = ['bg-amber-400 text-white', 'bg-slate-400 text-white', 'bg-orange-600 text-white'];

export default function TeacherQuizLeaderboard() {
  const { quizId } = useParams<{ quizId: string }>();
  const { data: qData } = useQuery({ queryKey: ['quiz', quizId], queryFn: () => quizAPI.byId(quizId!).then((r: any) => r.data.quiz) });
  const { data: aData, isLoading } = useQuery({ queryKey: ['quiz-leaderboard', quizId], queryFn: () => quizAPI.leaderboard(quizId!).then(r => r.data.attempts as QuizAttempt[]) });

  const quiz = qData;
  const attempts = aData ?? [];

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading leaderboard…
    </div>
  );

  return (
    <div className="p-8 max-w-4xl">
      <Link to="/teacher/quizzes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-6 transition">← Back to Quizzes</Link>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">{quiz?.title || 'Quiz'}</h1>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>Passing: <span className="text-slate-700 font-medium">{quiz?.passingScore}%</span></span>
          <span>Max XP: <span className="text-amber-600 font-semibold">⭐ {quiz?.xpReward}</span></span>
          <span>{attempts.length} attempts</span>
        </div>
      </div>

      {attempts.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 0, 2].map(pos => {
            const att = attempts[pos];
            if (!att) return <div key={pos} />;
            return (
              <div key={pos} className={`card text-center ${pos === 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-black ${PODIUM[pos]}`}>#{pos + 1}</div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mx-auto mb-2">{att.student.name[0]?.toUpperCase()}</div>
                <div className="text-sm font-semibold text-slate-800 truncate">{att.student.name}</div>
                <div className={`text-lg font-black mt-1 ${att.passed ? 'text-emerald-600' : 'text-red-500'}`}>{att.score}%</div>
                <div className="text-xs text-amber-600 font-semibold">⭐ {att.xpEarned} XP</div>
              </div>
            );
          })}
        </div>
      )}

      {attempts.length === 0 ? (
        <div className="card text-center py-20"><div className="text-5xl mb-4">🏆</div><p className="text-slate-500">No attempts recorded yet.</p></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="data-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Score</th><th>XP Earned</th><th>Time</th><th>Date</th></tr></thead>
            <tbody>
              {attempts.map((att, idx) => (
                <tr key={att._id}>
                  <td><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${PODIUM[idx] ?? 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div></td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">{att.student.name[0]?.toUpperCase()}</div>
                      <span className="font-semibold text-slate-800">{att.student.name}</span>
                    </div>
                  </td>
                  <td><span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${att.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>{att.score}%</span></td>
                  <td className="font-bold text-amber-600">⭐ {att.xpEarned}</td>
                  <td className="text-slate-500">{Math.floor(att.timeTakenSeconds / 60)}m {att.timeTakenSeconds % 60}s</td>
                  <td className="text-slate-400 text-xs">{new Date(att.attemptedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
