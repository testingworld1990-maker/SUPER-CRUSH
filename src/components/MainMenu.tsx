import React, { useEffect, useMemo, useState } from 'react';
import { getAdventureLogSummary } from '../game/stories';
import {
  DOOMSDAY_LOGO_URL,
  getHeroById,
  getSquadState,
  getWinStreakInfo,
  SUPERHERO_MOVIE_ACTS,
} from '../game/superheroes';
import { ALL_SWEETS, BoosterType, SaveState } from '../game/types';
import { SWEET_META, THEMES } from '../game/themes';
import { getT } from '../i18n/translations';
import { AdService } from '../services/adService';
import { soundService } from '../services/soundService';
import { getTodayKey, hasUnlimitedLives, isAdFree } from '../services/storageService';
import { AdBannerSlot } from './AdOverlay';
import { ChotuMascot } from './ChotuMascot';
import { PWAInstallButton } from './PWAInstallButton';
import { SweetIcon } from './SweetIcon';
import {
  Award,
  ChevronRight,
  Coins,
  Compass,
  Cpu,
  Flame,
  Gift,
  Heart,
  Infinity as InfinityIcon,
  Map as MapIcon,
  PencilRuler,
  Play,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react';

interface MainMenuProps {
  save: SaveState;
  isOnline: boolean;
  onQuickPlay: () => void;
  onOpenMap: () => void;
  onStartRelax: () => void;
  onOpenDailyChallenge: () => void;
  onOpenDailyReward: () => void;
  onOpenShop: () => void;
  onOpenCollection: () => void;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
  onOpenAdventureLog: () => void;
  onStartKadhaiRush: () => void;
  onStartBlitz: () => void;
  onSelectHero: (heroId: string) => void;
  onClaimBounty: (bountyId: string) => void;
}

const BOOSTER_LABELS: Record<BoosterType, string> = {
  hammer: '+1 Mjolnir',
  shuffle: '+1 Shuffle',
  extra_moves: '+1 +5 Turns',
  color_bomb: '+1 Infinity Orb',
};

export const MainMenu: React.FC<MainMenuProps> = ({
  save,
  isOnline,
  onQuickPlay,
  onOpenMap,
  onStartRelax,
  onOpenDailyChallenge,
  onOpenDailyReward,
  onOpenShop,
  onOpenCollection,
  onOpenEditor,
  onOpenSettings,
  onOpenAdventureLog,
  onStartKadhaiRush,
  onStartBlitz,
  onSelectHero,
  onClaimBounty,
}) => {
  const t = getT(save.settings.language);
  const theme = THEMES[save.settings.theme] ?? THEMES.classic;
  const totalStars = Object.values(save.levels).reduce((acc, p) => acc + p.stars, 0);
  const adventureSummary = useMemo(
    () => getAdventureLogSummary(save.unlockedLevel, save.levels),
    [save.unlockedLevel, save.levels]
  );
  const squad = useMemo(
    () => getSquadState(save.unlockedLevel),
    [save.unlockedLevel]
  );
  const activeHero = useMemo(
    () => getHeroById(save.activeHeroId, save.unlockedLevel),
    [save.activeHeroId, save.unlockedLevel]
  );
  const streakInfo = useMemo(
    () => getWinStreakInfo(save.winStreak ?? 0),
    [save.winStreak]
  );
  const [posterFailed, setPosterFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const today = getTodayKey();
  const hasUnclaimedDaily =
    save.dailySpin.lastSpinDate !== today || save.dailyLogin.lastClaimDate !== today;

  useEffect(() => {
    AdService.showBanner('menu_bottom');
    return () => AdService.showBanner(null);
  }, []);

  return (
    <div
      className={`relative min-h-[100dvh] w-full overflow-x-clip bg-gradient-to-b ${squad.activeAct.atmosphere.arenaGradient} text-slate-100 flex flex-col`}
    >
      {/* Cosmic Act Ambient Lighting */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl opacity-80"
          style={{ background: `radial-gradient(circle, ${squad.activeAct.atmosphere.glowA}, transparent 70%)` }}
        />
        <div
          className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl opacity-75"
          style={{ background: `radial-gradient(circle, ${squad.activeAct.atmosphere.glowB}, transparent 70%)` }}
        />
      </div>

      {/* Clean 3-Zone Avengers Command Header with Doomsday Logo Crest */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-xl border border-emerald-400/60 bg-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.35)]">
            {!logoFailed ? (
              <img
                src={DOOMSDAY_LOGO_URL}
                alt="Super Crush Doomsday Logo"
                referrerPolicy="no-referrer"
                onError={() => setLogoFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg sm:text-xl font-black tracking-tight text-white leading-none whitespace-nowrap">
              {t.appTitle}
            </div>
            <div className="text-[10px] font-black tracking-[0.26em] text-emerald-400 uppercase leading-tight">
              DOOMSDAY
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            {hasUnlimitedLives(save) ? '∞' : `${save.lives}/${save.maxLives}`}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="flex items-center gap-1 text-amber-300">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            {totalStars}
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <button
            onClick={onOpenShop}
            className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            {save.coins}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton label={t.installApp} compact />
          <button
            onClick={onOpenSettings}
            aria-label={t.settings}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-slate-900/90 text-slate-100 border border-emerald-500/35 shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content — Responsive Portrait Stack to Desktop 2-Column Showcase */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hero Showcase Column — Cinematic Avengers Movie Path + Doomsday Logo */}
          <section className="lg:col-span-6 overflow-hidden rounded-3xl bg-[#0B121E]/95 border border-emerald-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.65)]">
            <div className="relative h-52 sm:h-60 w-full overflow-hidden bg-gradient-to-br from-[#060B14] via-[#0B1F1B] to-[#111827]">
              {!posterFailed && (
                <img
                  src={squad.activeAct.posterUrl}
                  alt={`${squad.activeAct.actLabel}: ${squad.activeAct.movieTitle}`}
                  referrerPolicy="no-referrer"
                  onError={() => setPosterFailed(true)}
                  className="h-full w-full object-cover object-center"
                />
              )}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#070C14] via-[#070C14]/60 to-black/25"
              />

              {/* Top-left Doomsday Crest Watermark Badge */}
              <div className="absolute top-3 left-4 flex items-center gap-2">
                <div className="h-8 w-12 overflow-hidden rounded-lg border border-emerald-400/70 bg-black/70 shadow-[0_0_16px_rgba(16,185,129,0.5)]">
                  {!logoFailed && (
                    <img
                      src={DOOMSDAY_LOGO_URL}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="text-[11px] font-black tracking-[0.22em] text-emerald-300 uppercase drop-shadow">
                  Super Crush: Doomsday
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-emerald-300 tracking-wide">
                    {squad.activeAct.actLabel} · {squad.assembledCount}/{squad.totalHeroes} Avengers Assembled
                  </p>
                  <h1 className="mt-0.5 text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow">
                    {squad.activeAct.movieTitle}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-200/90 leading-snug line-clamp-2 max-w-md">
                    {squad.nextRecruit
                      ? `Reach Mission ${squad.nextRecruit.unlockLevel} to recruit ${squad.nextRecruit.codename} into the Avengers.`
                      : 'All 5 Avengers assembled — defeat Doctor Doomsday in the Nexus!'}
                  </p>
                </div>
                <div className="hidden sm:block shrink-0">
                  <ChotuMascot mood="cheer" outfit={save.equippedOutfit} size="sm" />
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {/* Interactive Active Avenger Squad Picker + Ultimate Power Preview */}
              <div className="pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    {SUPERHERO_MOVIE_ACTS.map((hero) => {
                      const recruited = save.unlockedLevel >= hero.unlockLevel;
                      const isActive = activeHero.id === hero.id;
                      return (
                        <button
                          key={hero.id}
                          type="button"
                          onClick={() => {
                            if (recruited) {
                              soundService.playTap();
                              onSelectHero(hero.id);
                            } else {
                              onOpenMap();
                            }
                          }}
                          title={
                            recruited
                              ? `Equip ${hero.codename} — Ultimate: ${hero.ultimate.name}`
                              : `Unlocks at Mission ${hero.unlockLevel}`
                          }
                          aria-pressed={isActive}
                          className={`relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                            isActive
                              ? 'border-amber-300 ring-2 ring-cyan-400/80 scale-105 shadow-[0_0_16px_rgba(34,211,238,0.65)]'
                              : recruited
                              ? 'border-emerald-400/70 hover:scale-105 opacity-90 hover:opacity-100'
                              : 'border-slate-700 opacity-40 grayscale'
                          }`}
                        >
                          <img
                            src={hero.posterUrl}
                            alt={hero.codename}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover object-top"
                          />
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="absolute bottom-0 inset-x-0 bg-amber-300 text-[8px] font-black text-slate-950 text-center leading-tight uppercase"
                            >
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={onOpenMap}
                    className="text-xs font-extrabold text-emerald-400 hover:text-emerald-300 whitespace-nowrap shrink-0"
                  >
                    Movie Path →
                  </button>
                </div>

                {/* Active Avenger Playable Ultimate Strip */}
                <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-slate-900/95 border border-white/10 px-3 py-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activeHero.ultimate.gradientClass} text-slate-950 shadow-sm`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-white truncate">
                      <span style={{ color: activeHero.ultimate.colorHex }}>{activeHero.codename}</span>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="truncate">{activeHero.ultimate.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      {activeHero.ultimate.shortDesc}
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Glossy Avengers Relics Showcase */}
              <div className="mt-4 grid grid-cols-6 gap-2 rounded-2xl bg-slate-900/90 p-3 border border-slate-800">
                {ALL_SWEETS.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12">
                      <SweetIcon sweet={s} colorBlindMode={save.settings.colorBlindMode} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 truncate max-w-full">
                      {SWEET_META[s].shortShape}
                    </span>
                  </div>
                ))}
              </div>

              {/* Win Streak Momentum Bar */}
              <div className="mt-4 rounded-2xl bg-slate-900/90 border border-amber-400/35 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Flame
                      className={`w-4 h-4 shrink-0 ${
                        (save.winStreak ?? 0) > 0
                          ? 'fill-amber-400 text-amber-400 animate-streak-shimmer'
                          : 'text-slate-500'
                      }`}
                    />
                    <span className="text-xs font-black text-white truncate">
                      Win Streak: {save.winStreak ?? 0}× · {streakInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[1, 2, 3].map((step) => {
                      const active = (save.winStreak ?? 0) >= step;
                      return (
                        <span
                          key={step}
                          className={`h-2 w-6 rounded-full transition-colors ${
                            active ? `bg-gradient-to-r ${streakInfo.gradientClass}` : 'bg-slate-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-amber-200/90">
                  {streakInfo.perkShort}
                </p>
              </div>

              {/* Primary Focal CTA */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onQuickPlay}
                  className="flex-1 min-h-[54px] flex items-center justify-center gap-2.5 rounded-2xl text-slate-950 font-black text-base shadow-[0_0_26px_rgba(34,211,238,0.45)] transition-transform active:scale-[0.98] bg-gradient-to-r from-amber-300 via-emerald-400 to-cyan-400 hover:brightness-110"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    {t.continueLevel} {save.unlockedLevel}
                  </span>
                </button>

                <button
                  onClick={onStartRelax}
                  className="min-h-[54px] flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-5 text-sm font-extrabold text-slate-100 hover:border-cyan-400/60 hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <InfinityIcon className="w-4 h-4 text-cyan-400" />
                  <span>
                    {t.relaxMode} ({save.settings.relaxGridSize}×{save.settings.relaxGridSize})
                  </span>
                </button>
              </div>

              {/* 60-Second Infinity Blitz Instant Arcade Mode */}
              <button
                onClick={onStartBlitz}
                className="mt-4 w-full min-h-[68px] flex items-center justify-between gap-3 rounded-2xl border border-fuchsia-400/65 bg-gradient-to-r from-[#240B36] via-[#1B1648] to-[#0B2A3E] px-4 py-3 text-left text-white shadow-[0_8px_24px_rgba(192,38,211,0.22)] hover:brightness-115 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 text-slate-950 shadow-md">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-fuchsia-300 tabular-nums">
                      <Zap className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                      <span>
                        60s Arcade · No Hearts · Best {(save.stats.blitzHighScore ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-white truncate">
                      Play 60s Infinity Blitz
                    </div>
                    <div className="text-[11px] text-slate-200/90 truncate">
                      All 5 Avengers Free Trial · Infinity Snap · Hyper Cascades!
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-cyan-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Signature 3D Mode Spotlight: Doomsday Reactor Rush */}
              <button
                onClick={onStartKadhaiRush}
                className="mt-3 w-full min-h-[64px] flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/60 bg-gradient-to-r from-[#061A16] via-[#0A2E25] to-[#0B1E2E] px-4 py-3 text-left text-emerald-50 shadow-md hover:brightness-115 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 border border-emerald-400/50 text-emerald-300">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 tabular-nums">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>Helicarrier 3D · 4-Way Gravity · Best {save.stats.kadhaiOrdersBest ?? 0} Directives</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-white truncate">
                      Play Doomsday Reactor Rush
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      Shift 3D holo-deck gravity & fire Stark Arc Forge overloads
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* Avengers Mission Dossier Teaser Bar */}
              <button
                onClick={onOpenAdventureLog}
                className="mt-3 w-full min-h-[56px] flex items-center justify-between gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-left hover:border-emerald-400/60 hover:bg-slate-800/90 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-emerald-400 tabular-nums">
                      Avengers Mission Dossier · {adventureSummary.unlockedCount}/{adventureSummary.totalCount} Logs
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {adventureSummary.latestEntry.cityLabel}: “{adventureSummary.latestEntry.headline}”
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </section>

          {/* Navigation, Modes & Live Quick Bounties Column */}
          <section className="lg:col-span-6 flex flex-col gap-3 sm:gap-4">
            {/* Interactive Quick Bounties Retention Card */}
            <div className="rounded-2xl bg-slate-950/85 backdrop-blur-md border border-cyan-400/35 p-4 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                    Quick Avenger Bounties
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-cyan-300">
                  Play & Claim Instant Loot
                </span>
              </div>

              <div className="space-y-2.5">
                {(save.bounties ?? []).map((b) => {
                  const pct = Math.min(100, Math.round((b.progress / Math.max(1, b.target)) * 100));
                  const ready = b.progress >= b.target;
                  const rewardText = b.rewardCoins
                    ? `+${b.rewardCoins} Credits`
                    : b.rewardBooster
                    ? BOOSTER_LABELS[b.rewardBooster]
                    : '+100 Credits';
                  return (
                    <div
                      key={b.id}
                      className={`rounded-xl p-2.5 border transition-colors ${
                        ready
                          ? 'bg-emerald-950/60 border-emerald-400/70'
                          : 'bg-slate-900/90 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-white">
                            <span className="truncate">{b.title}</span>
                            <span className="tabular-nums text-[11px] text-cyan-300 shrink-0">
                              {Math.min(b.target, b.progress)}/{b.target}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                ready
                                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-300'
                                  : 'bg-gradient-to-r from-amber-400 via-fuchsia-400 to-cyan-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {ready ? (
                          <button
                            type="button"
                            onClick={() => onClaimBounty(b.id)}
                            className="min-h-[36px] shrink-0 flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 px-3 text-xs font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition-transform whitespace-nowrap"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Claim</span>
                          </button>
                        ) : (
                          <span className="shrink-0 text-[11px] font-bold text-amber-300 whitespace-nowrap">
                            {rewardText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={onOpenMap}
                className="flex flex-col items-start justify-between rounded-2xl bg-slate-950/85 border border-cyan-500/30 p-4 sm:p-5 text-left shadow-sm hover:border-cyan-400/80 hover:bg-slate-900 transition-all min-h-[108px]"
              >
                <MapIcon className="w-6 h-6 text-cyan-400" />
                <div className="mt-3">
                  <div className="text-sm sm:text-base font-extrabold text-white">{t.playCampaign}</div>
                  <div className="text-xs text-slate-300">5 Movie Acts & Multiverse Ops</div>
                </div>
              </button>

              <button
                onClick={onOpenDailyChallenge}
                className="flex flex-col items-start justify-between rounded-2xl bg-slate-950/85 border border-amber-500/30 p-4 sm:p-5 text-left shadow-sm hover:border-amber-400/80 hover:bg-slate-900 transition-all min-h-[108px]"
              >
                <Trophy className="w-6 h-6 text-amber-400" />
                <div className="mt-3">
                  <div className="text-sm sm:text-base font-extrabold text-white">{t.dailyChallenge}</div>
                  <div className="text-xs text-slate-300">Seeded Grid & Agent Rankings</div>
                </div>
              </button>

              <button
                onClick={onOpenDailyReward}
                className="relative flex flex-col items-start justify-between rounded-2xl bg-slate-950/85 border border-rose-500/30 p-4 sm:p-5 text-left shadow-sm hover:border-rose-400/80 hover:bg-slate-900 transition-all min-h-[108px]"
              >
                <Gift className="w-6 h-6 text-rose-400" />
                <div className="mt-3">
                  <div className="text-sm sm:text-base font-extrabold text-white">{t.dailyRewards}</div>
                  <div className="text-xs text-slate-300">
                    {hasUnclaimedDaily ? 'Free Supply Spin & Drop ready!' : 'Supply Wheel & 7-Day Streak'}
                  </div>
                </div>
              </button>

              <button
                onClick={onOpenShop}
                className="flex flex-col items-start justify-between rounded-2xl bg-slate-950/85 border border-fuchsia-500/30 p-4 sm:p-5 text-left shadow-sm hover:border-fuchsia-400/80 hover:bg-slate-900 transition-all min-h-[108px]"
              >
                <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
                <div className="mt-3">
                  <div className="text-sm sm:text-base font-extrabold text-white">{t.shopAndPass}</div>
                  <div className="text-xs text-slate-300">Themes, Armor Suits & Doomsday Pass</div>
                </div>
              </button>

              <button
                onClick={onOpenCollection}
                className="flex flex-col items-start justify-between rounded-2xl bg-slate-950/85 border border-emerald-500/30 p-4 sm:p-5 text-left shadow-sm hover:border-emerald-400/80 hover:bg-slate-900 transition-all min-h-[108px]"
              >
                <Award className="w-6 h-6 text-emerald-400" />
                <div className="mt-3">
                  <div className="text-sm sm:text-base font-extrabold text-white">{t.stickerAlbum}</div>
                  <div className="text-xs text-slate-300">
                    {save.stickersUnlocked.length} Relics · Commendations
                  </div>
                </div>
              </button>

              <button
                onClick={onOpenEditor}
                className="flex flex-col items-start justify-between rounded-2xl bg-slate-950/85 border border-sky-500/30 p-4 sm:p-5 text-left shadow-sm hover:border-sky-400/80 hover:bg-slate-900 transition-all min-h-[108px]"
              >
                <PencilRuler className="w-6 h-6 text-sky-400" />
                <div className="mt-3">
                  <div className="text-sm sm:text-base font-extrabold text-white">{t.levelEditor}</div>
                  <div className="text-xs text-slate-300">Build, Playtest & JSON Export</div>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Allowed Main Menu Bottom Banner Ad */}
        <AdBannerSlot
          allowedPosition="menu_bottom"
          isAdFree={isAdFree(save)}
          isOnline={isOnline}
          onRemoveAdsClick={onOpenShop}
        />
      </main>
    </div>
  );
};
