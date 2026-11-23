import React, { useState } from 'react';
import { BoosterType, SaveState } from '../game/types';
import { getT } from '../i18n/translations';
import { AdService } from '../services/adService';
import { soundService } from '../services/soundService';
import { getTodayKey } from '../services/storageService';
import { Calendar, Check, Coins, Gift, RotateCw, Video, X } from 'lucide-react';

interface DailyRewardModalProps {
  save: SaveState;
  isOnline: boolean;
  onClose: () => void;
  onClaimCalendarDay: (coins: number, booster?: BoosterType) => void;
  onDoubleCalendarReward: (extraCoins: number) => void;
  onSpinReward: (reward: { coins?: number; booster?: BoosterType; amount?: number }, isBonusSpin: boolean) => void;
}

const CALENDAR_DAYS = [
  { day: 1, label: '60 Credits', coins: 60 },
  { day: 2, label: '1x Mjolnir', coins: 40, booster: 'hammer' as BoosterType },
  { day: 3, label: '100 Credits', coins: 100 },
  { day: 4, label: '1x Shuffle', coins: 50, booster: 'shuffle' as BoosterType },
  { day: 5, label: '150 Credits', coins: 150 },
  { day: 6, label: '1x +5 Turns', coins: 75, booster: 'extra_moves' as BoosterType },
  { day: 7, label: '300 Credits + Orb', coins: 300, booster: 'color_bomb' as BoosterType },
];

const WHEEL_SLICES: Array<{
  label: string;
  color: string;
  coins?: number;
  booster?: BoosterType;
  amount?: number;
}> = [
  { label: '75 Credits', color: '#059669', coins: 75 },
  { label: 'Mjolnir', color: '#4F46E5', booster: 'hammer', amount: 1 },
  { label: '150 Credits', color: '#DC2626', coins: 150 },
  { label: 'Shuffle', color: '#0284C7', booster: 'shuffle', amount: 1 },
  { label: '50 Credits', color: '#0D9488', coins: 50 },
  { label: 'Infinity Orb', color: '#9333EA', booster: 'color_bomb', amount: 1 },
  { label: '250 Credits', color: '#D97706', coins: 250 },
  { label: '+5 Turns', color: '#DB2777', booster: 'extra_moves', amount: 1 },
];

