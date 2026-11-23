import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CHAPTER_STORIES, CityRegionId, getAdventureLogSummary, getLevelStory } from '../game/stories';
import {
  BOSS_VILLAIN_PORTRAIT,
  DOOMSDAY_LOGO_URL,
  getMovieActForRegion,
  getSquadState,
  SUPERHERO_MOVIE_ACTS,
} from '../game/superheroes';
import { FESTIVAL_EVENTS, REGIONS, SWEET_META } from '../game/themes';
import { LevelConfig, RegionId, SaveState } from '../game/types';
import { getT } from '../i18n/translations';
import { AdService } from '../services/adService';
import { soundService } from '../services/soundService';
import { getNextLifeCountdownSec, hasUnlimitedLives, isAdFree } from '../services/storageService';
import { AdBannerSlot } from './AdOverlay';
import { AdventureLogModal } from './AdventureLogModal';
import { ChotuMascot } from './ChotuMascot';
import type { ParadeRegionStop } from './FestivalParade3D';
import { CherryIcon, SweetIcon } from './SweetIcon';

const FestivalParade3D = lazy(() =>
  import('./FestivalParade3D').then((m) => ({ default: m.FestivalParade3D }))
);
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Coins,
  Compass,
  Crown,
  Feather,
  Flame,
  Heart,
  Lock,
  Play,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Video,
  X,
} from 'lucide-react';

interface LevelMapProps {
  levels: LevelConfig[];
  festivalLevels: LevelConfig[];
  save: SaveState;
  isOnline: boolean;
  justCompletedLevelId?: number | null;
  onClearJustCompleted?: () => void;
  onBackToMenu: () => void;
  onStartLevel: (level: LevelConfig) => void;
  onOpenShop: () => void;
  onRefillLivesAd: () => void;
  onBonusCoins: (amount: number) => void;
}

const REGION_VISUALS: Record<
  RegionId,
  {
    headerGrad: string;
    cardBorder: string;
    barGrad: string;
    shortName: string;
    roadStroke: string;
    tileBg: string;
  }
> = {
  chennai_marina: {
    headerGrad: 'from-sky-600 via-cyan-600 to-emerald-500',
    cardBorder: 'border-sky-500/35',
    barGrad: 'from-sky-400 via-cyan-400 to-emerald-400',
    shortName: 'Sector I',
    roadStroke: '#38BDF8',
    tileBg: 'from-slate-900 to-slate-950',
  },
  madurai_temple: {
    headerGrad: 'from-rose-600 via-red-600 to-amber-500',
    cardBorder: 'border-rose-500/35',
    barGrad: 'from-rose-500 via-red-400 to-amber-400',
    shortName: 'Sector II',
    roadStroke: '#FB7185',
    tileBg: 'from-slate-900 to-slate-950',
  },
  kanyakumari: {
    headerGrad: 'from-emerald-600 via-teal-500 to-cyan-500',
    cardBorder: 'border-emerald-500/35',
    barGrad: 'from-emerald-400 via-teal-400 to-cyan-400',
    shortName: 'Sector III',
    roadStroke: '#34D399',
    tileBg: 'from-slate-900 to-slate-950',
  },
  jaipur: {
    headerGrad: 'from-violet-600 via-fuchsia-600 to-amber-500',
    cardBorder: 'border-violet-500/35',
    barGrad: 'from-violet-400 via-fuchsia-400 to-amber-400',
    shortName: 'Sector IV',
    roadStroke: '#C084FC',
    tileBg: 'from-slate-900 to-slate-950',
  },
  delhi: {
    headerGrad: 'from-emerald-600 via-emerald-500 to-amber-500',
    cardBorder: 'border-emerald-400/45',
    barGrad: 'from-emerald-400 via-amber-400 to-yellow-300',
    shortName: 'Sector V',
    roadStroke: '#10B981',
    tileBg: 'from-slate-900 to-slate-950',
  },
  festival: {
    headerGrad: 'from-emerald-600 via-cyan-600 to-violet-600',
    cardBorder: 'border-emerald-500/35',
    barGrad: 'from-emerald-400 via-cyan-400 to-violet-400',
    shortName: 'Multiverse',
    roadStroke: '#10B981',
    tileBg: 'from-slate-900 to-slate-950',
  },
};

/**
 * Serpentine S-curve board-game coordinates (percentage X, Y inside a 4-col × 3-row board):
 * Row 0 (Left -> Right): idx 0, 1, 2, 3
 * Row 1 (Right -> Left): idx 4, 5, 6, 7  (so 3 curves down to 4, then walks left to 7!)
 * Row 2 (Left -> Right): idx 8, 9, 10, 11 (so 7 curves down to 8, then marches right to Boss 11!)
 */
const SERPENTINE_COORDS: Array<{ col: number; row: number; xPct: number; yPct: number }> = [
  { col: 0, row: 0, xPct: 12.5, yPct: 16.6 },
  { col: 1, row: 0, xPct: 37.5, yPct: 16.6 },
  { col: 2, row: 0, xPct: 62.5, yPct: 16.6 },
  { col: 3, row: 0, xPct: 87.5, yPct: 16.6 },
  { col: 3, row: 1, xPct: 87.5, yPct: 50.0 },
  { col: 2, row: 1, xPct: 62.5, yPct: 50.0 },
  { col: 1, row: 1, xPct: 37.5, yPct: 50.0 },
  { col: 0, row: 1, xPct: 12.5, yPct: 50.0 },
  { col: 0, row: 2, xPct: 12.5, yPct: 83.4 },
  { col: 1, row: 2, xPct: 37.5, yPct: 83.4 },
  { col: 2, row: 2, xPct: 62.5, yPct: 83.4 },
  { col: 3, row: 2, xPct: 87.5, yPct: 83.4 },
];

/**
 * Generates a smooth cubic-bezier winding SVG path segment between consecutive serpentine tiles
 * in a 400×300 coordinate space, creating gentle storybook curves along rows and wide hairpin sweeps at turns.
 */
function buildSerpentineSegment(fromIdx: number, toIdx: number): string {
  const a = SERPENTINE_COORDS[fromIdx];
  const b = SERPENTINE_COORDS[toIdx];
  const ax = a.xPct * 4;
  const ay = a.yPct * 3;
  const bx = b.xPct * 4;
  const by = b.yPct * 3;

  // Hairpin turn on the right edge (index 3 -> 4)
  if (fromIdx === 3 && toIdx === 4) {
    return `C ${ax + 44} ${ay}, ${bx + 44} ${by}, ${bx} ${by}`;
  }
  // Hairpin turn on the left edge (index 7 -> 8)
  if (fromIdx === 7 && toIdx === 8) {
    return `C ${ax - 44} ${ay}, ${bx - 44} ${by}, ${bx} ${by}`;
  }

  // Gentle organic road meander along horizontal rows
  const midX1 = ax + (bx - ax) * 0.35;
  const midX2 = ax + (bx - ax) * 0.65;
  const wave = (fromIdx % 2 === 0 ? -1 : 1) * 11;
  return `C ${midX1} ${ay + wave}, ${midX2} ${by - wave}, ${bx} ${by}`;
}

function buildSerpentinePath(upToCount: number): string {
  const clamped = Math.max(1, Math.min(SERPENTINE_COORDS.length, upToCount));
  const start = SERPENTINE_COORDS[0];
  let d = `M ${start.xPct * 4} ${start.yPct * 3}`;
  for (let i = 0; i < clamped - 1; i++) {
    d += ` ${buildSerpentineSegment(i, i + 1)}`;
  }
  return d;
}

function buildSingleSerpentineSegmentPath(fromIdx: number, toIdx: number): string {
  const a = SERPENTINE_COORDS[fromIdx];
  return `M ${a.xPct * 4} ${a.yPct * 3} ${buildSerpentineSegment(fromIdx, toIdx)}`;
}

/** Coordinates & story route names for the Avengers Doomsday Sector Conduit */
const CITY_HIGHWAY_NODES: Array<{
  x: number;
  y: number;
  routeTitle: string;
  routeStory: string;
}> = [
  { x: 96, y: 102, routeTitle: 'Coastal Bifrost', routeStory: 'From Coastal Citadel defenses to the Sanctum Spires' },
  { x: 298, y: 46, routeTitle: 'Sanctum Conduit', routeStory: 'Diving from arcane sky-spires into the Trident Abyss' },
  { x: 500, y: 108, routeTitle: 'Abyssal Rift', routeStory: 'Surging through deep-sea portals to the Astral Fortress' },
  { x: 702, y: 46, routeTitle: 'Astral Hyperlane', routeStory: 'Warping across quantum space toward the Doomsday Nexus' },
  { x: 904, y: 100, routeTitle: 'Doomsday Endgame', routeStory: 'Final Avengers Assemble battleground' },
];

