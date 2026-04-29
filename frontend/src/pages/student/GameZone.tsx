import { useState } from 'react';
import WordScramble from '../../components/games/WordScramble';
import MemoryMatch from '../../components/games/MemoryMatch';
import TrueFalseBlitz from '../../components/games/TrueFalseBlitz';
import FillBlank from '../../components/games/FillBlank';

type GameId = 'word' | 'memory' | 'truefalse' | 'fillblank' | null;

const GAMES = [
  { id: 'word' as GameId,      title: 'Word Scramble',     desc: 'Unscramble educational terms before time runs out',        icon: '🔤', xp: '5–15 XP',  bg: 'bg-indigo-50 border-indigo-200',  badge: 'bg-indigo-100 text-indigo-700', difficulty: 'Easy'   },
  { id: 'memory' as GameId,    title: 'Memory Match',      desc: 'Match terms with their definitions in a card flip game',   icon: '🧩', xp: '10–25 XP', bg: 'bg-violet-50 border-violet-200',  badge: 'bg-violet-100 text-violet-700', difficulty: 'Medium' },
  { id: 'truefalse' as GameId, title: 'True / False Blitz',desc: 'Answer rapid-fire true/false questions against the clock', icon: '⚡', xp: '3–10 XP',  bg: 'bg-amber-50 border-amber-200',    badge: 'bg-amber-100 text-amber-700',   difficulty: 'Easy'   },
  { id: 'fillblank' as GameId, title: 'Fill in the Blank', desc: 'Complete sentences by typing the missing keyword',         icon: '✏️', xp: '8–20 XP',  bg: 'bg-emerald-50 border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',difficulty: 'Medium' },
];

export default function GameZone() {
  const [active, setActive]     = useState<GameId>(null);
  const [sessionXp, setSessionXp] = useState(0);

  const handleXp = (xp: number) => setSessionXp(s => s + xp);
  const back = () => setActive(null);

  if (active === 'word')      return <WordScramble onXp={handleXp} onBack={back} />;
  if (active === 'memory')    return <MemoryMatch onXp={handleXp} onBack={back} />;
  if (active === 'truefalse') return <TrueFalseBlitz onXp={handleXp} onBack={back} />;
  if (active === 'fillblank') return <FillBlank onXp={handleXp} onBack={back} />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xl">🎮</div>
          <h1 className="text-3xl font-black text-slate-800">Game Zone</h1>
        </div>
        <p className="text-slate-500">Play educational games, earn XP, and level up your knowledge</p>
      </div>

      {sessionXp > 0 && (
        <div className="card mb-6 bg-amber-50 border-amber-200 flex items-center gap-4">
          <div className="text-3xl">⭐</div>
          <div>
            <div className="text-amber-700 font-black text-xl">+{sessionXp} XP earned this session!</div>
            <div className="text-slate-500 text-sm">Keep playing to earn more</div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setActive(g.id)}
            className={`card-hover text-left border ${g.bg} group`}>
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{g.icon}</div>
              <div className="flex gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${g.badge}`}>{g.difficulty}</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 border border-amber-200">{g.xp}</span>
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition">{g.title}</h3>
            <p className="text-slate-500 text-sm mb-4">{g.desc}</p>
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:text-indigo-500 transition">
              Play now <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        ))}
      </div>

      <div className="card mt-8 bg-indigo-50 border-indigo-200">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: '🎮', title: 'Pick a game',   desc: 'Choose from 4 different game types' },
            { icon: '🧠', title: 'Learn & play',  desc: 'Answer questions based on real course topics' },
            { icon: '⭐', title: 'Earn XP',       desc: 'XP counts toward your level and badges' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="text-2xl">{icon}</div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{title}</div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
