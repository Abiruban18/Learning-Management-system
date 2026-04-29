import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiAPI, quizAPI, coursesAPI } from '../../lib/api';
import { Course } from '../../types';
import toast from 'react-hot-toast';

interface GeneratedQ {
  question: string; options: { text: string; isCorrect: boolean }[];
  points: number; timeLimitSeconds: number; explanation: string;
}

export default function AIQuizGenerator() {
  const [topic, setTopic]           = useState('');
  const [count, setCount]           = useState(5);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [questions, setQuestions]   = useState<GeneratedQ[]>([]);
  const [courseId, setCourseId]     = useState('');
  const [moduleTitle, setModule]    = useState('');
  const [quizTitle, setQuizTitle]   = useState('');

  const { data: coursesData } = useQuery({ queryKey: ['teacher-courses'], queryFn: () => coursesAPI.mine().then(r => r.data.courses as Course[]) });

  const generateMutation = useMutation({
    mutationFn: () => aiAPI.generateQuiz({ topic, count, difficulty }),
    onSuccess: (res) => { setQuestions(res.data.questions); setQuizTitle(`${topic} Quiz`); toast.success(`Generated ${res.data.questions.length} questions!`); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'AI generation failed'),
  });

  const saveMutation = useMutation({
    mutationFn: () => quizAPI.create({ course: courseId, module: moduleTitle, title: quizTitle, questions, passingScore: 70, xpReward: 50 }),
    onSuccess: () => { toast.success('Quiz saved!'); setQuestions([]); setTopic(''); },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Save failed'),
  });

  const courses = coursesData ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 text-xl">✦</div>
          <h1 className="text-3xl font-black text-slate-800">AI Quiz Generator</h1>
        </div>
        <p className="text-slate-500">Generate quiz questions automatically using AI</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Generate Questions</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. JavaScript Promises, Photosynthesis, World War II" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Number of questions</label>
              <select value={count} onChange={e => setCount(Number(e.target.value))} className="input">
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-xl border text-xs font-semibold capitalize transition-all duration-200 ${
                      difficulty === d
                        ? d === 'easy'   ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : d === 'medium' ? 'border-amber-400 bg-amber-50 text-amber-700'
                        :                  'border-red-400 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => generateMutation.mutate()} disabled={!topic.trim() || generateMutation.isPending} className="btn-primary w-full justify-center py-3">
            {generateMutation.isPending ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Generating with AI…</span> : '✦ Generate with AI'}
          </button>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Generated Questions ({questions.length})</h2>
          <div className="space-y-3 mb-6">
            {questions.map((q, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-800 mb-3 text-sm"><span className="text-indigo-600 mr-2">Q{i + 1}.</span>{q.question}</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {q.options.map((o, oi) => (
                    <div key={oi} className={`text-xs px-3 py-2 rounded-lg font-medium border ${o.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <span className="font-bold mr-1.5">{['A','B','C','D'][oi]}.</span>{o.text}
                    </div>
                  ))}
                </div>
                {q.explanation && <div className="text-xs text-slate-500 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-lg mt-2">💡 {q.explanation}</div>}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Save as Quiz</h3>
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Quiz title</label><input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="Quiz title" className="input" /></div>
              <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Course</label>
                <select value={courseId} onChange={e => setCourseId(e.target.value)} className="input">
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-semibold text-slate-600 block mb-1.5">Module</label><input value={moduleTitle} onChange={e => setModule(e.target.value)} placeholder="Module title" className="input" /></div>
            </div>
            <button onClick={() => saveMutation.mutate()} disabled={!courseId || !moduleTitle || !quizTitle || saveMutation.isPending} className="btn-primary">
              {saveMutation.isPending ? 'Saving…' : '💾 Save Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
