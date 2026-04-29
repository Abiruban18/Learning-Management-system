import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyChallengeAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function DailyChallenge() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult]     = useState<{ correct: boolean; xpEarned: number; explanation: string } | null>(null);
  const [submitting, setSub]    = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['daily-challenge'],
    queryFn: () => dailyChallengeAPI.get().then(r => r.data as { challenge: any; completed: boolean }),
  });

  const challenge = data?.challenge;
  const completed = data?.completed ?? false;

  const submit = async () => {
    if (selected === null) return;
    setSub(true);
    try {
      const res = await dailyChallengeAPI.submit(selected);
      setResult(res.data);
      if (res.data.correct) toast.success(`+${res.data.xpEarned} XP earned!`);
      qc.invalidateQueries({ queryKey: ['daily-challenge'] });
      qc.invalidateQueries({ queryKey: ['activity-summary'] });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Submit failed');
    } finally { setSub(false); }
  };

  const now = new Date();
  const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
  const hoursLeft = Math.floor((midnight.getTime() - now.getTime()) / 3600000);
  const minsLeft  = Math.floor(((midnight.getTime() - now.getTime()) % 3600000) / 60000);

  if (isLoading) return (
    <div className="p-8 flex items-center gap-3 text-slate-400">
      <span className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />Loading…
    </div>
  );

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-xl">🎯</div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Daily Challenge</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">One question per day. Answer correctly to earn bonus XP!</p>
      </div>

      {/* Timer */}
      <div className="card mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Resets in</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{hoursLeft}h {minsLeft}m</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Reward</div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">⭐ {challenge?.xpReward ?? 25} XP</div>
        </div>
      </div>

      <div className="card">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 mb-6">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">{challenge?.question}</p>
        </div>

        <div className="space-y-3 mb-6">
          {challenge?.options.map((opt: any, i: number) => {
            let cls = 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer';
            if (completed || result) {
              if (opt.isCorrect) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-semibold';
              else if (i === selected && !opt.isCorrect) cls = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
              else cls = 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-default';
            } else if (selected === i) {
              cls = 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 font-semibold';
            }
            return (
              <button key={i} disabled={completed || !!result} onClick={() => setSelected(i)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${cls}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${selected === i && !completed && !result ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                  {['A','B','C','D'][i]}
                </span>
                {opt.text}
                {(completed || result) && opt.isCorrect && <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
              </button>
            );
          })}
        </div>

        {(result || completed) && (
          <div className={`p-4 rounded-xl border mb-4 ${result?.correct || completed ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'}`}>
            {result && <div className={`font-bold mb-1 ${result.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {result.correct ? `✓ Correct! +${result.xpEarned} XP earned` : '✗ Not quite!'}
            </div>}
            {completed && !result && <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">✓ Already completed today!</div>}
            <p className="text-sm text-slate-600 dark:text-slate-400">💡 {challenge?.explanation}</p>
          </div>
        )}

        {!completed && !result && (
          <button onClick={submit} disabled={selected === null || submitting} className="btn-primary w-full justify-center py-3">
            {submitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</span> : 'Submit Answer'}
          </button>
        )}
      </div>
    </div>
  );
}