export const DailyRewardModal: React.FC<DailyRewardModalProps> = ({
  save,
  isOnline,
  onClose,
  onClaimCalendarDay,
  onDoubleCalendarReward,
  onSpinReward,
}) => {
  const t = getT(save.settings.language);
  const today = getTodayKey();
  const [tab, setTab] = useState<'wheel' | 'calendar'>('wheel');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastWon, setLastWon] = useState<string | null>(null);
  const [adBusy, setAdBusy] = useState(false);

  const canSpinFree = save.dailySpin.lastSpinDate !== today;
  const canBonusSpin =
    !canSpinFree &&
    save.dailySpin.bonusSpinUsedDate !== today &&
    isOnline &&
    AdService.isAdReady();

  const claimedToday = save.dailyLogin.lastClaimDate === today;
  const currentDayIdx = save.dailyLogin.streak % 7;
  const canDoubleCalendar =
    claimedToday && !save.dailyLogin.doubledToday && isOnline && AdService.isAdReady();

  const executeSpin = (isBonus: boolean) => {
    if (spinning) return;
    setSpinning(true);
    setLastWon(null);
    const sliceIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    const sliceAngle = 360 / WHEEL_SLICES.length;
    const targetMod = (360 - (sliceIndex * sliceAngle + sliceAngle / 2)) % 360;
    const nextRot = rotation + 1440 + ((targetMod - (rotation % 360) + 360) % 360);
    setRotation(nextRot);

    let ticks = 0;
    const tickId = window.setInterval(() => {
      soundService.playSpinTick();
      ticks++;
      if (ticks >= 16) clearInterval(tickId);
    }, 170);

    window.setTimeout(() => {
      clearInterval(tickId);
      const prize = WHEEL_SLICES[sliceIndex];
      setSpinning(false);
      setLastWon(prize.label);
      soundService.playWin();
      onSpinReward(
        { coins: prize.coins, booster: prize.booster, amount: prize.amount },
        isBonus
      );
    }, 3100);
  };

  const handleBonusSpinAd = async () => {
    setAdBusy(true);
    const ok = await AdService.showRewarded('bonus_daily_spin');
    setAdBusy(false);
    if (ok) executeSpin(true);
  };

  const handleDoubleCalendarAd = async () => {
    setAdBusy(true);
    const ok = await AdService.showRewarded('double_daily_reward');
    setAdBusy(false);
    if (ok) {
      const prevIdx = (save.dailyLogin.streak - 1 + 7) % 7;
      onDoubleCalendarReward(CALENDAR_DAYS[prevIdx].coins);
      soundService.playCoin();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#0B121E] text-slate-100 p-5 sm:p-6 shadow-2xl border border-emerald-500/45">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-black text-white">{t.dailyRewards}</h2>
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
            onClick={() => setTab('wheel')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              tab === 'wheel' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <RotateCw className="w-4 h-4" /> Supply Wheel
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
              tab === 'calendar' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Calendar className="w-4 h-4" /> 7-Day Drop
          </button>
        </div>

        {tab === 'wheel' && (
          <div className="mt-5 flex flex-col items-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              <div
                aria-hidden="true"
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 h-0 w-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-emerald-400 drop-shadow"
              />
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full drop-shadow-[0_0_24px_rgba(16,185,129,0.3)]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                }}
              >
                {WHEEL_SLICES.map((slice, i) => {
                  const angle = 360 / WHEEL_SLICES.length;
                  const startRad = ((i * angle - 90) * Math.PI) / 180;
                  const endRad = (((i + 1) * angle - 90) * Math.PI) / 180;
                  const x1 = 100 + 94 * Math.cos(startRad);
                  const y1 = 100 + 94 * Math.sin(startRad);
                  const x2 = 100 + 94 * Math.cos(endRad);
                  const y2 = 100 + 94 * Math.sin(endRad);
                  const midAngle = i * angle + angle / 2;
                  return (
                    <g key={slice.label}>
                      <path
                        d={`M100,100 L${x1},${y1} A94,94 0 0,1 ${x2},${y2} Z`}
                        fill={slice.color}
                        stroke="#0B121E"
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y="32"
                        fill="#FFFFFF"
                        fontSize="8.2"
                        fontWeight="800"
                        textAnchor="middle"
                        transform={`rotate(${midAngle} 100 100)`}
                      >
                        {slice.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="22" fill="#0F172A" stroke="#34D399" strokeWidth="4" />
                <text x="100" y="103" textAnchor="middle" fontSize="9" fontWeight="900" fill="#6EE7B7">
                  SPIN
                </text>
              </svg>
            </div>

            {lastWon && (
              <div className="mt-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 px-4 py-2 text-sm font-bold text-emerald-200">
                Secured: {lastWon}!
              </div>
            )}

            <div className="mt-4 flex w-full flex-col gap-2">
              {canSpinFree ? (
                <button
                  disabled={spinning}
                  onClick={() => executeSpin(false)}
                  className="min-h-[46px] w-full rounded-xl bg-emerald-500 text-sm font-black text-slate-950 hover:bg-emerald-400 shadow-md disabled:opacity-50"
                >
                  {spinning ? 'Spinning...' : 'Spin Free Supply Wheel'}
                </button>
              ) : (
                <div className="text-center text-xs font-semibold text-slate-400 py-1">
                  Today&apos;s free supply spin claimed! Return tomorrow, Avenger.
                </div>
              )}

              {canBonusSpin && (
                <button
                  disabled={spinning || adBusy}
                  onClick={handleBonusSpinAd}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  <Video className="w-4 h-4" /> {t.watchAdBonusSpin}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'calendar' && (
          <div className="mt-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {CALENDAR_DAYS.map((d, idx) => {
                const isPast = idx < currentDayIdx || (claimedToday && idx === (currentDayIdx - 1 + 7) % 7);
                const isToday = !claimedToday && idx === currentDayIdx;
                return (
                  <div
                    key={d.day}
                    className={`flex flex-col items-center justify-between rounded-2xl border p-3 text-center ${
                      d.day === 7 ? 'col-span-3 sm:col-span-2 bg-amber-950/35 border-amber-500/50' : ''
                    } ${
                      isToday
                        ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-400/60'
                        : isPast
                        ? 'border-emerald-600/40 bg-emerald-950/25'
                        : 'border-slate-800 bg-slate-900/90'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-emerald-400">Day {d.day}</span>
                    <div className="my-1.5">
                      {isPast ? (
                        <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                      ) : d.booster ? (
                        <Gift className="w-5 h-5 text-cyan-400 mx-auto" />
                      ) : (
                        <Coins className="w-5 h-5 text-amber-400 mx-auto" />
                      )}
                    </div>
                    <span className="text-xs font-extrabold text-white">{d.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {!claimedToday ? (
                <button
                  onClick={() => {
                    const item = CALENDAR_DAYS[currentDayIdx];
                    soundService.playWin();
                    onClaimCalendarDay(item.coins, item.booster);
                  }}
                  className="min-h-[46px] w-full rounded-xl bg-emerald-500 text-sm font-black text-slate-950 hover:bg-emerald-400 shadow-md"
                >
                  Claim Day {CALENDAR_DAYS[currentDayIdx].day} Supply Drop
                </button>
              ) : (
                <div className="text-center text-xs font-semibold text-emerald-400 py-1">
                  Today&apos;s supply drop claimed!
                </div>
              )}

              {canDoubleCalendar && (
                <button
                  disabled={adBusy}
                  onClick={handleDoubleCalendarAd}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-bold text-white hover:bg-cyan-500"
                >
                  <Video className="w-4 h-4" /> {t.watchAdDoubleReward}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
