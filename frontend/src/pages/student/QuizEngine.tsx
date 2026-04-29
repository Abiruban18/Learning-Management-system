import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import api, { quizAPI, aiAPI } from '../../lib/api';
import { Quiz, QuizAttempt } from '../../types';

type Phase = 'intro' | 'question' | 'feedback' | 'result';

export default function QuizEngine() {
  const { quizId } = useParams<{ quizId: string }>();
  const nav = useNavigate();

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => api.get(`/quizzes/${quizId}`).then(r => r.data.quiz as Quiz),
    enabled: !!quizId,
    staleTime: Infinity, // never re-fetch mid-quiz
  });

  const [phase, setPhase]           = useState<Phase>('intro');
  const [qIndex, setQIndex]         = useState(0);
  const [answers, setAnswers]       = useState<number[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [timeLeft, setTimeLeft]     = useState(30);
  const [startTime, setStartTime]   = useState(0);
  const [result, setResult]         = useState<QuizAttempt | null>(null);
  const [scoreInfo, setScoreInfo]   = useState<{ scorePercent: number; passed: boolean; xpEarned: number } | null>(null);
  const [streak, setStreak]         = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const { width, height }           = useWindowSize();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const submitMutation = useMutation({
    mutationFn: (p: object) => quizAPI.submit(p).then(r => r.data),
    onSuccess: d => {
      setResult(d.attempt);
      setScoreInfo({ scorePercent: d.scorePercent, passed: d.passed, xpEarned: d.xpEarned });
      setPhase('result');
      if (d.attempt?._id) {
        setAiLoading(true);
        aiAPI.smartFeedback(d.attempt._id)
          .then(r => setAiFeedback(r.data.feedback))
          .catch(() => setAiFeedback(''))
          .finally(() => setAiLoading(false));
      }
    },
  });

  const currentQ = quiz?.questions[qIndex];
  const totalQ   = quiz?.questions.length ?? 0;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleAnswer = useCallback((optIdx: number) => {
    clearInterval(timerRef.current!);
    setSelected(optIdx);
    const next = [...answers, optIdx];
    setAnswers(next);
    // isCorrect is now always present from backend
    const isOk = optIdx >= 0 && currentQ?.options[optIdx]?.isCorrect === true;
    if (isOk) { setStreak(s => s + 1); setMultiplier(m => Math.min(3, m + 0.5)); }
    else       { setStreak(0); setMultiplier(1); }
    setPhase('feedback');
    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 < (quiz?.questions.length ?? 0)) { setQIndex(i => i + 1); setPhase('question'); }
      else submitMutation.mutate({ quizId, answers: next, timeTakenSeconds: Math.round((Date.now() - startTime) / 1000) });
    }, 1800);
  }, [qIndex, quiz, answers, startTime, quizId, currentQ]);

  useEffect(() => {
    if (phase !== 'question' || !currentQ) return;
    setTimeLeft(currentQ.timeLimitSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current!); handleAnswer(-1); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line
  }, [phase, qIndex]);

  if (isLoading || !quiz) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading quiz…</p>
      </div>
    </div>
  );

  const C   = 2 * Math.PI * 40;
  const pct = currentQ ? timeLeft / currentQ.timeLimitSeconds : 1;
  const tc  = pct > 0.5 ? '#10b981' : pct > 0.25 ? '#f59e0b' : '#ef4444';

  /* ── INTRO ── */
  if (phase === 'intro') return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center pop-in">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-5xl mx-auto mb-6 shadow-[0_8px_32px_rgba(99,102,241,0.3)]">
          🧠
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">{quiz.title}</h1>
        <p className="text-slate-500 mb-8">{quiz.questions.length} questions · Pass at {quiz.passingScore}% · {quiz.xpReward} XP</p>
        <div className="card mb-8 text-left space-y-3">
          {[
            ['⏱', 'Each question has its own countdown timer'],
            ['⚡', 'Timeout counts as a wrong answer'],
            ['🎯', `Score ${quiz.passingScore}%+ to earn full XP`],
            ['🔥', 'Build answer streaks for bonus multipliers'],
          ].map(([icon, text]) => (
            <div key={text as string} className="flex items-center gap-3 text-sm text-slate-600">
              <span className="text-xl w-7 text-center">{icon}</span>{text}
            </div>
          ))}
        </div>
        <button onClick={() => { setStartTime(Date.now()); setPhase('question'); }} className="w-full btn-primary justify-center py-4 text-lg">
          Start quiz ⚡
        </button>
      </div>
    </div>
  );

  /* ── RESULT ── */
  if (phase === 'result' && scoreInfo) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-6 relative overflow-hidden">
      {scoreInfo.passed && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} gravity={0.2} />}
      <div className="max-w-sm w-full text-center pop-in relative z-10">
        <div className="text-7xl mb-4">{scoreInfo.passed ? '🏆' : '💪'}</div>
        <div className="text-7xl font-black text-slate-800 mb-1">{scoreInfo.scorePercent}%</div>
        <p className={`text-xl font-bold mb-8 ${scoreInfo.passed ? 'text-emerald-600' : 'text-red-500'}`}>
          {scoreInfo.passed ? 'You passed!' : 'Keep trying!'}
        </p>

        <div className="card mb-5 grid grid-cols-3 gap-4 text-center">
          {[
            ['⭐', `+${scoreInfo.xpEarned}`, 'XP'],
            ['✅', `${answers.filter((a, i) => quiz.questions[i]?.options[a]?.isCorrect === true).length}/${totalQ}`, 'Correct'],
            ['⏱', `${result?.timeTakenSeconds ?? 0}s`, 'Time'],
          ].map(([ic, v, l]) => (
            <div key={l as string}>
              <div className="text-2xl mb-1">{ic}</div>
              <div className="text-slate-800 font-black text-lg">{v}</div>
              <div className="text-slate-400 text-xs">{l}</div>
            </div>
          ))}
        </div>

        {/* Per-question review */}
        <div className="card mb-5 text-left space-y-1.5 max-h-52 overflow-y-auto p-4">
          {quiz.questions.map((q, i) => {
            const chosen = answers[i];
            const ok = chosen >= 0 && q.options[chosen]?.isCorrect === true;
            const correctOpt = q.options.find(o => o.isCorrect === true);
            return (
              <div key={i} className={`text-xs px-3 py-2 rounded-xl border ${ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                <span className="font-black mr-2">{ok ? '✓' : '✗'}</span>
                <span className="text-slate-600">{q.question.slice(0, 60)}{q.question.length > 60 ? '…' : ''}</span>
                {!ok && correctOpt && <div className="mt-1 pl-4 text-slate-500">Correct: {correctOpt.text}</div>}
              </div>
            );
          })}
        </div>

        {/* AI Feedback */}
        {(aiLoading || aiFeedback) && (
          <div className="card mb-5 border-violet-200 bg-violet-50 text-left">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-violet-600 text-sm font-bold">✦ AI Feedback</span>
              {aiLoading && <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />}
            </div>
            {aiFeedback && <p className="text-slate-600 text-sm leading-relaxed">{aiFeedback}</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => nav(-1)} className="flex-1 btn-secondary justify-center py-3">Back to course</button>
          <button
            onClick={() => { setPhase('intro'); setQIndex(0); setAnswers([]); setSelected(null); setResult(null); setScoreInfo(null); setStreak(0); setMultiplier(1); setAiFeedback(''); }}
            className="flex-1 btn-primary justify-center py-3"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );

  if (!currentQ) return null;

  /* ── QUESTION ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {quiz.questions.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${
              i < qIndex   ? 'bg-emerald-400 w-6 h-1.5' :
              i === qIndex ? 'bg-indigo-400 w-10 h-1.5' :
              'bg-white/20 w-6 h-1.5'
            }`} />
          ))}
        </div>

        {/* Timer + question */}
        <div className="flex items-start gap-5 mb-6">
          <div className="relative shrink-0 w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={tc} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-black ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{timeLeft}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Q{qIndex + 1} / {totalQ}</span>
              {streak > 1 && <span className={`text-xs font-black text-amber-400 ${streak > 2 ? 'animate-pulse' : ''}`}>🔥 {streak} Streak! ×{multiplier.toFixed(1)}</span>}
            </div>
            <h2 className="text-xl font-bold text-white leading-snug mb-3">{currentQ.question}</h2>
            <span className="xp-badge">⭐ {currentQ.points} pts</span>
          </div>
        </div>

        {/* Options */}
        <div className="grid gap-3">
          {currentQ.options.map((opt, oi) => {
            // Default: unselected state
            let cls = 'bg-white/[0.06] border-white/[0.12] text-slate-200 hover:bg-white/[0.12] hover:border-white/[0.25] cursor-pointer';

            if (phase === 'feedback') {
              const isSelected = oi === selected;
              const isCorrect  = opt.isCorrect === true;

              if (isSelected && isCorrect) {
                // User picked the right answer ✓
                cls = 'bg-emerald-500 border-emerald-400 text-white cursor-default shadow-[0_0_20px_rgba(16,185,129,0.5)]';
              } else if (isSelected && !isCorrect) {
                // User picked wrong answer ✗
                cls = 'bg-red-500 border-red-400 text-white cursor-default shadow-[0_0_20px_rgba(239,68,68,0.4)]';
              } else if (!isSelected && isCorrect) {
                // Show the correct answer highlighted
                cls = 'bg-emerald-500/20 border-emerald-400 text-emerald-300 cursor-default';
              } else {
                // Other unselected wrong options — dim them
                cls = 'bg-white/[0.02] border-white/[0.06] text-slate-500 cursor-default';
              }
            }

            return (
              <button
                key={oi}
                disabled={phase === 'feedback'}
                onClick={() => handleAnswer(oi)}
                className={`text-left px-5 py-4 rounded-2xl border text-sm font-medium transition-all duration-300 ${cls}`}
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-black mr-3 shrink-0">
                  {['A','B','C','D'][oi]}
                </span>
                {opt.text}
                {phase === 'feedback' && oi === selected && opt.isCorrect === true && <span className="ml-2 font-black">✓</span>}
                {phase === 'feedback' && oi === selected && opt.isCorrect !== true && <span className="ml-2 font-black">✗</span>}
              </button>
            );
          })}
        </div>

        {phase === 'feedback' && currentQ.explanation && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-sm text-indigo-200 pop-in">
            💡 {currentQ.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
