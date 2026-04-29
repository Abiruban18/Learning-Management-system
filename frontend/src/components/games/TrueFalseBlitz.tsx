import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';

const QUESTIONS = [
  { q: 'Python is a compiled language.',                        a: false },
  { q: 'HTML stands for HyperText Markup Language.',           a: true  },
  { q: 'A CPU has more cores than a GPU typically.',           a: false },
  { q: 'RAM is non-volatile memory.',                          a: false },
  { q: 'JavaScript runs only in the browser.',                 a: false },
  { q: 'SQL stands for Structured Query Language.',            a: true  },
  { q: 'Binary uses digits 0 and 1.',                          a: true  },
  { q: 'HTTP is a secure protocol.',                           a: false },
  { q: 'An algorithm must always terminate.',                  a: true  },
  { q: 'Photosynthesis produces oxygen.',                      a: true  },
  { q: 'The Earth is the largest planet in the solar system.', a: false },
  { q: 'Water boils at 100°C at sea level.',                   a: true  },
  { q: 'DNA stands for Deoxyribonucleic Acid.',                a: true  },
  { q: 'Sound travels faster than light.',                     a: false },
  { q: 'The mitochondria is the powerhouse of the cell.',      a: true  },
  { q: 'World War II ended in 1945.',                          a: true  },
  { q: 'The Great Wall of China is visible from space.',       a: false },
  { q: 'Shakespeare wrote Romeo and Juliet.',                  a: true  },
  { q: 'A prime number has exactly two factors.',              a: true  },
  { q: 'Pi is exactly equal to 3.14.',                         a: false },
];

interface Props { onXp: (xp: number) => void; onBack: () => void; }

export default function TrueFalseBlitz({ onXp, onBack }: Props) {
  const [questions]             = useState(() => [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
  const [idx, setIdx]           = useState(0);
  const [score, setScore]       = useState(0);
  const [timeLeft, setTime]     = useState(10);
  const [phase, setPhase]       = useState<'playing'|'correct'|'wrong'|'done'>('playing');
  const [streak, setStreak]     = useState(0);
  const [answered, setAnswered] = useState<boolean[]>([]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  const handleAnswer = (ans: boolean | null) => {
    const correct = ans === questions[idx].a;
    if (correct) {
      const xp = 3 + (streak >= 2 ? 2 : 0) + Math.ceil(timeLeft / 3);
      setScore(s => s + xp); setStreak(s => s + 1);
      gamesAPI.awardXp(xp, 'true-false').catch(() => {}); onXp(xp);
      setPhase('correct');
    } else {
      setStreak(0); setPhase('wrong');
    }
    setAnswered(a => [...a, correct]);
    setTimeout(() => {
      if (idx + 1 >= questions.length) { setPhase('done'); return; }
      setIdx(i => i + 1); setTime(10); setPhase('playing');
    }, 900);
  };

  const pct = (timeLeft / 10) * 100;
  const timerColor = timeLeft > 5 ? '#10b981' : timeLeft > 3 ? '#f59e0b' : '#ef4444';

  if (phase === 'done') return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="card max-w-sm w-full text-center pop-in">
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Blitz Complete!</h2>
        <p className="text-slate-500 mb-2">{answered.filter(Boolean).length}/{questions.length} correct</p>
        <p className="text-amber-600 font-black text-xl mb-5">+{score} XP</p>
        <div className="flex gap-1.5 justify-center mb-5">
          {answered.map((ok, i) => (
            <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {ok ? '✓' : '✗'}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setPhase('playing'); setIdx(0); setScore(0); setTime(10); setStreak(0); setAnswered([]); }} className="btn-primary flex-1 justify-center">Play again</button>
          <button onClick={onBack} className="btn-secondary flex-1 justify-center">Back</button>
        </div>
      </div>
    </div>
  );

  const current = questions[idx];

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-secondary text-xs py-1.5 px-3">← Back</button>
        <h1 className="text-xl font-black text-slate-800 flex-1">⚡ True / False Blitz</h1>
        <span className="xp-badge">⭐ {score} XP</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all ${
            i < idx ? (answered[i] ? 'bg-emerald-500' : 'bg-red-400') : i === idx ? 'bg-amber-400' : 'bg-slate-200'
          }`} />
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

        {/* Question box */}
        <div className={`p-6 rounded-xl border mb-6 text-center transition-all duration-300 ${
          phase === 'correct' ? 'bg-emerald-50 border-emerald-300' :
          phase === 'wrong'   ? 'bg-red-50 border-red-300' :
          'bg-slate-50 border-slate-200'
        }`}>
          <p className="text-lg font-bold text-slate-800 leading-snug">{current.q}</p>
          {phase === 'correct' && <p className="text-emerald-600 font-bold mt-3 text-sm">✓ Correct!</p>}
          {phase === 'wrong'   && <p className="text-red-600 font-bold mt-3 text-sm">✗ Answer was: {current.a ? 'TRUE' : 'FALSE'}</p>}
        </div>

        {phase === 'playing' && (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleAnswer(true)}
              className="py-5 rounded-2xl border-2 border-emerald-300 bg-emerald-50 text-emerald-700 font-black text-xl hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 active:scale-95">
              ✓ TRUE
            </button>
            <button onClick={() => handleAnswer(false)}
              className="py-5 rounded-2xl border-2 border-red-300 bg-red-50 text-red-600 font-black text-xl hover:bg-red-100 hover:border-red-400 transition-all duration-200 active:scale-95">
              ✗ FALSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
