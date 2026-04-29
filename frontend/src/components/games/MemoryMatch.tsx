import { useState, useEffect } from 'react';
import { gamesAPI } from '../../lib/api';

const PAIRS = [
  { term: 'Array',    def: 'Ordered list of elements'     },
  { term: 'Loop',     def: 'Repeats a block of code'      },
  { term: 'Class',    def: 'Blueprint for objects'        },
  { term: 'API',      def: 'Interface between software'   },
  { term: 'Bug',      def: 'Error in code'                },
  { term: 'Cache',    def: 'Temporary fast storage'       },
  { term: 'Compile',  def: 'Convert code to machine lang' },
  { term: 'Debug',    def: 'Find and fix errors'          },
];

interface Card { id: number; text: string; pairId: number; type: 'term'|'def'; flipped: boolean; matched: boolean; }
interface Props { onXp: (xp: number) => void; onBack: () => void; }

function buildDeck(): Card[] {
  const sel = [...PAIRS].sort(() => Math.random() - 0.5).slice(0, 6);
  const cards: Card[] = [];
  sel.forEach((p, i) => {
    cards.push({ id: i * 2,     text: p.term, pairId: i, type: 'term', flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, text: p.def,  pairId: i, type: 'def',  flipped: false, matched: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryMatch({ onXp, onBack }: Props) {
  const [cards, setCards]       = useState<Card[]>(buildDeck);
  const [sel, setSel]           = useState<number[]>([]);
  const [moves, setMoves]       = useState(0);
  const [matches, setMatches]   = useState(0);
  const [locked, setLocked]     = useState(false);
  const [done, setDone]         = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime]             = useState(Date.now());

  useEffect(() => {
    if (sel.length !== 2) return;
    setLocked(true);
    const [a, b] = sel.map(id => cards.find(c => c.id === id)!);
    if (a.pairId === b.pairId && a.type !== b.type) {
      setCards(cs => cs.map(c => sel.includes(c.id) ? { ...c, matched: true } : c));
      const nm = matches + 1;
      setMatches(nm);
      setSel([]);
      setLocked(false);
      if (nm === 6) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const xp = Math.max(10, 25 - Math.floor(elapsed / 10) - Math.floor(moves / 3));
        setXpEarned(xp);
        gamesAPI.awardXp(xp, 'memory-match').catch(() => {});
        onXp(xp);
        setDone(true);
      }
    } else {
      setTimeout(() => {
        setCards(cs => cs.map(c => sel.includes(c.id) ? { ...c, flipped: false } : c));
        setSel([]);
        setLocked(false);
      }, 900);
    }
    setMoves(m => m + 1);
  }, [sel]);

  const flip = (id: number) => {
    if (locked) return;
    const card = cards.find(c => c.id === id)!;
    if (card.flipped || card.matched || sel.length === 2) return;
    setCards(cs => cs.map(c => c.id === id ? { ...c, flipped: true } : c));
    setSel(s => [...s, id]);
  };

  const restart = () => { setCards(buildDeck()); setSel([]); setMoves(0); setMatches(0); setLocked(false); setDone(false); setXpEarned(0); };

  if (done) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="card max-w-sm w-full text-center pop-in">
        <div className="text-6xl mb-4">🧩</div>
        <h2 className="text-2xl font-black text-slate-800 mb-1">All Matched!</h2>
        <p className="text-slate-500 mb-2">{moves} moves · <span className="text-amber-600 font-black">+{xpEarned} XP</span></p>
        <div className="flex gap-3 mt-5">
          <button onClick={restart} className="btn-primary flex-1 justify-center">Play again</button>
          <button onClick={onBack} className="btn-secondary flex-1 justify-center">Back</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-secondary text-xs py-1.5 px-3">← Back</button>
        <h1 className="text-xl font-black text-slate-800 flex-1">🧩 Memory Match</h1>
        <span className="text-slate-500 text-sm font-medium">{moves} moves · {matches}/6 matched</span>
      </div>
      <p className="text-slate-500 text-sm mb-6">Match each term with its definition. Click two cards to flip them.</p>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all ${i < matches ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => flip(card.id)}
            className={`aspect-square rounded-xl border text-xs font-semibold p-2 transition-all duration-300 flex items-center justify-center text-center leading-tight ${
              card.matched
                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default'
                : card.flipped
                ? card.type === 'term'
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                  : 'bg-violet-100 border-violet-300 text-violet-800'
                : 'bg-slate-100 border-slate-300 text-slate-400 hover:bg-slate-200 hover:border-slate-400 cursor-pointer text-lg'
            }`}
          >
            {card.flipped || card.matched ? card.text : '?'}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mt-6 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-200 inline-block" />Term</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-200 inline-block" />Definition</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200 inline-block" />Matched</span>
      </div>
    </div>
  );
}
