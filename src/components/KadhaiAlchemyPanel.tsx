import React, { useState } from 'react';
import {
  KADHAI_RECIPES,
  RoyalGuestOrder,
  doesFusionSatisfyOrder,
} from '../game/kadhai';
import { SWEET_META } from '../game/themes';
import { GravityDir, KadhaiRecipeId, SweetType } from '../game/types';
import { SweetIcon } from './SweetIcon';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Coins,
  Cpu,
  RotateCcw,
  RotateCw,
  Shield,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

interface KadhaiAlchemyPanelProps {
  slots: SweetType[];
  brewedRecipe: KadhaiRecipeId | null;
  colorBlindMode: boolean;
  disabled: boolean;
  isDarkTheme: boolean;
  onServeDish: () => void;
  compact?: boolean;
}

/**
 * Animated SVG Stark Arc Forge Reactor with emerald Doomsday plasma arcs
 * and 3 live relic containment slots.
 */
export const KadhaiAlchemyPanel: React.FC<KadhaiAlchemyPanelProps> = ({
  slots,
  brewedRecipe,
  colorBlindMode,
  disabled,
  onServeDish,
  compact = false,
}) => {
  const [showGuide, setShowGuide] = useState(false);
  const recipe = brewedRecipe ? KADHAI_RECIPES[brewedRecipe] : null;
  const isReady = Boolean(recipe);

  return (
    <>
      <div
        className={`rounded-2xl border p-2.5 sm:p-3 shadow-sm transition-colors ${
          isReady
            ? 'border-emerald-400 bg-emerald-950/90 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.28)]'
            : 'border-slate-700/80 bg-slate-900/90 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Zap className={`w-4 h-4 shrink-0 ${isReady ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span className="text-xs font-extrabold truncate">
              Stark Arc Forge ({slots.length}/3)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="text-[11px] font-bold underline-offset-2 hover:underline flex items-center gap-1 whitespace-nowrap shrink-0 text-emerald-300"
          >
            <BookOpen className="w-3 h-3" />
            <span>Specs</span>
          </button>
        </div>

        {/* Live Animated Stark Arc Forge Reactor + 3 Relic Slots */}
        <div className={`mt-2 flex ${compact ? 'flex-row items-center gap-2.5' : 'flex-col items-center gap-2'}`}>
          <div className={`relative shrink-0 ${compact ? 'w-16 h-14' : 'w-28 h-20'}`}>
            <svg viewBox="0 0 120 88" className="w-full h-full overflow-visible" aria-hidden="true">
              <defs>
                <linearGradient id="titaniumRim" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="35%" stopColor="#94A3B8" />
                  <stop offset="68%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
                <radialGradient id="plasmaCore" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="38%" stopColor={isReady ? '#34D399' : '#38BDF8'} />
                  <stop offset="78%" stopColor={isReady ? '#059669' : '#0284C7'} />
                  <stop offset="100%" stopColor="#0F172A" />
                </radialGradient>
              </defs>

              {/* Rising Emerald Plasma Sparks */}
              {slots.length > 0 && (
                <g opacity={isReady ? 0.95 : 0.65}>
                  <path
                    d="M42 26 L38 17 L45 10"
                    fill="none"
                    stroke={isReady ? '#6EE7B7' : '#7DD3FC'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-steam-1"
                  />
                  <path
                    d="M60 22 L65 13 L58 5"
                    fill="none"
                    stroke="#A7F3D0"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-steam-2"
                  />
                  <path
                    d="M78 26 L83 17 L76 10"
                    fill="none"
                    stroke={isReady ? '#34D399' : '#38BDF8'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-steam-3"
                  />
                </g>
              )}

              {/* Thruster Vent Flame Underneath */}
              <g className="animate-flame-flicker">
                <path
                  d="M46 82 Q52 68 60 76 Q68 68 74 82 Q60 87 46 82 Z"
                  fill={isReady ? '#10B981' : '#0284C7'}
                />
                <path
                  d="M52 82 Q56 73 60 78 Q64 73 68 82 Q60 85 52 82 Z"
                  fill="#ECFEFF"
                />
              </g>

              {/* Side Titanium Stabilizer Pylons */}
              <rect x="10" y="34" width="12" height="14" rx="3" fill="url(#titaniumRim)" stroke="#10B981" strokeWidth="1.2" />
              <rect x="98" y="34" width="12" height="14" rx="3" fill="url(#titaniumRim)" stroke="#10B981" strokeWidth="1.2" />

              {/* Reactor Chamber Chassis */}
              <path
                d="M20 34 L100 34 L90 74 L30 74 Z"
                fill="#0F172A"
                stroke="url(#titaniumRim)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Glowing Chest Reactor Emblem on Chassis */}
              <polygon points="60,47 71,59 60,70 49,59" fill="url(#plasmaCore)" stroke="#A7F3D0" strokeWidth="1.4" />
              <circle cx="60" cy="59" r="4" fill="#FFFFFF" />

              {/* Upper Plasma Ring */}
              <ellipse cx="60" cy="34" rx="42" ry="10" fill="url(#titaniumRim)" stroke="#0F172A" strokeWidth="1.5" />
              <ellipse cx="60" cy="34" rx="35" ry="7" fill="url(#plasmaCore)" />

              {/* Energy Nodes */}
              <circle cx="44" cy="34" r={slots.length >= 1 ? 3.2 : 1.4} fill="#FFFFFF" opacity="0.9" />
              <circle cx="60" cy="32" r={slots.length >= 2 ? 3.6 : 1.4} fill="#A7F3D0" opacity="0.95" />
              <circle cx="76" cy="35" r={slots.length >= 3 ? 3.2 : 1.4} fill="#FFFFFF" opacity="0.9" />
            </svg>
          </div>

          {/* 3 Relic Charge Slots */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-3 gap-1.5">
              {[0, 1, 2].map((idx) => {
                const sweet = slots[idx];
                return (
                  <div
                    key={idx}
                    className={`flex aspect-square items-center justify-center rounded-xl border p-1 transition-all ${
                      sweet
                        ? 'border-emerald-400/80 bg-emerald-950/75'
                        : 'border-dashed border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    {sweet ? (
                      <div className="w-full h-full">
                        <SweetIcon sweet={sweet} colorBlindMode={colorBlindMode} />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {recipe ? (
              <div className="mt-2">
                <div className="text-[11px] font-black leading-tight text-emerald-200">
                  {recipe.name}
                </div>
                {!compact && (
                  <div className="mt-0.5 text-[10px] leading-snug text-slate-300">
                    {recipe.effectSummary}
                  </div>
                )}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onServeDish}
                  className={`mt-1.5 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r ${recipe.accentGradient} px-3 text-xs font-black text-white shadow-md transition-transform active:scale-[0.97] disabled:opacity-45 whitespace-nowrap`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Fire Overload</span>
                </button>
              </div>
            ) : (
              <p className="mt-1.5 text-[10px] leading-snug text-slate-400">
                Match {3 - slots.length} more relic{3 - slots.length === 1 ? '' : 's'} to charge Arc Forge.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stark Arc Forge Blueprints Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setShowGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Stark Arc Forge Schematics"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-emerald-500/50 bg-[#0B111D] text-slate-100 shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 px-5 py-4 text-white flex items-center justify-between border-b border-emerald-500/30">
              <div>
                <div className="text-xs font-semibold text-emerald-300">Avengers Tactical Manual</div>
                <h3 className="text-lg font-black">Stark Arc Forge Combos</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close forge specs"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2.5 max-h-[75dvh] overflow-y-auto">
              <p className="text-xs text-slate-300 leading-relaxed">
                Every match channels its dominant relic energy into your Stark Arc Forge. Combine 3 relic charges to unleash the exact Avengers strike you need:
              </p>
              {Object.values(KADHAI_RECIPES).map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-white">{r.name}</span>
                    <span className="text-[11px] font-bold text-emerald-400 whitespace-nowrap">{r.badgeText}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-cyan-300">{r.comboHint}</div>
                  <div className="mt-0.5 text-xs text-slate-300">{r.effectSummary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface ThaliGravityDialProps {
  gravityDir: GravityDir;
  charge: number; // 0..100
  disabled: boolean;
  isDarkTheme: boolean;
  unlimitedTilt?: boolean;
  onTilt: (delta: -1 | 1) => void;
}

const GRAVITY_META: Record<GravityDir, { label: string; icon: React.ReactNode }> = {
  down: { label: 'South ↓', icon: <ArrowDown className="w-3.5 h-3.5" /> },
  right: { label: 'East →', icon: <ArrowRight className="w-3.5 h-3.5" /> },
  up: { label: 'North ↑', icon: <ArrowUp className="w-3.5 h-3.5" /> },
  left: { label: 'West ←', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
};

/**
 * Interactive Helicarrier Gravity Shift Controls:
 * Rotate the entire holo-deck 90° left or right to slide all relics without spending a turn!
 */
export const ThaliGravityDial: React.FC<ThaliGravityDialProps> = ({
  gravityDir,
  charge,
  disabled,
  unlimitedTilt = false,
  onTilt,
}) => {
  const canTilt = !disabled && (unlimitedTilt || charge >= 100);
  const meta = GRAVITY_META[gravityDir];

  return (
    <div className="w-full max-w-[520px] rounded-2xl border border-slate-700/80 bg-slate-900/90 text-slate-100 px-3 py-2 flex flex-wrap items-center justify-between gap-2 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            canTilt
              ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.55)]'
              : 'bg-slate-800 text-emerald-400'
          }`}
        >
          {meta.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-extrabold">
            <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Gravity Shift</span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span className="text-emerald-300">{meta.label}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${unlimitedTilt ? 100 : Math.min(100, charge)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-300 tabular-nums whitespace-nowrap">
              {unlimitedTilt ? 'Ready (Free)' : canTilt ? 'Shift Ready!' : `${charge}%`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          disabled={!canTilt}
          onClick={() => onTilt(-1)}
          title="Shift Gravity Left (Q)"
          className={`flex min-h-[40px] items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-all whitespace-nowrap ${
            canTilt
              ? 'border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm active:scale-95'
              : 'border-slate-700 bg-slate-950/60 text-slate-500 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Shift Left</span>
        </button>
        <button
          type="button"
          disabled={!canTilt}
          onClick={() => onTilt(1)}
          title="Shift Gravity Right (E)"
          className={`flex min-h-[40px] items-center gap-1 rounded-xl border px-3 text-xs font-bold transition-all whitespace-nowrap ${
            canTilt
              ? 'border-emerald-400 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm active:scale-95'
              : 'border-slate-700 bg-slate-950/60 text-slate-500 cursor-not-allowed'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Shift Right</span>
        </button>
      </div>
    </div>
  );
};

interface RoyalGuestOrderCardProps {
  order: RoyalGuestOrder;
  ordersServed: number;
  bestOrders: number;
  slots: SweetType[];
  brewedRecipe: KadhaiRecipeId | null;
  colorBlindMode: boolean;
  isDarkTheme: boolean;
}

/** Live Tactical Dispatch Ticket for Doomsday Reactor Rush mode */
export const RoyalGuestOrderCard: React.FC<RoyalGuestOrderCardProps> = ({
  order,
  ordersServed,
  bestOrders,
  slots,
  brewedRecipe,
  colorBlindMode,
}) => {
  const readyMatchesOrder = brewedRecipe ? doesFusionSatisfyOrder(slots, brewedRecipe, order) : false;

  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm transition-colors ${
        readyMatchesOrder
          ? 'border-emerald-400 bg-emerald-950/90 text-emerald-50 shadow-[0_0_16px_rgba(16,185,129,0.3)]'
          : 'border-slate-700/80 bg-slate-900/90 text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
        <span className="flex items-center gap-1 text-emerald-400">
          <Shield className="w-3.5 h-3.5" />
          Directive #{order.orderNumber}
        </span>
        <span className="tabular-nums text-slate-400">
          Cleared: {ordersServed} · Best: {Math.max(bestOrders, ordersServed)}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="text-sm font-black text-white">{order.guestName}</div>
        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 tabular-nums">
          <Coins className="w-3.5 h-3.5" /> +{order.rewardCoins} · +{order.rewardMoves}t
        </span>
      </div>
      <p className="mt-0.5 text-xs text-slate-300 leading-snug">“{order.quote}”</p>

      <div className="mt-2 pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2 text-xs font-extrabold">
        {order.targetType === 'recipe' && order.requiredRecipe ? (
          <span className="text-cyan-300">Strike: {KADHAI_RECIPES[order.requiredRecipe].name}</span>
        ) : order.requiredSweet ? (
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span>Include:</span>
            <span className="inline-block w-5 h-5">
              <SweetIcon sweet={order.requiredSweet} colorBlindMode={colorBlindMode} />
            </span>
            <span>{SWEET_META[order.requiredSweet].name}</span>
          </span>
        ) : null}
        {readyMatchesOrder && <span className="text-emerald-300 whitespace-nowrap">Ready to Fire!</span>}
      </div>
    </div>
  );
};
