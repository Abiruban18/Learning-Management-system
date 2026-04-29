import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const QUESTIONS = [
  { sentence: 'A ___ is a step-by-step procedure for solving a problem.',   answer: 'algorithm',    hint: 'Starts with A' },
  { sentence: 'In Python, you use a ___ loop to iterate over a list.',      answer: 'for',          hint: '3 letters'     },
  { sentence: 'HTML stands for HyperText ___ Language.',                    answer: 'markup',       hint: 'Starts with M' },
  { sentence: 'The ___ is the powerhouse of the cell.',                     answer: 'mitochondria', hint: 'Starts with M' },
  { sentence: 'Water is made of hydrogen and ___.',                         answer: 'oxygen',       hint: 'Starts with O' },
  { sentence: 'A ___ number is only divisible by 1 and itself.',            answer: 'prime',        hint: 'Starts with P' },
  { sentence: 'SQL stands for Structured ___ Language.',                    answer: 'query',        hint: 'Starts with Q' },
  { sentence: 'In OOP, a ___ is a blueprint for creating objects.',         answer: 'class',        hint: 'Starts with C' },
  { sentence: 'A ___ is a collection of key-value pairs in Python.',       answer: 'dictionary',   hint: 'Starts with D' },
  { sentence: 'The ___ is the largest organ in the human body.',           answer: 'skin',         hint: 'Starts with S' },
];

interface Props { onXp: (xp: number) => void; onBack: () => void; }

export default function FillBlank({ onXp, onBack }: Props) {
  const [questions]         = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 7));
  const [idx, setIdx]       = useState(0);
  const [input, setInput]   = useState('');
  const [score, setScore]   = useState(0);
  const [timeLeft, setTime] = useState(20);
  const [phase, setPhase]   = useState<'playing'|'correct'|'wrong'|'done'>('playing');
  const [showHint, setHint] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { wrong(); return; }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  const wrong = () => { setStreak(0); setPhase('wrong'); setTimeout(() => next(), 1500); };

  const next = () => {
    if (idx + 1 >= questions.length) { setPhase('done'); return; }
    setIdx(i => i + 1); setInput(''); setTime(20); setPhase('playing'); setHint(false);
  };

  const submit = () => {
    const ans     = input.trim().toLowerCase();
    const correct = questions[idx].answer.toLowerCase();
    if (ans === correct || (correct.startsWith(ans) && ans.length >= correct.length - 2)) {
      const xp = Math.max(5, 8 + Math.ceil(timeLeft / 4) + (streak >= 2 ? 4 : 0));
      setScore(s => s + xp); setStreak(s => s + 1); setPhase('correct');
      gamesAPI.awardXp(xp, 'fill-blank').catch(() => {}); onXp(xp);
      setTimeout(() => next(), 1200);
    } else {
      setInput('');
      toast.error('Not quite! Try again.', { duration: 700 });
    }
  };

  const pct = (timeLeft / 20) * 100;
  const timerColor = timeLeft > 10 ? '#10b981' : timeLeft > 5 ? '#f59e0b' : '#ef4444';

  if (phase === 'done') return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="card max-w-sm w-full text-center pop-in">
        <div className="text-6xl mb-4">✏️</div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Complete!</h2>
        <p className="text-amber-600 font-black text-xl mb-5">+{score} XP earned</p>
        <div className="flex gap-3">
          <button onClick={() => { setIdx(0); setInput(''); setScore(0); setTime(20); setPhase('playing'); setHint(false); setStreak(0); }} className="btn-primary flex-1 justify-center">Play again</button>
          <button onClick={onBack} className="btn-secondary flex-1 justify-center">Back</button>
        </div>
      </div>
    </div>
  );

  const current = questions[idx];
  const parts   = current.sentence.split('___');

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-secondary text-xs py-1.5 px-3">← Back</button>
        <h1 className="text-xl font-black text-slate-800 flex-1">✏️ Fill in the Blank</h1>
        <span className="xp-badge">⭐ {score} XP</span>
      </div>

      <div className="flex gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 font-medium">{idx + 1} / {questions.length}</span>
          {streak > 1 && <span className="text-xs text-amber-600 font-bold">🔥 {streak} streak!</span>}
          <span className="text-sm font-black" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full mb-6 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: timerColor }} />
        </div>

        {/* Sentence with blank */}
        <div className={`p-5 rounded-xl border mb-5 transition-all duration-300 ${
          phase === 'correct' ? 'bg-emerald-50 border-emerald-300' :
          phase === 'wrong'   ? 'bg-red-50 border-red-300' :
          'bg-slate-50 border-slate-200'
        }`}>
          <p className="text-lg font-semibold text-slate-800 leading-relaxed text-center">
            {parts[0]}
            <span className={`inline-block min-w-[110px] border-b-2 mx-2 px-1 text-center font-black ${
              phase === 'correct' ? 'border-emerald-500 text-emerald-700' :
              phase === 'wrong'   ? 'border-red-500 text-red-600' :
              'border-indigo-500 text-indigo-700'
            }`}>
              {phase === 'correct' ? current.answer : phase === 'wrong' ? current.answer : (input || '___')}
            </span>
            {parts[1]}
          </p>
          {phase === 'correct' && <p className="text-emerald-600 font-bold text-sm text-center mt-3">✓ Correct!</p>}
          {phase === 'wrong'   && <p className="text-red-600 font-bold text-sm text-center mt-3">Time's up! Answer: <strong>{current.answer}</strong></p>}
        </div>

        {showHint && (
          <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg mb-4">
            💡 Hint: {current.hint}
          </div>
        )}

        {phase === 'playing' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Type your answer…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoFocus
              />
              <button onClick={submit} className="btn-primary px-5">Submit</button>
            </div>
            {!showHint && (
              <button onClick={() => setHint(true)} className="text-xs text-slate-400 hover:text-indigo-600 transition font-medium">
                💡 Show hint
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
