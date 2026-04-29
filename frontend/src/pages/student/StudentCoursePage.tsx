import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesAPI, progressAPI, activityAPI, quizAPI } from '../../lib/api';
import { Course, CourseProgress, Quiz } from '../../types';
import CourseReviews from '../../components/CourseReviews';

export default function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();

  const { data: courseData }    = useQuery({ queryKey: ['course', courseId],   queryFn: () => coursesAPI.byId(courseId!).then(r => r.data.course as Course) });
  const { data: progressData }  = useQuery({ queryKey: ['progress', courseId], queryFn: () => progressAPI.get(courseId!).then(r => r.data.progress as CourseProgress | null) });
  const { data: quizzesData }   = useQuery({ queryKey: ['quizzes', courseId],  queryFn: () => quizAPI.byCourse(courseId!).then(r => r.data.quizzes as Quiz[]) });

  const completeMutation = useMutation({
    mutationFn: (payload: object) => progressAPI.completeTask(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress', courseId] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
      activityAPI.log({ minutesSpent: 5, courseId });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: ({ courseId, materialTitle }: { courseId: string; materialTitle: string }) =>
      coursesAPI.download(courseId, materialTitle),
  });

  const handleDownload = (mat: any, modTitle: string) => {
    downloadMutation.mutate({ courseId: courseId!, materialTitle: mat.title });
    const task = progress?.tasks.find((t: any) => t.moduleTitle === modTitle && t.materialTitle === mat.title);
    if (!task?.isDone) completeMutation.mutate({ courseId: courseId!, moduleTitle: modTitle, materialTitle: mat.title });
    window.open(mat.url, '_blank');
  };

  const course   = courseData;
  const progress = progressData;
  const quizzes  = quizzesData ?? [];

  if (!course) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading…
    </div>
  );

  const done  = progress?.tasks.filter(t => t.isDone).length ?? 0;
  const total = progress?.tasks.length ?? 0;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const matIcon = (type: string) => type === 'video' ? '🎬' : type === 'pdf' ? '📄' : type === 'link' ? '🔗' : '📝';

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <Link to="/student/my-learning" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition">
        ← Back to My Learning
      </Link>
      <h1 className="text-3xl font-black text-slate-800 mb-2">{course.title}</h1>
      <p className="text-slate-500 mb-4">{course.description}</p>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
          {typeof course.teacher === 'object' ? course.teacher.name[0]?.toUpperCase() : 'T'}
        </div>
        <span className="text-sm text-slate-500">
          Instructor: <span className="text-slate-800 font-semibold">{typeof course.teacher === 'object' ? course.teacher.name : 'Teacher'}</span>
        </span>
      </div>

      {/* Progress */}
      <div className="card mb-6 bg-indigo-50 border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-800">Overall Progress</span>
          <div className="flex items-center gap-3">
            <span className="xp-badge">⭐ {progress?.totalXp ?? 0} XP</span>
            <span className="text-2xl font-black text-indigo-600">{pct}%</span>
          </div>
        </div>
        <div className="progress-bar h-2.5">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-slate-400 mt-2">{done}/{total} tasks complete</div>
      </div>

      {/* Modules */}
      <div className="space-y-4 mb-8">
        {course.modules.map((mod, mi) => {
          const modTasks = progress?.tasks.filter(t => t.moduleTitle === mod.title) ?? [];
          const modDone  = modTasks.filter(t => t.isDone).length;
          const isOverdue = mod.deadline && new Date(mod.deadline) < new Date() && modDone < modTasks.length;
          const allDone   = modDone === modTasks.length && modTasks.length > 0;

          return (
            <div key={mi} className={`card ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                  allDone ? 'bg-emerald-100 border border-emerald-300 text-emerald-700' : 'bg-indigo-100 border border-indigo-200 text-indigo-700'
                }`}>
                  {allDone ? '✓' : mi + 1}
                </div>
                <div className="flex-1">
                  <span className="font-bold text-slate-800">{mod.title}</span>
                  {mod.deadline && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border font-medium ${
                      isOverdue ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {isOverdue ? '⚠ Overdue' : `Due ${new Date(mod.deadline).toLocaleDateString()}`}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">{modDone}/{modTasks.length}</span>
              </div>

              <div className="space-y-2 ml-11">
                {mod.materials.map((mat, mati) => {
                  const task = progress?.tasks.find(t => t.moduleTitle === mod.title && t.materialTitle === mat.title);
                  return (
                    <div key={mati} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                      task?.isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}>
                      <span className="text-base">{matIcon(mat.type)}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-800">{mat.title}</div>
                        {mat.duration && <span className="text-xs text-slate-400">{mat.duration} min</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => handleDownload(mat, mod.title)}>
                          {mat.type === 'video' ? '▶ Watch' : '⬇ Open'}
                        </button>
                        {!task?.isDone ? (
                          <button className="btn-student text-xs py-1.5 px-3"
                            onClick={() => completeMutation.mutate({ courseId, moduleTitle: mod.title, materialTitle: mat.title })}
                            disabled={completeMutation.isPending}>
                            Mark done
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-semibold py-1.5 px-3 border border-emerald-300 rounded-xl bg-emerald-100">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quizzes</h2>
            <Link to={`/student/my-learning/${courseId}/leaderboard`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              🏆 Course Leaderboard →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {quizzes.map(q => (
              <Link key={q._id} to={`/student/quiz/${q._id}`} className="card-hover group border-indigo-200 bg-indigo-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-lg">🧠</div>
                  <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition">{q.title}</div>
                </div>
                <div className="text-xs text-slate-500 mb-3">{q.questions.length} questions · Pass at {q.passingScore}%</div>
                <div className="flex items-center justify-between">
                  <span className="xp-badge">⭐ {q.xpReward} XP</span>
                  <span className="text-sm text-indigo-600 font-semibold group-hover:text-indigo-500 transition">Start →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <CourseReviews courseId={courseId!} isEnrolled={true} />
    </div>
  );
}
