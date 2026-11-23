import React, { useState } from 'react';
import { ACHIEVEMENTS, STICKER_ALBUM } from '../game/themes';
import { SaveState } from '../game/types';
import { SweetIcon } from './SweetIcon';
import { Award, BookOpen, Check, Coins, Lock, Play, Trophy, Wifi, X } from 'lucide-react';

interface CollectionModalProps {
  save: SaveState;
  isOnline: boolean;
  initialTab?: 'stickers' | 'achievements' | 'daily';
  onClose: () => void;
  onClaimAchievement: (id: string, rewardCoins: number) => void;
  onStartDailyChallenge: () => void;
}

const CATEGORY_DISPLAY: Record<'Sweets' | 'Cities' | 'Festivals', string> = {
  Sweets: 'Relics',
  Cities: 'Sectors',
  Festivals: 'Multiverse',
};

export const CollectionModal: React.FC<CollectionModalProps> = ({
  save,
  isOnline,
  initialTab = 'stickers',
  onClose,
  onClaimAchievement,
  onStartDailyChallenge,
}) => {
  const [tab, setTab] = useState<'stickers' | 'achievements' | 'daily'>(initialTab);
  const [boardScope, setBoardScope] = useState<'local' | 'online'>('local');

  const totalStars = Object.values(save.levels).reduce((acc, l) => acc + l.stars, 0);
  const evalStats = { ...save.stats, totalStars };

  const sortedBoard = [...save.dailyChallenge.leaderboard].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#0B121E] text-slate-100 p-5 sm:p-6 shadow-2xl border border-emerald-500/45">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">Avenger Vault, Badges & Daily Ops</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setTab('stickers')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              tab === 'stickers' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Relics ({save.stickersUnlocked.length}/{STICKER_ALBUM.length})
          </button>
          <button
            onClick={() => setTab('achievements')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              tab === 'achievements' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" /> Commendations
          </button>
          <button
            onClick={() => setTab('daily')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              tab === 'daily' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Trophy className="w-4 h-4" /> Daily Ops
          </button>
        </div>

        {tab === 'stickers' && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STICKER_ALBUM.map((st) => {
              const owned = save.stickersUnlocked.includes(st.id);
              return (
                <div
                  key={st.id}
                  className={`flex flex-col items-center rounded-2xl border p-3.5 text-center ${
                    owned
                      ? 'border-emerald-500/45 bg-emerald-950/35'
                      : 'border-slate-800 bg-slate-900/60 opacity-70'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 shadow-sm border border-slate-800">
                    {owned ? (
                      st.sweet ? (
                        <SweetIcon sweet={st.sweet} className="w-10 h-10" />
                      ) : (
                        <Award className="w-6 h-6 text-emerald-400" />
                      )
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div className="mt-2 text-xs font-extrabold text-white">{st.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {owned ? `${CATEGORY_DISPLAY[st.category]} · Secured` : st.unlockHint}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="mt-4 flex flex-col gap-2.5">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = save.achievementsUnlocked.includes(ach.id) || ach.check(evalStats);
              const claimed = save.achievementsClaimed.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white">{ach.title}</div>
                    <div className="text-xs text-slate-400">{ach.description}</div>
                  </div>
                  <button
                    disabled={!unlocked || claimed}
                    onClick={() => onClaimAchievement(ach.id, ach.rewardCoins)}
                    className={`shrink-0 flex min-h-[38px] items-center gap-1 rounded-xl px-3.5 text-xs font-bold ${
                      claimed
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : unlocked
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {claimed ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Claimed
                      </>
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5" /> +{ach.rewardCoins}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'daily' && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-4 text-white border border-emerald-400/40">
              <div>
                <div className="text-xs font-semibold text-emerald-200">Today&apos;s Seeded Avenger Grid</div>
                <div className="text-lg font-black">Daily Avenger Op</div>
                <div className="text-xs text-emerald-100 mt-0.5 tabular-nums">
                  Your best today: {save.dailyChallenge.bestTodayScore.toLocaleString()} pts
                </div>
              </div>
              <button
                onClick={onStartDailyChallenge}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-4 text-sm font-extrabold text-slate-950 hover:bg-emerald-50 shadow"
              >
                <Play className="w-4 h-4 fill-current" /> Deploy Today&apos;s Op
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white">Avenger Rankings</h3>
              <div className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setBoardScope('local')}
                  className={`rounded-md px-2.5 py-1 font-bold ${
                    boardScope === 'local' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
                  }`}
                >
                  Local
                </button>
                <button
                  disabled={!isOnline}
                  onClick={() => setBoardScope('online')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-bold disabled:opacity-45 ${
                    boardScope === 'online' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
                  }`}
                >
                  <Wifi className="w-3 h-3" /> {isOnline ? 'Online' : 'Offline'}
                </button>
              </div>
            </div>

            <div className="mt-2.5 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/90">
              {sortedBoard.map((row, idx) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm ${
                    row.isPlayer ? 'bg-emerald-950/50 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 font-black tabular-nums text-emerald-400">#{idx + 1}</span>
                    <span className="truncate font-semibold text-white">{row.name}</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">{row.city}</span>
                  </div>
                  <span className="font-extrabold tabular-nums text-emerald-300">
                    {row.score.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