const CITY_HIGHWAY_SEGMENTS: string[] = [
  'M 96 102 C 166 102, 228 46, 298 46',
  'M 298 46 C 368 46, 430 108, 500 108',
  'M 500 108 C 570 108, 632 46, 702 46',
  'M 702 46 C 772 46, 834 100, 904 100',
];

const FULL_CITY_HIGHWAY_D =
  'M 96 102 C 166 102, 228 46, 298 46 C 368 46, 430 108, 500 108 C 570 108, 632 46, 702 46 C 772 46, 834 100, 904 100';

/** Story-driven winding inter-city SVG highway bridge rendered between consecutive city chapter cards */
const InterCityRoadConnector: React.FC<{
  fromRegionName: string;
  toRegionName: string;
  routeTitle: string;
  routeStory: string;
  fromStroke: string;
  toStroke: string;
  progressRatio: number; // 0 to 1 based on how many levels of fromRegion are unlocked/completed
  isNextUnlocked: boolean;
  unlockRequirementLevel: number;
  gradientId: string;
  reverseCurve?: boolean;
}> = ({
  fromRegionName,
  toRegionName,
  routeTitle,
  routeStory,
  fromStroke,
  toStroke,
  progressRatio,
  isNextUnlocked,
  unlockRequirementLevel,
  gradientId,
  reverseCurve = false,
}) => {
  const clampedPct = Math.max(0, Math.min(100, Math.round(progressRatio * 100)));
  // Graceful S-curve winding from bottom of one chapter card to top of the next
  const curveD = reverseCurve
    ? 'M 140 2 C 140 44, 460 52, 460 94'
    : 'M 460 2 C 460 44, 140 52, 140 94';

  return (
    <div className="relative mx-auto w-full max-w-4xl select-none" aria-label={`Route from ${fromRegionName} to ${toRegionName}`}>
      <div className="relative h-24 sm:h-28 w-full">
        <svg
          viewBox="0 0 600 96"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={fromStroke} />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor={toStroke} />
            </linearGradient>
            <clipPath id={`${gradientId}-clip`}>
              <rect x="0" y="0" width="600" height={(96 * clampedPct) / 100} />
            </clipPath>
          </defs>

          {/* Dark obsidian energy highway conduit */}
          <path
            d={curveD}
            fill="none"
            stroke="#1E293B"
            strokeWidth="22"
            strokeLinecap="round"
            opacity="0.92"
          />
          <path
            d={curveD}
            fill="none"
            stroke="#0F172A"
            strokeWidth="13"
            strokeLinecap="round"
          />

          {/* Dormant dotted crossover trajectory */}
          <path
            d={curveD}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 10"
            opacity="0.35"
          />

          {/* Progressive superhero energy beam fill as player unlocks levels */}
          {clampedPct > 0 && (
            <motion.path
              d={curveD}
              pathLength={100}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="8.5"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - clampedPct }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              strokeDasharray="100"
              opacity={isNextUnlocked ? 0.98 : 0.78}
            />
          )}

          {/* Animated SVG dashed-line energy pulses surging toward the next Act */}
          {clampedPct > 0 && (
            <path
              d={curveD}
              fill="none"
              stroke="#FEF08A"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeDasharray="7 11"
              className="animate-road-dash-slow"
              clipPath={isNextUnlocked ? undefined : `url(#${gradientId}-clip)`}
              opacity={isNextUnlocked ? 1 : 0.85}
            />
          )}

          {/* Endpoint portal waypoint nodes */}
          <circle cx={reverseCurve ? 140 : 460} cy="4" r="6" fill={clampedPct > 0 ? '#F59E0B' : '#475569'} />
          <circle cx={reverseCurve ? 460 : 140} cy="92" r="6" fill={isNextUnlocked ? '#34D399' : '#475569'} />
        </svg>

        {/* Cinematic Post-Credits Crossover Signpost */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3">
          <div
            className={`pointer-events-auto rounded-2xl border px-4 py-2 text-center shadow-lg transition-colors max-w-md ${
              isNextUnlocked
                ? 'border-amber-400/60 bg-[#141A30]/95 text-amber-50'
                : 'border-slate-700/80 bg-[#101526]/95 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-amber-300 tabular-nums">
              <span>{routeTitle}</span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className={isNextUnlocked ? 'text-emerald-300' : 'text-amber-200/80'}>
                {isNextUnlocked
                  ? 'Hero Recruited'
                  : clampedPct > 0
                  ? `${clampedPct}% to ${toRegionName}`
                  : `Clear Lv.${unlockRequirementLevel}`}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-300 hidden sm:block">
              {routeStory}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};



/** Circular Star Mastery Progress Ring for each Region */
const StarMasteryRing: React.FC<{ earned: number; max: number }> = ({ earned, max }) => {
  const pct = max > 0 ? Math.min(1, earned / max) : 0;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);
  const isComplete = earned >= max && max > 0;

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <circle cx="30" cy="30" r={r} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke={isComplete ? '#FEF08A' : '#FFFFFF'}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        {isComplete ? (
          <Trophy className="w-5 h-5 text-amber-200 drop-shadow" />
        ) : (
          <span className="text-xs font-black tabular-nums leading-none">{Math.round(pct * 100)}%</span>
        )}
      </div>
    </div>
  );
};

/** Evolving Superhero Squad Board-Game Pawn Token that physically hops along the cinematic energy road */
const ChotuBoardPawn: React.FC<{
  outfit: SaveState['equippedOutfit'];
  isHopping: boolean;
  squadCount: number;
}> = ({ outfit, isHopping, squadCount }) => (
  <motion.div
    animate={
      isHopping
        ? { y: [0, -18, 0], scale: [1, 1.15, 0.96, 1], rotate: [-6, 6, 0] }
        : { y: [0, -4, 0], scale: 1, rotate: 0 }
    }
    transition={
      isHopping
        ? { duration: 0.24, ease: 'easeOut' }
        : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
    }
    className="pointer-events-none flex flex-col items-center"
  >
    <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 via-orange-500 to-rose-700 p-[2.5px] shadow-[0_0_22px_rgba(251,191,36,0.65)]">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#10162A]">
        <div className="scale-[0.72] sm:scale-[0.82]">
          <ChotuMascot mood={isHopping ? 'cheer' : 'idle'} outfit={outfit} size="sm" />
        </div>
      </div>
      <span className="absolute -bottom-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950 shadow tabular-nums whitespace-nowrap">
        {squadCount}/5
      </span>
    </div>
    {/* Hero landing energy shadow */}
    <div className="mt-2 h-1.5 w-9 rounded-full bg-amber-400/40 blur-[2px]" />
  </motion.div>
);

export const LevelMap: React.FC<LevelMapProps> = ({
  levels,
  festivalLevels,
  save,
  isOnline,
  justCompletedLevelId = null,
  onClearJustCompleted,
  onBackToMenu,
  onStartLevel,
  onOpenShop,
  onRefillLivesAd,
  onBonusCoins,
}) => {
  const t = getT(save.settings.language);
  const [activeTab, setActiveTab] = useState<'journey' | 'festivals' | 'custom'>('journey');
  const [countdown, setCountdown] = useState(() => getNextLifeCountdownSec(save));

  // Board-game moving pawn state: starts on the just-completed level (to animate forward) or current unlocked level
  const [pawnLevelId, setPawnLevelId] = useState<number>(() =>
    justCompletedLevelId && justCompletedLevelId <= 60 ? justCompletedLevelId : save.unlockedLevel
  );
  const [isHopping, setIsHopping] = useState(false);

  // Story & Adventure Log modals
  const [storyBriefingLevel, setStoryBriefingLevel] = useState<LevelConfig | null>(null);
  const [solvedReliefLevel, setSolvedReliefLevel] = useState<LevelConfig | null>(null);
  const [journalRegionId, setJournalRegionId] = useState<Exclude<RegionId, 'festival'> | null>(null);
  const [adventureLogCity, setAdventureLogCity] = useState<CityRegionId | 'all' | null>(null);
  const [showParade, setShowParade] = useState(false);
  const [paradeToast, setParadeToast] = useState<string | null>(null);

  const adventureSummary = useMemo(
    () => getAdventureLogSummary(save.unlockedLevel, save.levels),
    [save.unlockedLevel, save.levels]
  );

  const hopCancelRef = useRef(false);

  useEffect(() => {
    AdService.showBanner('map_bottom');
    return () => AdService.showBanner(null);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCountdown(getNextLifeCountdownSec(save));
    }, 1000);
    return () => clearInterval(id);
  }, [save]);

  // Animate Chotu hopping tile-by-tile along the board-game trail!
  const walkPawnToLevel = (
    targetLevelId: number,
    onArrive?: () => void
  ) => {
    hopCancelRef.current = false;
    const startId = pawnLevelId;
    if (startId === targetLevelId) {
      soundService.playTap();
      onArrive?.();
      return;
    }

    // Build path of steps (clamp visual hops to max 6 if jumping across chapters so it stays snappy)
    const dir = targetLevelId > startId ? 1 : -1;
    const distance = Math.abs(targetLevelId - startId);
    const steps: number[] = [];
    if (distance <= 6) {
      for (let cur = startId + dir; cur !== targetLevelId + dir; cur += dir) {
        steps.push(cur);
      }
    } else {
      // Teleport smoothly to chapter entrance, then hop final 2 tiles
      const nearStart = targetLevelId - dir * 2;
      steps.push(Math.max(1, Math.min(60, nearStart)), Math.max(1, Math.min(60, targetLevelId - dir)), targetLevelId);
    }

    let i = 0;
    const stepNext = () => {
      if (hopCancelRef.current) return;
      if (i >= steps.length) {
        setIsHopping(false);
        onArrive?.();
        return;
      }
      setIsHopping(true);
      setPawnLevelId(steps[i]);
      soundService.playTap();
      i++;
      window.setTimeout(stepNext, 240);
    };
    stepNext();
  };

  // On returning to the map after winning a level, play Chotu's Victory Hop + "Solved Relief" Story Resolution!
  useEffect(() => {
    if (!justCompletedLevelId || justCompletedLevelId > 60) return;
    const wonLvl = levels.find((l) => l.id === justCompletedLevelId);
    if (!wonLvl) return;

    // Scroll smoothly to that chapter
    const el = document.getElementById(`region-card-${wonLvl.region}`);
    if (el) {
      window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    }

    // Hop from completed tile to the newly unlocked next tile, then show heartwarming "Solved Relief" card!
    const nextTile = Math.min(60, Math.max(justCompletedLevelId, save.unlockedLevel));
    const timer = window.setTimeout(() => {
      if (nextTile !== justCompletedLevelId) {
        setIsHopping(true);
        setPawnLevelId(nextTile);
        soundService.playMatch(3);
        window.setTimeout(() => {
          setIsHopping(false);
          setSolvedReliefLevel(wonLvl);
          onClearJustCompleted?.();
        }, 420);
      } else {
        setSolvedReliefLevel(wonLvl);
        onClearJustCompleted?.();
      }
    }, 380);

    return () => {
      clearTimeout(timer);
      hopCancelRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justCompletedLevelId]);

  const totalStars = Object.values(save.levels).reduce((sum, p) => sum + p.stars, 0);
  const totalFestivalStars = festivalLevels.reduce(
    (sum, lvl) => sum + (save.festivalCompleted[String(lvl.id)] ?? 0),
    0
  );
  const maxCampaignStars = levels.length * 3;
  const unlimited = hasUnlimitedLives(save);
  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const regionSummaries = useMemo(
    () =>
      REGIONS.map((region, idx) => {
        const regionLevels = levels.filter(
          (l) => l.id >= region.levelRange[0] && l.id <= region.levelRange[1]
        );
        const starsEarned = regionLevels.reduce((acc, l) => acc + (save.levels[l.id]?.stars ?? 0), 0);
        const maxStars = regionLevels.length * 3;
        const perfectCount = regionLevels.filter((l) => (save.levels[l.id]?.stars ?? 0) === 3).length;
        const completedCount = regionLevels.filter((l) => save.levels[l.id]?.completed).length;
        const isUnlocked = save.unlockedLevel >= region.levelRange[0];
        const nextImperfectLevel = regionLevels.find(
          (l) => l.id <= save.unlockedLevel && (save.levels[l.id]?.stars ?? 0) < 3
        );
        return {
          region,
          index: idx,
          regionLevels,
          starsEarned,
          maxStars,
          perfectCount,
          completedCount,
          isUnlocked,
          isMastered: starsEarned >= maxStars && maxStars > 0,
          nextImperfectLevel,
        };
      }),
    [levels, save.levels, save.unlockedLevel]
  );

  const masteredRegionsCount = regionSummaries.filter((r) => r.isMastered).length;

  const squad = useMemo(
    () => getSquadState(save.unlockedLevel),
    [save.unlockedLevel]
  );

  const paradeStops = useMemo<ParadeRegionStop[]>(() => {
    return regionSummaries
      .filter((r) => r.completedCount > 0)
      .map((r) => ({
        id: r.region.id as CityRegionId,
        title: r.region.title,
        shortName: REGION_VISUALS[r.region.id].shortName,
        starsEarned: r.starsEarned,
        maxStars: r.maxStars,
        completedCount: r.completedCount,
        isFullyCompleted: r.completedCount >= r.regionLevels.length && r.regionLevels.length > 0,
      }));
  }, [regionSummaries]);

  const scrollToRegion = (regionId: RegionId) => {
    const el = document.getElementById(`region-card-${regionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBoardNodeClick = (lvl: LevelConfig) => {
    walkPawnToLevel(lvl.id, () => {
      setStoryBriefingLevel(lvl);
    });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#060A12] via-[#0B1220] to-[#081519] pb-10 text-slate-100">
      {/* Sticky Cinematic Command Bar */}
      <header className="sticky top-0 z-30 border-b border-emerald-500/25 bg-[#070B14]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBackToMenu}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-emerald-500/35 bg-slate-900 text-emerald-200 hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Back to Menu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img
              src={DOOMSDAY_LOGO_URL}
              alt="Super Crush Doomsday Logo"
              referrerPolicy="no-referrer"
              className="h-9 w-12 rounded-lg object-cover border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                SUPER CRUSH <span className="text-emerald-400">DOOMSDAY</span>
              </h1>
              <div className="text-[10px] font-bold text-slate-400 hidden sm:block">
                Avengers Saga · Solo Origin to Full Team Assemble
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold tabular-nums">
            <span className="flex items-center gap-1 text-amber-300">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {totalStars}/{maxCampaignStars}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              {unlimited ? '∞' : `${save.lives}/${save.maxLives}`}
              {!unlimited && countdown > 0 && (
                <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                  ({formatTime(countdown)})
                </span>
              )}
            </span>
            <button
              onClick={onOpenShop}
              className="flex min-h-[36px] items-center gap-1 rounded-xl border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-amber-200 hover:bg-amber-500/25 transition-colors"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{save.coins}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-4">
        {/* Zero Lives Helper Banner — Rewarded Ad #4 */}
        {!unlimited && save.lives <= 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/45 bg-rose-950/60 p-4 shadow-sm">
            <div>
              <div className="font-bold text-rose-100">Squad Out of Hearts!</div>
              <div className="text-xs text-rose-200/85">
                Next heart refills in <span className="font-mono font-bold text-amber-300">{formatTime(countdown)}</span> using your device clock.
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOnline && AdService.isAdReady() && (
                <button
                  onClick={onRefillLivesAd}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Video className="w-4 h-4" /> {t.watchAdRefillLives}
                </button>
              )}
              <button
                onClick={onOpenShop}
                className="min-h-[40px] rounded-xl bg-orange-600 px-3.5 text-xs font-bold text-white hover:bg-orange-700"
              >
                Shop Unlimited
              </button>
            </div>
          </div>
        )}

        {/* Interactive Mode Filter Tabs & Hero Actions */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 w-fit">
            <button
              onClick={() => setActiveTab('journey')}
              className={`min-h-[40px] rounded-lg px-4 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === 'journey' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Movie Saga (60)
            </button>
            <button
              onClick={() => setActiveTab('festivals')}
              className={`min-h-[40px] rounded-lg px-4 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === 'festivals' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              {t.festivalEvents} ({totalFestivalStars}/{festivalLevels.length * 3}★)
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`min-h-[40px] rounded-lg px-4 text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                activeTab === 'custom' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Custom ({save.customLevels.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                soundService.playParadeLeap();
                setShowParade(true);
              }}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 px-4 text-xs sm:text-sm font-extrabold text-slate-950 shadow-md hover:brightness-110 active:scale-[0.98] transition-all whitespace-nowrap tabular-nums"
            >
              <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
              <span>
                Victory March 3D
                {paradeStops.length > 0 ? ` (${paradeStops.length})` : ''}
              </span>
            </button>

            <button
              onClick={() => {
                soundService.playTap();
                setAdventureLogCity('all');
              }}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-400/35 bg-slate-900/90 px-4 text-xs sm:text-sm font-extrabold text-amber-100 shadow-sm hover:border-amber-400 hover:bg-slate-800 transition-colors whitespace-nowrap tabular-nums"
            >
              <Compass className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Hero Dossier ({adventureSummary.unlockedCount}/{adventureSummary.totalCount})
              </span>
            </button>
          </div>
        </div>

        {/* Parade Coin Bonus Toast */}
        <AnimatePresence>
          {paradeToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/60 bg-amber-950/85 px-4 py-3 text-xs sm:text-sm font-extrabold text-amber-100 shadow-md"
            >
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{paradeToast}</span>
              </div>
              <button
                onClick={() => setParadeToast(null)}
                aria-label="Dismiss parade reward notice"
                className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-amber-200 hover:bg-amber-900"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 60-Level Cinematic Superhero Movie Saga Map */}
        {activeTab === 'journey' && (
          <div className="flex flex-col">
            {/* Avengers-Style Squad Assembly & Winding Energy Highway Overview */}
            <section className="mb-6 rounded-3xl border border-amber-400/25 bg-[#12182E]/95 p-4 sm:p-5 shadow-xl">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{squad.activeAct.actLabel}</span>
                    <span aria-hidden="true" className="text-slate-500">·</span>
                    <span>
                      {squad.assembledCount} of {squad.totalHeroes} Superheroes Assembled
                    </span>
                    <span aria-hidden="true" className="text-slate-500">·</span>
                    <span>{masteredRegionsCount}/{REGIONS.length} Acts Mastered</span>
                  </div>
                  <h2 className="mt-1 text-lg sm:text-2xl font-black text-white tracking-tight">
                    From Solo Hero Origin to Full Superhero Team Assemble
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-sm sm:text-base font-black text-amber-300 tabular-nums">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>
                    {totalStars} / {maxCampaignStars} Saga Stars
                  </span>
                </div>
              </div>

              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((totalStars / Math.max(1, maxCampaignStars)) * 100))}%` }}
                />
              </div>

              {/* Animated Winding Cinematic Superhero Movie Path Highway */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-b from-[#0A0F1F] via-[#10172D] to-[#17122B] px-2 pt-3 pb-2 sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 text-[11px] font-bold text-slate-300">
                  <span>Saga Assembly Route · Solo Hero (Act I) → Full Team Assemble (Act V)</span>
                  <span className="tabular-nums text-amber-300">
                    Stage {Math.min(save.unlockedLevel, levels.length)} of {levels.length} Reached
                  </span>
                </div>

                <div className="relative mt-1 w-full h-36 sm:h-40">
                  <svg
                    viewBox="0 0 1000 156"
                    preserveAspectRatio="xMidYMid meet"
                    className="h-full w-full overflow-visible"
                    role="img"
                    aria-label="Animated winding superhero movie path connecting Act I Solo Hero through Act V Team Assemble"
                  >
                    <defs>
                      <linearGradient id="all-india-road-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="28%" stopColor="#F43F5E" />
                        <stop offset="52%" stopColor="#14B8A6" />
                        <stop offset="76%" stopColor="#EC4899" />
                        <stop offset="100%" stopColor="#FB923C" />
                      </linearGradient>
                    </defs>

                    {/* Subtle tactical radar arcs */}
                    <path d="M 24 134 Q 82 122 140 134 T 256 134" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.22" />
                    <path d="M 426 136 Q 486 124 546 136 T 640 136" fill="none" stroke="#2DD4BF" strokeWidth="1.5" opacity="0.22" />
                    <path d="M 650 22 Q 704 8 760 22 T 866 22" fill="none" stroke="#F472B6" strokeWidth="1.5" opacity="0.22" />

                    {/* Dark energy conduit outer track */}
                    <path
                      d={FULL_CITY_HIGHWAY_D}
                      fill="none"
                      stroke="#1E293B"
                      strokeWidth="22"
                      strokeLinecap="round"
                      opacity="0.95"
                    />
                    <path
                      d={FULL_CITY_HIGHWAY_D}
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />

                    {/* Unexplored dotted mission path */}
                    <path
                      d={FULL_CITY_HIGHWAY_D}
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="7 11"
                      opacity="0.35"
                    />

                    {/* Per-Act progressive unlocked superhero energy beam + marching dashes */}
                    {CITY_HIGHWAY_SEGMENTS.map((segD, segIdx) => {
                      const fromRegion = regionSummaries[segIdx];
                      const startLvl = fromRegion.region.levelRange[0];
                      const span = Math.max(1, fromRegion.regionLevels.length);
                      const segRatio = Math.max(0, Math.min(1, (save.unlockedLevel - startLvl) / span));
                      const segPct = Math.round(segRatio * 100);
                      const isSegFullyOpen = segRatio >= 1;
                      const segStartX = CITY_HIGHWAY_NODES[segIdx].x;
                      const segEndX = CITY_HIGHWAY_NODES[segIdx + 1].x;
                      const segClipWidth = (segEndX - segStartX) * segRatio;

                      if (segPct <= 0) return null;

                      return (
                        <g key={`highway-seg-${segIdx}`}>
                          {!isSegFullyOpen && (
                            <defs>
                              <clipPath id={`highway-seg-clip-${segIdx}`}>
                                <rect x={segStartX - 12} y="0" width={segClipWidth + 12} height="156" />
                              </clipPath>
                            </defs>
                          )}

                          <motion.path
                            d={segD}
                            pathLength={100}
                            fill="none"
                            stroke="url(#all-india-road-grad)"
                            strokeWidth="8.5"
                            strokeLinecap="round"
                            strokeDasharray="100"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 100 - segPct }}
                            transition={{ duration: 0.85, ease: 'easeOut' }}
                          />

                          <path
                            d={segD}
                            fill="none"
                            stroke="#FEF08A"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="8 11"
                            className="animate-road-dash"
                            opacity={isSegFullyOpen ? 1 : 0.85}
                            clipPath={isSegFullyOpen ? undefined : `url(#highway-seg-clip-${segIdx})`}
                          />
                        </g>
                      );
                    })}

                    {/* Interactive Movie Act Nodes along the winding road */}
                    {regionSummaries.map(({ region, starsEarned, maxStars, isMastered, isUnlocked }, idx) => {
                      const node = CITY_HIGHWAY_NODES[idx];
                      const act = SUPERHERO_MOVIE_ACTS[idx];
                      const isCurrentCity =
                        save.unlockedLevel >= region.levelRange[0] &&
                        save.unlockedLevel <= region.levelRange[1];

                      return (
                        <g
                          key={`city-node-${region.id}`}
                          onClick={() => {
                            soundService.playTap();
                            scrollToRegion(region.id);
                          }}
                          className="cursor-pointer group"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              soundService.playTap();
                              scrollToRegion(region.id);
                            }
                          }}
                          aria-label={`Jump to ${act.actLabel}: ${act.codename}, ${starsEarned} of ${maxStars} stars`}
                        >
                          {isCurrentCity && (
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r="27"
                              fill="none"
                              stroke="#FBBF24"
                              strokeWidth="3"
                              strokeDasharray="6 6"
                              className="animate-road-dash"
                              opacity="0.95"
                            />
                          )}

                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="20"
                            fill={isMastered ? '#F59E0B' : isUnlocked ? '#1E293B' : '#0F172A'}
                            stroke={isMastered ? '#FEF08A' : isUnlocked ? act.accentHex : '#475569'}
                            strokeWidth="4"
                          />

                          <text
                            x={node.x}
                            y={node.y + 5}
                            textAnchor="middle"
                            fontSize="13"
                            fontWeight="900"
                            fill={isMastered ? '#0F172A' : isUnlocked ? '#FEF3C7' : '#64748B'}
                          >
                            {isMastered ? '★' : `${idx + 1}/5`}
                          </text>

                          <text
                            x={node.x}
                            y={node.y > 76 ? node.y + 36 : node.y - 26}
                            textAnchor="middle"
                            fontSize="12.5"
                            fontWeight="800"
                            fill={isUnlocked ? '#F8FAFC' : '#94A3B8'}
                          >
                            {act.codename}
                          </text>
                          <text
                            x={node.x}
                            y={node.y > 76 ? node.y + 50 : node.y - 12}
                            textAnchor="middle"
                            fontSize="10.5"
                            fontWeight="700"
                            fill={isUnlocked ? '#FBBF24' : '#64748B'}
                          >
                            {idx === 0 ? 'Solo' : idx === 4 ? 'Team' : `${idx + 1} Heroes`} · {starsEarned}/{maxStars}★
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* 5-Act Blockbuster Movie Poster Squad Cards (Solo Origin -> Full Team Assemble) */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {regionSummaries.map(({ region, starsEarned, maxStars, isMastered, isUnlocked }, idx) => {
                  const act = SUPERHERO_MOVIE_ACTS[idx];
                  const vis = REGION_VISUALS[region.id];
                  const pct = Math.round((starsEarned / Math.max(1, maxStars)) * 100);
                  return (
                    <button
                      key={region.id}
                      onClick={() => {
                        soundService.playTap();
                        scrollToRegion(region.id);
                      }}
                      className={`group overflow-hidden rounded-2xl border text-left transition-all ${
                        isMastered
                          ? 'border-amber-400 bg-slate-900 shadow-[0_0_16px_rgba(251,191,36,0.2)]'
                          : isUnlocked
                          ? 'border-amber-400/35 bg-slate-900/95 hover:border-amber-400'
                          : 'border-slate-700/80 bg-slate-950/70 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="relative h-20 w-full overflow-hidden bg-slate-950">
                        <img
                          src={act.posterUrl}
                          alt={`${act.actLabel}: ${act.codename}`}
                          referrerPolicy="no-referrer"
                          className={`h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105 ${
                            isUnlocked ? '' : 'grayscale brightness-50'
                          }`}
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"
                        />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between gap-1 text-[10px] font-black text-amber-300">
                          <span className="truncate">
                            {idx === 0 ? '1 Hero · Solo' : idx === 4 ? '5 Heroes · Team' : `${idx + 1} Heroes`}
                          </span>
                          {isMastered ? (
                            <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          ) : !isUnlocked ? (
                            <Lock className="w-3 h-3 text-slate-300 shrink-0" />
                          ) : null}
                        </div>
                      </div>

                      <div className="p-2.5">
                        <div className="text-xs font-extrabold text-white truncate">{act.codename}</div>
                        <div className="mt-0.5 flex items-center justify-between text-[11px] font-bold tabular-nums text-amber-300">
                          <span className="text-slate-400 truncate">{vis.shortName}</span>
                          <span>
                            {starsEarned}/{maxStars}★
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${vis.barGrad} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Latest Hero Saga Dossier Dispatch */}
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-[#0D1326] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Feather className="w-3.5 h-3.5 shrink-0" />
                    <span>Latest Hero Dossier</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-200">{adventureSummary.latestEntry.cityLabel}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400 font-semibold">
                      {adventureSummary.latestEntry.milestoneLabel}
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-sm sm:text-base font-black text-white">
                    {adventureSummary.latestEntry.headline}
                  </h3>
                  <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2">
                    {adventureSummary.latestEntry.snippet}
                  </p>
                </div>

                <button
                  onClick={() => {
                    soundService.playTap();
                    setAdventureLogCity('all');
                  }}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-extrabold text-slate-950 hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Open Dossier ({adventureSummary.unlockedCount}/{adventureSummary.totalCount})</span>
                </button>
              </div>
            </section>

            {/* Individual Indian City Story Board Chapters */}
            {regionSummaries.map(
              ({
                region,
                index: rIdx,
                regionLevels,
                starsEarned,
                maxStars,
                perfectCount,
                completedCount,
                isUnlocked,
                isMastered,
                nextImperfectLevel,
              }) => {
                const vis = REGION_VISUALS[region.id];
                const chapterStory = CHAPTER_STORIES[region.id as Exclude<RegionId, 'festival'>];
                const starPct = Math.min(100, Math.round((starsEarned / Math.max(1, maxStars)) * 100));
                const tierLabel =
                  starsEarned >= 36
                    ? 'Avenger Legend'
                    : starsEarned >= 24
                    ? 'Stark Commander'
                    : starsEarned >= 12
                    ? 'Tactical Agent'
                    : 'Rookie Avenger';

                const isChapterSolved = completedCount === regionLevels.length;
                const pawnIndexInRegion = regionLevels.findIndex((l) => l.id === pawnLevelId);
                const pawnCoord = pawnIndexInRegion >= 0 ? SERPENTINE_COORDS[pawnIndexInRegion] : null;

                // Build smooth cubic-bezier winding SVG road paths inside this chapter
                const fullRoadD = buildSerpentinePath(SERPENTINE_COORDS.length);
                const unlockedRoadCount = Math.max(
                  1,
                  regionLevels.filter((l) => l.id <= save.unlockedLevel).length
                );
                const unlockedRoadD = buildSerpentinePath(unlockedRoadCount);
                const frontierIdx = unlockedRoadCount - 1;
                const hasFrontierSegment = isUnlocked && frontierIdx > 0 && frontierIdx < SERPENTINE_COORDS.length;
                const frontierSegmentD = hasFrontierSegment
                  ? buildSingleSerpentineSegmentPath(frontierIdx - 1, frontierIdx)
                  : null;
                const nextRegionSummary = regionSummaries[rIdx + 1] ?? null;

                const movieAct = getMovieActForRegion(region.id);
                const squadAtAct = SUPERHERO_MOVIE_ACTS.slice(0, rIdx + 1);

                return (
                  <React.Fragment key={region.id}>
                  <section
                    id={`region-card-${region.id}`}
                    className="scroll-mt-20 overflow-hidden rounded-3xl border border-amber-400/25 bg-[#12182E] shadow-2xl"
                  >
                    {/* Full-Bleed Blockbuster Superhero Movie Banner Header */}
                    <div className="relative min-h-[210px] sm:min-h-[245px] overflow-hidden bg-gradient-to-r from-[#0E1326] via-[#1E1535] to-[#2E1622] px-4 py-5 sm:px-6 sm:py-6 text-white flex flex-col justify-between">
                      <img
                        src={movieAct.posterUrl}
                        alt={`${movieAct.actLabel}: ${movieAct.movieTitle}`}
                        referrerPolicy="no-referrer"
                        className={`absolute inset-0 h-full w-full object-cover object-center ${
                          isUnlocked ? 'opacity-90' : 'opacity-40 grayscale'
                        }`}
                      />
                      {/* Measured Cinema Contrast Scrim for WCAG AA+ Text Legibility */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#0B1020] via-[#0B1020]/65 to-[#0B1020]/30"
                      />

                      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <StarMasteryRing earned={starsEarned} max={maxStars} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-amber-300">
                              <span>{movieAct.actLabel}</span>
                              <span aria-hidden="true" className="text-white/40">·</span>
                              <span>{movieAct.squadStageLabel}</span>
                              <span aria-hidden="true" className="text-white/40">·</span>
                              <span className="text-white/90">{tierLabel}</span>
                            </div>
                            <h2 className="mt-0.5 text-xl sm:text-3xl font-black tracking-tight text-white drop-shadow">
                              {movieAct.movieTitle}
                            </h2>
                            <p className="text-xs sm:text-sm font-semibold text-amber-100/95">
                              {region.title} · Hero Joins: {movieAct.codename} ({movieAct.powerSignature})
                            </p>
                          </div>
                        </div>

                        <div className="text-right ml-auto">
                          <div className="flex items-center justify-end gap-1.5 text-lg sm:text-2xl font-black tabular-nums text-amber-300 drop-shadow">
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400 text-amber-300" />
                            <span>
                              {starsEarned} / {maxStars}
                            </span>
                          </div>
                          <div className="text-[11px] sm:text-xs font-semibold text-slate-200 tabular-nums">
                            {perfectCount}/{regionLevels.length} 3-Starred · {completedCount}/{regionLevels.length} Solved
                          </div>
                          {/* Active Squad Roster Count at this Movie Act */}
                          <div className="mt-1.5 flex items-center justify-end gap-1 text-[11px] font-bold text-emerald-300">
                            <Shield className="w-3.5 h-3.5" />
                            <span>
                              Active Lineup: {squadAtAct.map((h) => h.codename.split(' ')[0]).join(' + ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Regional Star Milestone Bar */}
                      <div className="relative z-10 mt-5">
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/45 border border-white/15">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 transition-all duration-500"
                            style={{ width: `${starPct}%` }}
                          />
                          <span className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white/50" aria-hidden="true" />
                          <span className="absolute top-0 bottom-0 left-2/3 w-0.5 bg-white/50" aria-hidden="true" />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-200 tabular-nums">
                          <span>0★</span>
                          <span className={starsEarned >= 12 ? 'text-amber-300 font-bold' : 'opacity-75'}>
                            12★ Rookie
                          </span>
                          <span className={starsEarned >= 24 ? 'text-amber-300 font-bold' : 'opacity-75'}>
                            24★ Guardian
                          </span>
                          <span className={starsEarned >= 36 ? 'text-amber-300 font-bold' : 'opacity-75'}>
                            36★ Avenger Legend
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cinematic Recruitment & Solved Relief Narrative Ribbon */}
                    <div className="border-b border-amber-400/15 bg-[#161D36] px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-[220px]">
                        <div className="mt-0.5 shrink-0">
                          {isChapterSolved ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Shield className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm leading-relaxed text-slate-200">
                          <span className="font-extrabold text-amber-300">
                            {isChapterSolved ? 'Act Complete · Victory Relief: ' : `${movieAct.codename} Briefing: `}
                          </span>
                          <span>
                            {isChapterSolved ? chapterStory.chapterRelief : movieAct.recruitmentLine}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            soundService.playTap();
                            setAdventureLogCity(region.id as CityRegionId);
                          }}
                          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-400/30 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-slate-800 transition-colors whitespace-nowrap"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-400" />
                          <span>Dossier</span>
                        </button>
                        <button
                          onClick={() => setJournalRegionId(region.id as Exclude<RegionId, 'festival'>)}
                          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-400/30 bg-slate-900 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-slate-800 transition-colors whitespace-nowrap"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                          <span>Script Log</span>
                        </button>
                        {nextImperfectLevel && (
                          <button
                            onClick={() => handleBoardNodeClick(nextImperfectLevel)}
                            className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-extrabold text-slate-950 shadow-sm hover:brightness-110 transition-all whitespace-nowrap"
                          >
                            <Target className="w-3.5 h-3.5" />
                            <span>
                              {(save.levels[nextImperfectLevel.id]?.stars ?? 0) === 0
                                ? `Deploy Lv.${nextImperfectLevel.id}`
                                : `3-Star Lv.${nextImperfectLevel.id}`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tactical Dark Superhero Mission Map Board */}
                    <div className="relative bg-gradient-to-b from-[#0D1326] via-[#111830] to-[#0C1122] p-3 sm:p-6">
                      {/* True Serpentine S-Curve Board (4 cols × 3 rows, Rows alternate L→R, R→L, L→R) */}
                      <div className="relative mx-auto w-full max-w-[780px] aspect-[4/3.4] sm:aspect-[4/2.75]">
                        {/* Smooth Winding Cubic-Bezier Superhero Energy Conduit SVG */}
                        <svg
                          viewBox="0 0 400 300"
                          preserveAspectRatio="none"
                          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                          aria-hidden="true"
                        >
                          {/* Deep metallic energy channel */}
                          <path
                            d={fullRoadD}
                            fill="none"
                            stroke="#1E293B"
                            strokeWidth="22"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.92"
                          />
                          <path
                            d={fullRoadD}
                            fill="none"
                            stroke="#090E1C"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Unexplored dotted mission trajectory */}
                          <path
                            d={fullRoadD}
                            fill="none"
                            stroke={movieAct.accentHex}
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="6 9"
                            opacity="0.34"
                          />
                          {/* Progressive Glowing Superhero Energy Trail */}
                          {isUnlocked && unlockedRoadCount > 1 && (
                            <>
                              <motion.path
                                d={unlockedRoadD}
                                pathLength={100}
                                fill="none"
                                stroke={movieAct.accentHex}
                                strokeWidth="8.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="100"
                                initial={{ strokeDashoffset: 100 }}
                                animate={{ strokeDashoffset: 0 }}
                                transition={{ duration: 0.9, ease: 'easeOut' }}
                              />
                              {/* Animated SVG dashed-line energy pulse marching forward */}
                              <path
                                d={unlockedRoadD}
                                fill="none"
                                stroke="#FEF9C3"
                                strokeWidth="3.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="7 11"
                                className="animate-road-dash"
                              />
                            </>
                          )}
                          {/* Active Frontier Guide Beam leading into the next unlocked mission */}
                          {frontierSegmentD && !isChapterSolved && (
                            <path
                              d={frontierSegmentD}
                              fill="none"
                              stroke="#FBBF24"
                              strokeWidth="4.2"
                              strokeLinecap="round"
                              strokeDasharray="6 8"
                              className="animate-road-dash"
                            />
                          )}
                        </svg>

                        {/* 12 Serpentine Mission Nodes */}
                        {regionLevels.map((lvl, idx) => {
                          const coord = SERPENTINE_COORDS[idx];
                          const progress = save.levels[lvl.id];
                          const stars = progress?.stars ?? 0;
                          const unlocked = lvl.id <= save.unlockedLevel;
                          const isNext = lvl.id === save.unlockedLevel;
                          const isBoss = Boolean(lvl.bossHp);
                          const isPerfect = stars === 3;
                          const isSolved = Boolean(progress?.completed);
                          const hasPawn = pawnLevelId === lvl.id;

                          return (
                            <motion.button
                              key={lvl.id}
                              type="button"
                              disabled={!unlocked}
                              whileHover={unlocked ? { scale: 1.07, y: -2 } : undefined}
                              whileTap={unlocked ? { scale: 0.96 } : undefined}
                              onClick={() => handleBoardNodeClick(lvl)}
                              style={{
                                left: `${coord.xPct}%`,
                                top: `${coord.yPct}%`,
                              }}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 overflow-hidden flex flex-col items-center justify-center rounded-2xl border-2 transition-shadow w-[21.5%] max-w-[116px] min-w-[66px] py-2 px-1.5 sm:py-2.5 sm:px-2 ${
                                isNext
                                  ? 'bg-gradient-to-b from-amber-400 via-orange-500 to-rose-600 text-white border-amber-200 shadow-[0_0_24px_rgba(251,191,36,0.55)] ring-4 ring-amber-400/35'
                                  : unlocked
                                  ? isBoss
                                    ? 'bg-[#1D1032] text-white border-amber-400 shadow-[0_0_20px_rgba(244,63,94,0.45)]'
                                    : isPerfect
                                    ? 'bg-gradient-to-b from-amber-950/90 to-slate-900 text-amber-100 border-amber-400 shadow-md'
                                    : isSolved
                                    ? 'bg-gradient-to-b from-emerald-950/85 to-slate-900 text-emerald-100 border-emerald-400/70 shadow-sm'
                                    : 'bg-slate-900/95 text-white border-slate-600 shadow-sm'
                                  : 'bg-slate-950/75 text-slate-500 border-slate-800 cursor-not-allowed'
                              } ${hasPawn ? 'z-20' : ''}`}
                            >
                              {/* Boss Stage Custom Villain Backdrop Portrait */}
                              {isBoss && (
                                <>
                                  <img
                                    src={BOSS_VILLAIN_PORTRAIT}
                                    alt={lvl.bossName ?? 'Boss Showdown'}
                                    referrerPolicy="no-referrer"
                                    className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${
                                      unlocked ? 'opacity-45' : 'opacity-20 grayscale'
                                    }`}
                                  />
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/25"
                                  />
                                </>
                              )}

                              {/* Top specular rim on active tiles */}
                              {unlocked && !isBoss && (
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute inset-x-2 top-1 h-1.5 rounded-full bg-white/20"
                                />
                              )}

                              {/* Tile Number & Icon */}
                              <div className="relative z-10 flex items-center justify-center gap-1">
                                {isBoss && <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />}
                                <span className="text-sm sm:text-lg font-black tabular-nums leading-none">
                                  {unlocked ? lvl.id : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                </span>
                                {isSolved && !isBoss && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 hidden sm:inline" />
                                )}
                              </div>

                              <span
                                className={`relative z-10 mt-0.5 text-[9px] sm:text-[10px] font-bold truncate max-w-full ${
                                  isNext || isBoss ? 'text-amber-100' : unlocked ? 'text-slate-300' : 'text-slate-600'
                                }`}
                              >
                                {isBoss ? 'Boss Clash' : lvl.timeLimitSec ? 'Timed' : isSolved ? 'Cleared' : `${lvl.rows}×${lvl.cols}`}
                              </span>

                              {/* 1-3 Stars */}
                              <div className="relative z-10 mt-1 flex items-center gap-0.5">
                                {[1, 2, 3].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                      stars >= s
                                        ? 'fill-amber-400 text-amber-400'
                                        : isNext || isBoss
                                        ? 'text-white/30'
                                        : 'text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </motion.button>
                          );
                        })}

                        {/* Animated Moving Superhero Squad Pawn */}
                        {pawnCoord && (
                          <motion.div
                            key={`pawn-region-${region.id}`}
                            animate={{
                              left: `${pawnCoord.xPct}%`,
                              top: `${Math.max(4, pawnCoord.yPct - 11)}%`,
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 340,
                              damping: 22,
                            }}
                            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30"
                          >
                            <ChotuBoardPawn
                              outfit={save.equippedOutfit}
                              isHopping={isHopping}
                              squadCount={squad.assembledCount}
                            />
                          </motion.div>
                        )}
                      </div>

                      <div className="mt-2.5 text-center text-[11px] font-semibold text-slate-400">
                        {isMastered
                          ? `Mastered all ${maxStars} stars in ${movieAct.actLabel}!`
                          : !isUnlocked
                          ? `Defeat Boss Stage ${region.levelRange[0] - 1} to recruit ${movieAct.codename} and unlock ${movieAct.actLabel}.`
                          : `Tap any unlocked mission node to deploy your squad · ${maxStars - starsEarned} stars left in ${movieAct.actLabel}`}
                      </div>
                    </div>
                  </section>

                  {/* Animated Winding Inter-Act Superhero Crossover Conduit */}
                  {nextRegionSummary && (
                    <InterCityRoadConnector
                      fromRegionName={movieAct.codename}
                      toRegionName={SUPERHERO_MOVIE_ACTS[rIdx + 1].codename}
                      routeTitle={movieAct.crossoverNextTitle ?? CITY_HIGHWAY_NODES[rIdx].routeTitle}
                      routeStory={movieAct.crossoverNextTeaser ?? CITY_HIGHWAY_NODES[rIdx].routeStory}
                      fromStroke={movieAct.accentHex}
                      toStroke={SUPERHERO_MOVIE_ACTS[rIdx + 1].accentHex}
                      progressRatio={
                        Math.max(0, Math.min(1, (save.unlockedLevel - region.levelRange[0]) / Math.max(1, regionLevels.length)))
                      }
                      isNextUnlocked={nextRegionSummary.isUnlocked}
                      unlockRequirementLevel={region.levelRange[1]}
                      gradientId={`intercity-grad-${rIdx}`}
                      reverseCurve={rIdx % 2 === 1}
                    />
                  )}
                  </React.Fragment>
                );
              }
            )}
          </div>
        )}

        {/* Multiverse Special Ops Levels */}
        {activeTab === 'festivals' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-[#10182B] px-5 py-3.5 shadow-sm">
              <div>
                <h2 className="text-base font-black text-white">Multiverse Special Ops</h2>
                <p className="text-xs text-slate-300">Earn stars in limited Avengers Multiverse missions to unlock rare artifacts.</p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-black text-emerald-300 tabular-nums">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {totalFestivalStars} / {festivalLevels.length * 3} Op Stars
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FESTIVAL_EVENTS.map((ev) => {
                const lvl = festivalLevels.find((l) => l.id === ev.levelId);
                if (!lvl) return null;
                const stars = save.festivalCompleted[String(ev.levelId)] ?? 0;
                return (
                  <div
                    key={ev.id}
                    className="flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/25 bg-[#10182B] shadow-md"
                  >
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-5 py-3 text-white flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Multiverse Op
                      </span>
                      <span className="tabular-nums">+{ev.rewardCoins} Credits</span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-extrabold text-white">{ev.name}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">{ev.description}</p>
                        <div className="mt-3 flex items-center gap-1">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${stars >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                            />
                          ))}
                          <span className="ml-1.5 text-xs font-bold text-emerald-300 tabular-nums">{stars}/3</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onStartLevel(lvl)}
                        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 transition-colors"
                      >
                        <Play className="w-4 h-4 fill-current" /> Deploy Mission
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Editor Missions */}
        {activeTab === 'custom' && (
          <div>
            {save.customLevels.length === 0 ? (
              <div className="rounded-3xl border border-emerald-500/25 bg-[#10182B] p-8 text-center">
                <Flame className="mx-auto w-8 h-8 text-emerald-400" />
                <h3 className="mt-2 text-lg font-bold text-white">No Custom Missions Yet</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Open the Mission Architect from Command HQ to build and import your own Avengers Doomsday stages!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {save.customLevels.map((lvl) => (
                  <div
                    key={lvl.id}
                    className="flex flex-col justify-between rounded-3xl border border-emerald-500/25 bg-[#10182B] p-5 shadow-md"
                  >
                    <div>
                      <div className="text-xs font-semibold text-emerald-300">
                        {lvl.rows}×{lvl.cols} Grid · {lvl.moves} Turns
                      </div>
                      <h3 className="mt-1 text-lg font-bold text-white">{lvl.name}</h3>
                    </div>
                    <button
                      onClick={() => onStartLevel(lvl)}
                      className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-extrabold text-slate-950 hover:bg-emerald-400"
                    >
                      <Play className="w-4 h-4 fill-current" /> Play Custom Mission
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Allowed Map Bottom Banner Ad */}
        <AdBannerSlot
          allowedPosition="map_bottom"
          isAdFree={isAdFree(save)}
          isOnline={isOnline}
          onRemoveAdsClick={onOpenShop}
        />
      </div>

      {/* Interactive Story Briefing Sheet (Opens when Commander Nova hops onto a mission node) */}
      <AnimatePresence>
        {storyBriefingLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm"
            onClick={() => setStoryBriefingLevel(null)}
          >
            {(() => {
              const lvl = storyBriefingLevel;
              const story = getLevelStory(lvl.id, lvl.name, lvl.region);
              const prog = save.levels[lvl.id];
              const vis = REGION_VISUALS[lvl.region];
              const movieAct = getMovieActForRegion(lvl.region);
              const isBossStage = Boolean(lvl.bossHp);

              return (
                <motion.div
                  initial={{ y: 40, scale: 0.96, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: 30, scale: 0.96, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md overflow-hidden rounded-3xl bg-[#0D1424] text-slate-100 shadow-2xl border-2 border-emerald-500/50"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-slate-950 text-white flex flex-col justify-between p-4">
                    <img
                      src={isBossStage ? BOSS_VILLAIN_PORTRAIT : movieAct.posterUrl}
                      alt={isBossStage ? (lvl.bossName ?? 'Boss Showdown') : movieAct.movieTitle}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0D1424] via-black/50 to-black/25"
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-emerald-300">
                        {isBossStage ? 'VILLAIN SHOWDOWN' : movieAct.actLabel} · {movieAct.squadStageLabel}
                      </span>
                      <button
                        onClick={() => setStoryBriefingLevel(null)}
                        aria-label="Close briefing"
                        className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="relative z-10">
                      <div className="text-xs font-semibold text-slate-200">
                        Mission {lvl.id} · {lvl.rows}×{lvl.cols} · {lvl.moves} Turns
                        {lvl.timeLimitSec ? ` · ${lvl.timeLimitSec}s` : ''}
                      </div>
                      <h3 className="text-xl font-black text-white drop-shadow">{story.title}</h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Tactical Briefing */}
                    <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/25 p-3.5">
                      <div className="text-xs font-extrabold text-emerald-400 mb-1">Mission Briefing</div>
                      <p className="text-sm leading-relaxed text-slate-200">{story.dilemma}</p>
                    </div>

                    {/* Commander Nova Dialogue */}
                    <ChotuMascot
                      mood={lvl.bossHp ? 'boss' : 'cheer'}
                      outfit={save.equippedOutfit}
                      quote={story.chotuLine}
                      size="sm"
                    />

                    {/* If already solved, show the Mission Relief record */}
                    {prog?.completed && (
                      <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/35 p-3.5">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-300 mb-1">
                          <CheckCircle2 className="w-4 h-4" /> Victory Record Unlocked ({prog.stars}/3 ★)
                        </div>
                        <p className="text-xs leading-relaxed text-emerald-100/90">{story.solvedRelief}</p>
                      </div>
                    )}

                    {/* Mission Objectives Preview */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {lvl.goals.map((g, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                            {g.type === 'collect' && g.sweet ? (
                              <>
                                <div className="w-6 h-6">
                                  <SweetIcon sweet={g.sweet} colorBlindMode={save.settings.colorBlindMode} />
                                </div>
                                <span>
                                  {g.target} {SWEET_META[g.sweet].name}
                                </span>
                              </>
                            ) : g.type === 'cherry' ? (
                              <>
                                <div className="w-5 h-5">
                                  <CherryIcon />
                                </div>
                                <span>Extract {g.target} Tesseracts</span>
                              </>
                            ) : g.type === 'jelly' ? (
                              <span>Break {g.target} Doom Shields</span>
                            ) : g.type === 'boss' ? (
                              <span className="text-rose-400">Defeat {lvl.bossName} ({g.target} HP)</span>
                            ) : (
                              <span>Reach {g.target.toLocaleString()} pts</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setStoryBriefingLevel(null);
                        onStartLevel(lvl);
                      }}
                      className={`flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${vis.headerGrad} text-sm font-black text-white shadow-lg transition-transform active:scale-[0.98]`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{prog?.completed ? 'Replay Mission' : 'Launch Mission!'}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-Battle Victory Relief Epilogue Card (Shown after returning from a Win!) */}
      <AnimatePresence>
        {solvedReliefLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setSolvedReliefLevel(null)}
          >
            {(() => {
              const lvl = solvedReliefLevel;
              const story = getLevelStory(lvl.id, lvl.name, lvl.region);
              const nextLvl = levels.find((l) => l.id === lvl.id + 1);
              const earnedStars = save.levels[lvl.id]?.stars ?? 1;

              return (
                <motion.div
                  initial={{ scale: 0.88, y: 24, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.92, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md overflow-hidden rounded-3xl bg-[#0D1424] text-slate-100 shadow-2xl border-2 border-emerald-400/70 text-center"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-slate-950 px-6 py-4 text-white flex flex-col justify-end">
                    <img
                      src={getMovieActForRegion(lvl.region).posterUrl}
                      alt={story.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0D1424] via-black/55 to-black/20"
                    />
                    <div className="relative z-10 text-xs font-bold text-emerald-300">
                      Mission {lvl.id} Cleared · Post-Battle Relief!
                    </div>
                    <h3 className="relative z-10 mt-0.5 text-xl font-black text-white">{story.title}</h3>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-center mb-3">
                      <ChotuMascot mood="dance" outfit={save.equippedOutfit} size="md" />
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mb-3">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-7 h-7 ${
                            earnedStars >= s ? 'fill-amber-400 text-amber-400 drop-shadow' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-sm leading-relaxed font-medium text-slate-100">
                      {story.solvedRelief}
                    </p>
                    <p className="mt-2.5 text-xs italic font-semibold text-emerald-400">
                      {story.npcThankYou}
                    </p>

                    <div className="mt-5 flex flex-col gap-2.5">
                      {nextLvl && nextLvl.id <= save.unlockedLevel && (
                        <button
                          onClick={() => {
                            setSolvedReliefLevel(null);
                            setStoryBriefingLevel(nextLvl);
                          }}
                          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-extrabold text-slate-950 hover:bg-emerald-400 shadow-md"
                        >
                          <Play className="w-4 h-4 fill-current" /> Continue to Mission {nextLvl.id}
                        </button>
                      )}
                      <button
                        onClick={() => setSolvedReliefLevel(null)}
                        className="min-h-[42px] w-full rounded-xl border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800"
                      >
                        Return to Command Map
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter Script Log Modal (Re-read all unlocked missions & battle outcomes!) */}
      <AnimatePresence>
        {journalRegionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm"
            onClick={() => setJournalRegionId(null)}
          >
            {(() => {
              const chapter = CHAPTER_STORIES[journalRegionId];
              const regInfo = REGIONS.find((r) => r.id === journalRegionId)!;
              const regLevels = levels.filter(
                (l) => l.id >= regInfo.levelRange[0] && l.id <= regInfo.levelRange[1]
              );
              const vis = REGION_VISUALS[journalRegionId];

              return (
                <motion.div
                  initial={{ scale: 0.94, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-3xl bg-[#0D1424] text-slate-100 shadow-2xl border-2 border-emerald-500/40"
                >
                  <div className={`sticky top-0 z-10 bg-gradient-to-r ${vis.headerGrad} px-5 py-4 text-white flex items-center justify-between`}>
                    <div>
                      <div className="text-xs font-semibold text-white/85">{regInfo.title} Script Log</div>
                      <h3 className="text-lg font-black">{chapter.chapterTitle}</h3>
                    </div>
                    <button
                      onClick={() => setJournalRegionId(null)}
                      aria-label="Close script log"
                      className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl bg-black/30 text-white hover:bg-black/50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="rounded-2xl bg-slate-900 border border-emerald-500/25 p-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <strong className="text-emerald-300">Opening Scene:</strong> {chapter.introStory}
                    </div>

                    {regLevels.map((lvl) => {
                      const prog = save.levels[lvl.id];
                      const unlocked = lvl.id <= save.unlockedLevel;
                      const beat = getLevelStory(lvl.id, lvl.name, lvl.region);

                      return (
                        <div
                          key={lvl.id}
                          className={`rounded-2xl border p-3.5 ${
                            prog?.completed
                              ? 'border-emerald-500/35 bg-emerald-950/35'
                              : unlocked
                              ? 'border-slate-700 bg-slate-900/90'
                              : 'border-slate-800 bg-slate-950/70 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                            <span className="text-white">
                              Mission {lvl.id} · {beat.title}
                            </span>
                            {prog?.completed ? (
                              <span className="text-emerald-400">Cleared · {prog.stars}/3 ★</span>
                            ) : unlocked ? (
                              <span className="text-amber-400">Active</span>
                            ) : (
                              <span className="text-slate-500">Classified</span>
                            )}
                          </div>
                          {unlocked ? (
                            <div className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-slate-300">
                              <p>{beat.dilemma}</p>
                              {prog?.completed && (
                                <p className="font-semibold text-emerald-300">
                                  Aftermath: {beat.solvedRelief}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">
                              Reach Mission {lvl.id} on the tactical map to declassify this scene.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avengers Mission Dossier Modal */}
      {adventureLogCity && (
        <AdventureLogModal
          save={save}
          initialCity={adventureLogCity}
          onClose={() => setAdventureLogCity(null)}
          onJumpToCity={(cid) => {
            setActiveTab('journey');
            window.setTimeout(() => scrollToRegion(cid), 60);
          }}
        />
      )}

      {/* 3D Animated Avengers Victory March through Completed Sectors */}
      {showParade && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B14] text-emerald-100">
              <div className="rounded-2xl border border-emerald-500/40 bg-[#0D1628] px-6 py-4 text-sm font-bold shadow-2xl">
                Deploying Commander Nova&apos;s 3D Victory March...
              </div>
            </div>
          }
        >
          <FestivalParade3D
            stops={paradeStops}
            outfit={save.equippedOutfit}
            isPreviewOnly={paradeStops.length === 0}
            onClaimAndClose={(coinsEarned, offeringsCollected) => {
              if (coinsEarned > 0) {
                onBonusCoins(coinsEarned);
                soundService.playCoin();
              }
              setShowParade(false);
              setParadeToast(
                `+${coinsEarned} Credits claimed from ${offeringsCollected} Infinity Shards during the 3D Victory March!`
              );
              window.setTimeout(() => setParadeToast(null), 5000);
            }}
            onCloseWithoutClaim={() => setShowParade(false)}
          />
        </Suspense>
      )}
    </div>
  );
};
