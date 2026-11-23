import React, { useState } from 'react';
import { BOSS_VILLAIN_PORTRAIT } from '../game/superheroes';
import { ShieldAlert, Zap } from 'lucide-react';

interface BossBarProps {
  name: string;
  currentHp: number;
  maxHp: number;
  isHit: boolean;
  turnsUntilStrike?: number;
  maxStrikeCooldown?: number;
  isStunned?: boolean;
}

/**
 * Cinematic Superhero Villain Boss Encounter HUD with live Counterattack Countdown & Stun state
 */
export const BossBar: React.FC<BossBarProps> = ({
  name,
  currentHp,
  maxHp,
  isHit,
  turnsUntilStrike = 3,
  maxStrikeCooldown = 3,
  isStunned = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const pct = Math.max(0, Math.min(100, Math.round((currentHp / Math.max(1, maxHp)) * 100)));
  const dangerSoon = turnsUntilStrike <= 1 && !isStunned && currentHp > 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#070E14] via-[#0B221D] to-[#2B0C18] px-3.5 py-2 text-white shadow-lg border transition-all ${
        isHit
          ? 'animate-invalid-shake border-amber-300 ring-2 ring-emerald-400'
          : dangerSoon
          ? 'border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
          : 'border-emerald-400/55'
      }`}
    >
      {/* Cinematic Supervillain Boss Portrait with zero-broken-image fallback */}
      <div
        className={`relative w-12 h-12 shrink-0 overflow-hidden rounded-xl border-2 ${
          isHit ? 'border-emerald-300 scale-95' : dangerSoon ? 'border-rose-400 animate-target-pulse' : 'border-emerald-500/75'
        } bg-gradient-to-br from-slate-950 via-emerald-950 to-rose-950 transition-transform`}
      >
        {!imgFailed ? (
          <img
            src={BOSS_VILLAIN_PORTRAIT}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-emerald-300">
            <ShieldAlert className="w-6 h-6" />
          </div>
        )}
        {isHit && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-emerald-300/45"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
          <span className="truncate text-emerald-100 tracking-wide">{name}</span>
          <span className="tabular-nums text-emerald-300 shrink-0">
            {Math.max(0, currentHp)}/{maxHp}
          </span>
        </div>
        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-black/65 border border-emerald-400/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-600 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Live Villain Counterattack Countdown Row */}
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider">
          {isStunned ? (
            <span className="flex items-center gap-1 text-cyan-300">
              <Zap className="w-3 h-3 fill-current" />
              Boss Stunned! (+1 Turn Delay)
            </span>
          ) : (
            <span className={dangerSoon ? 'text-rose-300 animate-target-pulse' : 'text-amber-200/85'}>
              {dangerSoon ? 'Doom Strike Next Turn!' : `Doom Strike in ${turnsUntilStrike}T`}
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
            {Array.from({ length: maxStrikeCooldown }).map((_, idx) => {
              const filled = idx < maxStrikeCooldown - turnsUntilStrike + 1;
              return (
                <span
                  key={idx}
                  className={`h-1.5 w-3.5 rounded-full transition-colors ${
                    isStunned
                      ? 'bg-cyan-400'
                      : filled
                      ? dangerSoon
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                      : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
