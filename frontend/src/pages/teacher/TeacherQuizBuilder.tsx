import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { coursesAPI, quizAPI } from '../../lib/api';
import { Course, QuizQuestion } from '../../types';

const emptyQuestion = (): QuizQuestion => ({
  question: '', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
  points: 10, timeLimitSeconds: 30, explanation: '',
});

export default function TeacherQuizBuilder() {
  const [courseId, setCourseId]    = useState('');
  const [module, setModule]        = useState('');
  const [title, setTitle]          = useState('');
  const [passingScore, setPassing] = useState(70);
  const [xpReward, setXp]          = useState(50);
  const [questions, setQuestions]  = useState<QuizQuestion[]>([emptyQuestion()]);
  const [saved, setSaved]          = useState(false);

  const { data } = useQuery({ queryKey: ['teacher-courses'], queryFn: () => coursesAPI.mine().then(r => r.data.courses as Course[]) });
  const courses = data ?? [];
  const selectedCourse = courses.find(c => c._id === courseId);

  const { data: qData } = useQuery({ queryKey: ['quizzes', courseId], queryFn: () => quizAPI.byCourse(courseId!).then(r => r.data.quizzes), enabled: !!courseId });
  const existingQuizzes = qData ?? [];

  const mutation = useMutation({
    mutationFn: () => quizAPI.create({ courseId, module, title, passingScore, xpReward, questions }),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); setQuestions([emptyQuestion()]); },
  });

  const updateQ   = (i: number, patch: Partial<QuizQuestion>) => setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const updateOpt = (qi: number, oi: number, text: string) => setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : { ...q, options: q.options.map((o, j) => j === oi ? { ...o, text } : o) }));
  const setCorrect = (qi: number, oi: number) => setQuestions(qs => qs.map((q, idx) => idx !== qi ? q : { ...q, options: q.options.map((o, j) => ({ ...o, isCorrect: j === oi })) }));
  const removeQ   = (i: number) => setQuestions(qs => qs.filter((_, idx) => idx !== i));

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Quiz Builder</h1>
        <p className="text-slate-500">Create a gamified timed quiz for a course</p>
      </div>

      <div className="card mb-5">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Quiz Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Course</label>
              <select className="input" value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Module</label>
              <select className="input" value={module} onChange={e => setModule(e.target.value)} disabled={!selectedCourse}>
                <option value="">Select module…</option>
                {selectedCourse?.modules.map(m => <option key={m.title} value={m.title}>{m.title}</option>)}
              </select>
            </div>
          </div>

          {courseId && existingQuizzes.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Existing Quizzes</div>
              <div className="space-y-2">
                {existingQuizzes.map((eq: any) => (
                  <div key={eq._id} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-indigo-100">
                    <div><span className="text-sm font-semibold text-slate-800">{eq.title}</span><span className="text-xs text-slate-400 ml-2">({eq.module})</span></div>
                    <a href={`/teacher/quizzes/${eq._id}/leaderboard`} className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition">🏆 Leaderboard</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Quiz title</label>
            <input className="input" placeholder="e.g. JavaScript Fundamentals Quiz" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Passing score (%)</label>
              <input className="input" type="number" min={10} max={100} value={passingScore} onChange={e => setPassing(+e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">XP reward on pass</label>
              <input className="input" type="number" min={10} max={500} value={xpReward} onChange={e => setXp(+e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-5">
        {questions.map((q, qi) => (
          <div key={qi} className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">Question {qi + 1}</span>
              {questions.length > 1 && <button onClick={() => removeQ(qi)} className="text-xs text-red-500 hover:text-red-600 font-medium transition">Remove</button>}
            </div>
            <textarea className="input mb-4 resize-none min-h-[72px]" placeholder="Enter your question…" value={q.question} onChange={e => updateQ(qi, { question: e.target.value })} />
            <div className="grid grid-cols-2 gap-2 mb-4">
              {q.options.map((opt, oi) => (
                <div key={oi} className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 transition-all duration-200 ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                  <button type="button" onClick={() => setCorrect(qi, oi)}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 transition-all duration-200 flex items-center justify-center ${opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-slate-400'}`}>
                    {opt.isCorrect && <span className="text-white text-[10px] font-black">✓</span>}
                  </button>
                  <input className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                    placeholder={`Option ${['A','B','C','D'][oi]}`} value={opt.text} onChange={e => updateOpt(qi, oi, e.target.value)} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-500 block mb-1">Points</label><input className="input text-sm py-2" type="number" min={1} value={q.points} onChange={e => updateQ(qi, { points: +e.target.value })} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Time limit (sec)</label><input className="input text-sm py-2" type="number" min={5} max={120} value={q.timeLimitSeconds} onChange={e => updateQ(qi, { timeLimitSeconds: +e.target.value })} /></div>
              <div><label className="text-xs text-slate-500 block mb-1">Explanation</label><input className="input text-sm py-2" placeholder="Optional…" value={q.explanation} onChange={e => updateQ(qi, { explanation: e.target.value })} /></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <button className="btn-secondary" onClick={() => setQuestions(qs => [...qs, emptyQuestion()])}>+ Add question</button>
        <button className="btn-primary" disabled={!courseId || !module || !title || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? 'Saving…' : '💾 Save quiz'}
        </button>
        {saved && <span className="text-sm text-emerald-600 font-medium">✓ Quiz saved!</span>}
      </div>
    </div>
  );
}
