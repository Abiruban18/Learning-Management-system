import { useQuery } from '@tanstack/react-query';
import { badgeAPI } from '../../lib/api';
import { Badge, LeaderboardEntry } from '../../types';

const RANK_COLORS: Record<string, string> = {
  Beginner:    'text-slate-500',
  Bronze:      'text-amber-700',
  Silver:      'text-slate-500',
  Gold:        'text-yellow-600',
  Platinum:    'text-cyan-600',
  Diamond:     'text-blue-600',
  Master:      'text-purple-600',
  Grandmaster: 'text-red-600',
  Legend:      'text-orange-600',
  Mythic:      'text-pink-600',
};

const RANK_BG: Record<string, string> = {
  Gold:        'bg-yellow-50 border-yellow-200',
  Platinum:    'bg-cyan-50 border-cyan-200',
  Diamond:     'bg-blue-50 border-blue-200',
  Master:      'bg-purple-50 border-purple-200',
  Grandmaster: 'bg-red-50 border-red-200',
  Legend:      'bg-orange-50 border-orange-200',
  Mythic:      'bg-pink-50 border-pink-200',
};

export default function StudentBadges() {
  const { data: badgeData } = useQuery({ queryKey: ['my-badges'], queryFn: () => badgeAPI.mine().then(r => r.data) });
  const { data: lbData }    = useQuery({ queryKey: ['global-leaderboard'], queryFn: () => badgeAPI.globalLeaderboard().then(r => r.data.leaderboard as LeaderboardEntry[]) });

  const badges: Badge[] = badgeData?.badges ?? [];
  const totalXp         = badgeData?.totalXp ?? 0;
  const level           = badgeData?.level ?? 1;
  const rank            = badgeData?.rank ?? 'Beginner';
  const nextXp          = badgeData?.nextLevelXp ?? 100;
  const leaderboard     = lbData ?? [];
  const xpPct           = Math.min(100, (totalXp / nextXp) * 100);

  const podiumOrder = [1, 0, 2];
  const podiumStyle = ['border-amber-300 bg-amber-50', 'border-slate-300 bg-slate-50', 'border-orange-300 bg-orange-50'];
  const podiumBadge = ['bg-amber-400 text-white', 'bg-slate-400 text-white', 'bg-orange-600 text-white'];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-1">Badges & Leaderboard</h1>
        <p className="text-slate-500">Your achievements and global ranking</p>
      </div>

      {/* Level card */}
      <div className={`card mb-8 ${RANK_BG[rank] ?? 'bg-indigo-50 border-indigo-200'}`}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-lg">
            {level}
          </div>
          <div className="flex-1">
            <div className={`text-2xl font-black mb-0.5 ${RANK_COLORS[rank] ?? 'text-slate-800'}`}>{rank}</div>
            <div className="text-slate-500 text-sm mb-3">{totalXp.toLocaleString()} XP total</div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${xpPct}%` }} />
            </div>
            <div className="text-xs text-slate-400 mt-1.5">{totalXp} / {nextXp} XP to next level</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Badges */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Badges ({badges.length})</h2>
          {badges.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">🏅</div>
              <p className="text-slate-500 text-sm">Complete tasks and quizzes to earn badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {badges.map(b => (
                <div key={b._id} className="card-hover flex items-center gap-3">
                  <span className="text-3xl">{b.icon}</span>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{b.label}</div>
                    <div className="text-xs text-slate-400">{new Date(b.earnedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Global Leaderboard</h2>

          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {podiumOrder.map(pos => {
                const entry = leaderboard[pos];
                if (!entry) return <div key={pos} />;
                return (
                  <div key={pos} className={`card text-center py-4 border ${podiumStyle[pos]}`}>
                    <div className={`w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-black ${podiumBadge[pos]}`}>{pos + 1}</div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mx-auto mb-1.5">{entry.name[0]?.toUpperCase()}</div>
                    <div className="text-xs font-semibold text-slate-800 truncate">{entry.name}</div>
                    <div className="text-xs text-amber-600 font-bold mt-0.5">⭐ {entry.totalXp}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card overflow-hidden p-0">
            {leaderboard.slice(0, 20).map((entry, i) => (
              <div key={entry.studentId} className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${i < 3 ? 'bg-slate-50' : 'hover:bg-slate-50'} transition-colors`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{i + 1}</div>
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">{entry.name[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{entry.name}</div>
                  <div className={`text-xs ${RANK_COLORS[entry.xpRank] ?? 'text-slate-400'}`}>{entry.xpRank}</div>
                </div>
                <div className="text-amber-600 font-bold text-sm shrink-0">⭐ {entry.totalXp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
