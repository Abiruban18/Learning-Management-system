import { useState, useEffect, useCallback } from 'react';
import { gamesAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const WORDS = [
  { word: 'ALGORITHM',  hint: 'A step-by-step procedure for solving a problem', category: 'CS'      },
  { word: 'VARIABLE',   hint: 'A named storage location in programming',         category: 'CS'      },
  { word: 'FUNCTION',   hint: 'A reusable block of code',                        category: 'CS'      },
  { word: 'DATABASE',   hint: 'Organized collection of structured data',         category: 'CS'      },
  { word: 'RECURSION',  hint: 'A function that calls itself',                    category: 'CS'      },
  { word: 'GRAVITY',    hint: 'Force that attracts objects toward each other',   category: 'Physics' },
  { word: 'MOMENTUM',   hint: 'Mass times velocity',                             category: 'Physics' },
  { word: 'ECOSYSTEM',  hint: 'Community of organisms and their environment',    category: 'Biology' },
  { word: 'MITOSIS',    hint: 'Cell division producing two identical cells',     category: 'Biology' },
  { word: 'DEMOCRACY',  hint: 'Government by the people',                        category: 'Social'  },
  { word: 'HYPOTHESIS', hint: 'A proposed explanation for an observation',       category: 'Science' },
  { word: 'METAPHOR',   hint: 'Figure of speech comparing two unlike things',    category: 'English' },
  { word: 'CALCULUS',   hint: 'Branch of math studying rates of change',         category: 'Math'    },
  { word: 'REVOLUTION', hint: 'Fundamental change in power or structure',        category: 'History' },
];

function scramble(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const r = arr.join('');
  return r === word ? scramble(word) : r;
}

interface Props { onXp: (xp: number) => void; onBack: () => void; }

export default function WordScramble({ onXp, onBack }: Props) {
  const [idx, setIdx]       = useState(0);
  const [scrambled, setScr] = useState('');
  const [input, setInput]   = useState('');
  const [timeLeft, setTime] = useState(30);
  const [score, setScore]   = useState(0);
  const [round, setRound]   = useState(1);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase]   = useState<'playing'|'correct'|'wrong'|'done'>('playing');
  const TOTAL = 8;

  const loadWord = useCallback((i: number) => {
    setIdx(i); setScr(scramble(WORDS[i].word));
    setInput(''); setTime(30); setPhase('playing');
  }, []);

  useEffect(() => { loadWord(Math.floor(Math.random() * WORDS.length)); }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { setStreak(0); setPhase('wrong'); setTimeout(() => nextRound(), 1500); return; }
    const id = setTimeout(() => setTime(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, phase]);

  const nextRound = () => {
    if (round >= TOTAL) { setPhase('done'); return; }
    setRound(r => r + 1);
    loadWord(Math.floor(Math.random() * WORDS.length));
  };

  const submit = () => {
    if (input.trim().toUpperCase() === WORDS[idx].word) {
      const xp = Math.max(5, Math.ceil((timeLeft / 30) * 10) + (streak >= 2 ? 5 : 0));
      setScore(s => s + xp); setStreak(s => s + 1); setPhase('correct');
      gamesAPI.awardXp(xp, 'word-scramble').catch(() => {});
      onXp(xp);
      setTimeout(() => nextRound(), 1200);
    } else {
      setInput('');
      toast.error('Not quite!', { duration: 700 });
    }
  };

  const current = WORDS[idx];
  const pct = (timeLeft / 30) * 100;
  const timerColor = timeLeft > 15 ? '#10b981' : timeLeft > 7 ? '#f59e0b' : '#ef4444';

  if (phase === 'done') return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="card max-w-sm w-full text-center pop-in">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">Round Complete!</h2>
        <p className="text-slate-500 mb-6">You earned <span className="text-amber-600 font-black text-xl">+{score} XP</span></p>
        <div className="flex gap-3">
          <button onClick={() => { setRound(1); setScore(0); setStreak(0); loadWord(Math.floor(Math.random() * WORDS.length)); }} className="btn-primary flex-1 justify-center">Play again</button>
          <button onClick={onBack} className="btn-secondary flex-1 justify-center">Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-secondary text-xs py-1.5 px-3">← Back</button>
        <h1 className="text-xl font-black text-slate-800 flex-1">🔤 Word Scramble</h1>
        <span className="xp-badge">⭐ {score} XP</span>
      </div>

      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: TOTAL }, (_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < round - 1 ? 'bg-emerald-500' : i === round - 1 ? 'bg-indigo-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 font-medium">Round {round}/{TOTAL}</span>
          {streak > 1 && <span className="text-xs text-amber-600 font-bold">🔥 {streak} streak!</span>}
          <span className="text-sm font-black" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full mb-6 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: timerColor }} />
        </div>

        <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">{current.category}</div>

        <div className={`text-center py-6 mb-4 rounded-xl border transition-all duration-300 ${
          phase === 'correct' ? 'bg-emerald-50 border-emerald-300' :
          phase === 'wrong'   ? 'bg-red-50 border-red-300' :
          'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-4xl font-black tracking-[0.3em] text-slate-800 mb-3">
            {phase === 'correct' ? current.word : phase === 'wrong' ? current.word : scrambled}
          </div>
          {phase === 'correct' && <div className="text-emerald-600 font-bold text-sm">✓ Correct!</div>}
          {phase === 'wrong'   && <div className="text-red-600 font-bold text-sm">Time's up! Answer: {current.word}</div>}
        </div>

        <p className="text-slate-500 text-sm text-center mb-5">💡 {current.hint}</p>

        {phase === 'playing' && (
          <div className="flex gap-2">
            <input
              className="input flex-1 text-center font-bold tracking-widest uppercase"
              placeholder="Type the word…"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && submit()}
              autoFocus
            />
            <button onClick={submit} className="btn-primary px-5">Check</button>
          </div>
        )}
      </div>
    </div>
  );
}
