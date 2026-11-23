import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyBoosterEffect,
  applyBossCounterattack,
  applyGravityAndRefill,
  applyHeroUltimate,
  applyInfinitySnap,
  applyKadhaiRecipeEffect,
  applyWinStreakBonuses,
  areAdjacent,
  cloneBoard,
  countRemainingJelly,
  createBoard,
  createRng,
  findBestHint,
  getActiveSweets,
  isCellMovable,
  isValidSwap,
  resolveCurrentMatches,
  resolveSpecialSwap,
  rotateGravityDir,
  shuffleBoard,
  spawnSugarRushSpecial,
  swapCellContents,
} from '../game/engine';
import {
  KADHAI_RECIPES,
  RoyalGuestOrder,
  createGuestOrder,
  doesFusionSatisfyOrder,
  evaluateKadhaiRecipe,
} from '../game/kadhai';
import { getLevelStory } from '../game/stories';
import {
  getHeroById,
  getMovieActForRegion,
  getSquadState,
  getWinStreakInfo,
  SUPERHERO_MOVIE_ACTS,
} from '../game/superheroes';
import { SWEET_META, THEMES } from '../game/themes';
import {
  BoosterType,
  Cell,
  GameViewMode,
  GravityDir,
  LevelConfig,
  MascotMood,
  Pos,
  SaveState,
  SpecialType,
  SweetType,
  UndoSnapshot,
} from '../game/types';
import { getT } from '../i18n/translations';
import { AdService } from '../services/adService';
import { shareOrDownloadVictoryCard } from '../services/shareCardService';
import { soundService } from '../services/soundService';
import { BossBar } from './BossBar';
import { ChotuMascot } from './ChotuMascot';
import {
  KadhaiAlchemyPanel,
  RoyalGuestOrderCard,
  ThaliGravityDial,
} from './KadhaiAlchemyPanel';
import { CherryIcon, SweetIcon } from './SweetIcon';
import {
  AlertTriangle,
  Box,
  Check,
  Clock,
  Coins,
  Flame,
  Hammer,
  LayoutGrid,
  Lock,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat2,
  RotateCcw,
  Share2,
  Shield,
  Shuffle,
  Snowflake,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Undo2,
  Video,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  confetti?: boolean;
  star?: boolean;
  rot?: number;
  vrot?: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface BeamFlash {
  dir: 'h' | 'v';
  posPx: number;
  color: string;
  life: number;
  maxLife: number;
}

interface ScorePop {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatingBanner {
  id: number;
  text: string;
  subtext?: string;
}

interface HeroCommMessage {
  id: number;
  tag: string;
  text: string;
}

interface CutInOverlayState {
  id: number;
  title: string;
  subtitle: string;
  heroName: string;
  posterUrl: string;
  accentHex: string;
  gradientClass: string;
}

const RELIC_PARTICLE_COLORS: Record<SweetType, string> = {
  laddu: '#22D3EE',
  jalebi: '#FB7185',
  gulab_jamun: '#818CF8',
  rasgulla: '#34D399',
  barfi: '#E879F9',
  mysore_pak: '#FBBF24',
};

interface GameScreenProps {
  level: LevelConfig;
  save: SaveState;
  isOnline: boolean;
  onConsumeBooster: (booster: BoosterType) => boolean;
  onGrantBooster: (booster: BoosterType, amount?: number) => void;
  onSpendCoins: (amount: number) => boolean;
  onLevelComplete: (payload: {
    level: LevelConfig;
    score: number;
    stars: number;
    coinsEarned: number;
    matchesMade: number;
    specialsCreated: number;
    bestCombo: number;
    bossDefeated: boolean;
    collectedSweets: Record<SweetType, number>;
  }) => void;
  onLevelFail: (level: LevelConfig, score: number) => void;
  onExitToMap: (afterWin: boolean) => void;
  onNextLevel: (currentLevelId: number) => void;
  onToggleSetting: (key: 'sound' | 'music' | 'vibration' | 'colorBlindMode') => void;
  onSetViewMode: (mode: GameViewMode) => void;
  onBonusCoins: (amount: number) => void;
  onRecordKadhaiOrders?: (ordersServed: number) => void;
  onRecordBlitzScore?: (
    score: number,
    creditsEarned: number,
    matchesMade: number,
    specialsCreated: number,
    bestCombo: number
  ) => void;
  onSelectHero?: (heroId: string) => void;
}

const MAX_UNDOS = 3;

export const GameScreen: React.FC<GameScreenProps> = ({
  level,
  save,
  isOnline,
  onConsumeBooster,
  onGrantBooster,
  onSpendCoins,
  onLevelComplete,
  onLevelFail,
  onExitToMap,
  onNextLevel,
  onToggleSetting,
  onSetViewMode,
  onBonusCoins,
  onRecordKadhaiOrders,
  onRecordBlitzScore,
  onSelectHero,
}) => {
  const t = getT(save.settings.language);
  const theme = THEMES[level.festivalTag ?? save.settings.theme] ?? THEMES.classic;
  const movieAct = useMemo(() => getMovieActForRegion(level.region), [level.region]);
  const availableHeroes = useMemo(
    () =>
      level.isBlitz
        ? SUPERHERO_MOVIE_ACTS
        : SUPERHERO_MOVIE_ACTS.filter((h) => save.unlockedLevel >= h.unlockLevel),
    [level.isBlitz, save.unlockedLevel]
  );
  const [battleHeroId, setBattleHeroId] = useState<string>(save.activeHeroId);
  useEffect(() => {
    setBattleHeroId(save.activeHeroId);
  }, [save.activeHeroId]);

  const activeHero = useMemo(
    () => availableHeroes.find((h) => h.id === battleHeroId) ?? getHeroById(save.activeHeroId, save.unlockedLevel),
    [availableHeroes, battleHeroId, save.activeHeroId, save.unlockedLevel]
  );
  const gauntletPalette = useMemo(() => getActiveSweets(level), [level]);
  const levelStory = useMemo(
    () => getLevelStory(level.id, level.name, level.region),
    [level.id, level.name, level.region]
  );
  const canUseWinStreak = !level.isRelax && !level.isCustom && !level.isKadhaiRush && !level.isBlitz;
  const activeWinStreak = canUseWinStreak ? save.winStreak ?? 0 : 0;
  const streakInfo = useMemo(() => getWinStreakInfo(activeWinStreak), [activeWinStreak]);
  const squadAfterWin = useMemo(
    () => getSquadState(Math.max(save.unlockedLevel, level.id < 60 ? level.id + 1 : 60)),
    [save.unlockedLevel, level.id]
  );
  const rngRef = useRef<() => number>(createRng(level.seed));
  const viewMode: GameViewMode = save.settings.viewMode ?? 'thali_3d';
  const isThali3D = viewMode === 'thali_3d';

  const [board, setBoard] = useState<Cell[][]>(() => createBoard(level, level.seed));
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(level.moves);
  const [timeLeft, setTimeLeft] = useState<number | null>(level.timeLimitSec ?? null);
  const [collected, setCollected] = useState<Record<SweetType, number>>({
    laddu: 0,
    jalebi: 0,
    gulab_jamun: 0,
    rasgulla: 0,
    barfi: 0,
    mysore_pak: 0,
  });
  const [cherriesDropped, setCherriesDropped] = useState(0);
  const [bossHp, setBossHp] = useState(level.bossHp ?? 0);
  const [bossHit, setBossHit] = useState(false);

  const [selected, setSelected] = useState<Pos | null>(null);
  const [cursor, setCursor] = useState<Pos>({ row: 0, col: 0 });
  const [invalidPair, setInvalidPair] = useState<[Pos, Pos] | null>(null);
  const [clearingSet, setClearingSet] = useState<Set<string>>(new Set());
  const [hintPair, setHintPair] = useState<[Pos, Pos] | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [boardShaking, setBoardShaking] = useState(false);
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);

  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [sugarRush, setSugarRush] = useState(0); // 0..100
  const [heroCharge, setHeroCharge] = useState(0); // 0..100 playable Avenger Ultimate gauge
  const [gauntletStones, setGauntletStones] = useState<SweetType[]>([]);
  const [snapFlash, setSnapFlash] = useState(false);
  const [cutIn, setCutIn] = useState<CutInOverlayState | null>(null);
  const [bossStrikeTurns, setBossStrikeTurns] = useState(3);
  const [bossStunned, setBossStunned] = useState(false);
  const [matchesMade, setMatchesMade] = useState(0);
  const [specialsCreated, setSpecialsCreated] = useState(0);
  const [floatingBanners, setFloatingBanners] = useState<FloatingBanner[]>([]);
  const [shuffleToast, setShuffleToast] = useState(false);
  const [heroComm, setHeroComm] = useState<HeroCommMessage>({
    id: 1,
    tag: movieAct.actLabel,
    text: movieAct.comms.start,
  });
  const [posterFailed, setPosterFailed] = useState(false);
  const [heroPortraitFailed, setHeroPortraitFailed] = useState(false);

  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [undosRemaining, setUndosRemaining] = useState(MAX_UNDOS);

  const [mascotMood, setMascotMood] = useState<MascotMood>(level.bossHp ? 'boss' : 'idle');
  const [isPaused, setIsPaused] = useState(false);
  const [showTutorial, setShowTutorial] = useState(Boolean(level.tutorialKey));
  const [phase, setPhase] = useState<'playing' | 'out_of_moves' | 'won' | 'failed' | 'blitz_done'>('playing');
  const [winCoinsEarned, setWinCoinsEarned] = useState(0);
  const [winCoinsDoubled, setWinCoinsDoubled] = useState(false);
  const [blitzCreditsEarned, setBlitzCreditsEarned] = useState(0);
  const [isNewBlitzBest, setIsNewBlitzBest] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [reviveUsed, setReviveUsed] = useState(false);
  const [adBusy, setAdBusy] = useState(false);

  // Signature Features: 4-Way Gravity Shift & Live Stark Arc Forge
  const [gravityDir, setGravityDir] = useState<GravityDir>('down');
  const [gravityCharge, setGravityCharge] = useState(100);
  const [tiltKick, setTiltKick] = useState<-1 | 0 | 1>(0);
  const [kadhaiSlots, setKadhaiSlots] = useState<SweetType[]>([]);
  const [guestOrder, setGuestOrder] = useState<RoyalGuestOrder>(() => createGuestOrder(0));
  const [ordersServed, setOrdersServed] = useState(0);

  const gravityDirRef = useRef<GravityDir>('down');
  const kadhaiSlotsRef = useRef<SweetType[]>([]);
  const heroChargeRef = useRef(0);
  const gauntletStonesRef = useRef<SweetType[]>([]);
  const bossStrikeTurnsRef = useRef(3);
  const cutInUidRef = useRef(1);
  const halfwayAnnouncedRef = useRef(false);
  const bossHalfAnnouncedRef = useRef(false);
  const lowMovesAnnouncedRef = useRef(false);
  const commUidRef = useRef(2);
  useEffect(() => {
    gravityDirRef.current = gravityDir;
  }, [gravityDir]);
  useEffect(() => {
    kadhaiSlotsRef.current = kadhaiSlots;
  }, [kadhaiSlots]);

  const brewedRecipe = useMemo(() => evaluateKadhaiRecipe(kadhaiSlots), [kadhaiSlots]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const beamsRef = useRef<BeamFlash[]>([]);
  const scorePopsRef = useRef<ScorePop[]>([]);
  const dragStartRef = useRef<{ row: number; col: number; x: number; y: number } | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const bannerUidRef = useRef(1);

  const pushHeroComm = useCallback((tag: string, text: string) => {
    const id = commUidRef.current++;
    setHeroComm({ id, tag, text });
  }, []);

  const initialJellyCount = useMemo(() => {
    const g = level.goals.find((x) => x.type === 'jelly');
    return g ? g.target : countRemainingJelly(board);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  // Reset entire level cleanly when level changes (and deploy Win Streak starting specials!)
  const resetLevel = useCallback(() => {
    rngRef.current = createRng(level.seed);
    let freshBoard = createBoard(level, level.seed);
    let spawnedStreak: Array<{ pos: Pos; special: SpecialType }> = [];
    if (canUseWinStreak && activeWinStreak > 0) {
      const streakRes = applyWinStreakBonuses(freshBoard, activeWinStreak, rngRef.current);
      freshBoard = streakRes.board;
      spawnedStreak = streakRes.spawned;
    }
    setBoard(freshBoard);
    setScore(0);
    setMovesLeft(level.moves);
    setTimeLeft(level.timeLimitSec ?? null);
    setCollected({ laddu: 0, jalebi: 0, gulab_jamun: 0, rasgulla: 0, barfi: 0, mysore_pak: 0 });
    setCherriesDropped(0);
    setBossHp(level.bossHp ?? 0);
    setSelected(null);
    setHintPair(null);
    setInvalidPair(null);
    setClearingSet(new Set());
    setIsBusy(false);
    setActiveBooster(null);
    setCombo(0);
    setBestCombo(0);
    setSugarRush(0);
    setHeroCharge(0);
    heroChargeRef.current = 0;
    setGauntletStones([]);
    gauntletStonesRef.current = [];
    setSnapFlash(false);
    setCutIn(null);
    setBossStrikeTurns(3);
    bossStrikeTurnsRef.current = 3;
    setBossStunned(false);
    setMatchesMade(0);
    setSpecialsCreated(0);
    setUndoStack([]);
    setUndosRemaining(MAX_UNDOS);
    setMascotMood(level.bossHp ? 'boss' : 'idle');
    setIsPaused(false);
    setShowTutorial(Boolean(level.tutorialKey));
    setPhase('playing');
    setWinCoinsEarned(0);
    setWinCoinsDoubled(false);
    setBlitzCreditsEarned(0);
    setIsNewBlitzBest(false);
    setShareStatus(null);
    setReviveUsed(false);
    setGravityDir('down');
    gravityDirRef.current = 'down';
    setGravityCharge(100);
    setTiltKick(0);
    setKadhaiSlots([]);
    kadhaiSlotsRef.current = [];
    setGuestOrder(createGuestOrder(0));
    setOrdersServed(0);
    particlesRef.current = [];
    shockwavesRef.current = [];
    beamsRef.current = [];
    scorePopsRef.current = [];
    halfwayAnnouncedRef.current = false;
    bossHalfAnnouncedRef.current = false;
    lowMovesAnnouncedRef.current = false;

    const launchText = level.isBlitz
      ? `60 seconds on the clock! Chain 5-relic cascades & unleash ${activeHero.codename}’s ${activeHero.ultimate.name}!`
      : spawnedStreak.length > 0
      ? `${activeWinStreak}-Win Streak! ${spawnedStreak.length} free special${spawnedStreak.length > 1 ? 's' : ''} deployed — ${movieAct.comms.start}`
      : level.isRelax || level.isKadhaiRush
      ? movieAct.comms.start
      : levelStory.dilemma;
    setHeroComm({
      id: commUidRef.current++,
      tag: level.isBlitz ? '60s BLITZ' : spawnedStreak.length > 0 ? `STREAK TIER ${streakInfo.tier}` : 'LIVE COMMS',
      text: launchText,
    });

    if (spawnedStreak.length > 0) {
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        const canvas = canvasRef.current;
        if (canvas) {
          const cellW = canvas.width / level.cols;
          const cellH = canvas.height / level.rows;
          for (const sp of spawnedStreak) {
            shockwavesRef.current.push({
              x: (sp.pos.col + 0.5) * cellW,
              y: (sp.pos.row + 0.5) * cellH,
              radius: 8,
              maxRadius: Math.max(cellW, cellH) * 1.45,
              color: sp.special === 'rainbow' ? '#FDE047' : sp.special === 'wrapped' ? '#E879F9' : '#22D3EE',
              life: 28,
              maxLife: 28,
            });
          }
        }
        const id = bannerUidRef.current++;
        setFloatingBanners((prev) => [
          ...prev.slice(-1),
          {
            id,
            text: `${activeWinStreak}× WIN STREAK!`,
            subtext: `${spawnedStreak.length} Free Special${spawnedStreak.length > 1 ? 's' : ''} Deployed`,
          },
        ]);
        window.setTimeout(() => {
          setFloatingBanners((prev) => prev.filter((b) => b.id !== id));
        }, 1450);
      }, 280);
    }
  }, [
    activeHero.codename,
    activeHero.ultimate.name,
    activeWinStreak,
    canUseWinStreak,
    level,
    levelStory.dilemma,
    movieAct.comms.start,
    streakInfo.tier,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    resetLevel();
    return () => {
      mountedRef.current = false;
    };
  }, [resetLevel]);

  // Hide banner ad during gameplay strictly
  useEffect(() => {
    AdService.showBanner(null);
  }, []);

  // 60fps AAA Canvas FX Renderer: Color-Matched Sparks, Star Flares, Repulsor Beams, Shockwaves & Score Popups
  useEffect(() => {
    let rafId = 0;
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Repulsor Laser Beams (Horizontal / Vertical neon flashes)
          const beams = beamsRef.current;
          for (let i = beams.length - 1; i >= 0; i--) {
            const b = beams[i];
            b.life--;
            if (b.life <= 0) {
              beams.splice(i, 1);
              continue;
            }
            const alpha = Math.max(0, b.life / b.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowBlur = 18;
            ctx.shadowColor = b.color;
            if (b.dir === 'h') {
              const h = 14 * alpha + 4;
              ctx.fillStyle = b.color;
              ctx.fillRect(0, b.posPx - h / 2, canvas.width, h);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, b.posPx - h * 0.22, canvas.width, h * 0.44);
            } else {
              const w = 14 * alpha + 4;
              ctx.fillStyle = b.color;
              ctx.fillRect(b.posPx - w / 2, 0, w, canvas.height);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(b.posPx - w * 0.22, 0, w * 0.44, canvas.height);
            }
            ctx.restore();
          }

          // 2. Expanding Shockwave Rings
          const rings = shockwavesRef.current;
          for (let i = rings.length - 1; i >= 0; i--) {
            const sw = rings[i];
            sw.life--;
            if (sw.life <= 0) {
              rings.splice(i, 1);
              continue;
            }
            const progress = 1 - sw.life / sw.maxLife;
            const r = sw.radius + (sw.maxRadius - sw.radius) * (1 - Math.pow(1 - progress, 3));
            const alpha = Math.max(0, 1 - progress);
            ctx.save();
            ctx.globalAlpha = alpha * 0.9;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 4.5 * alpha + 1;
            ctx.shadowBlur = 14;
            ctx.shadowColor = sw.color;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 3. Particles, Star Flares & Confetti
          const list = particlesRef.current;
          for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.confetti ? 0.11 : 0.18;
            p.vx *= 0.985;
            p.life--;
            if (p.life <= 0) {
              list.splice(i, 1);
              continue;
            }
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            if (p.confetti) {
              p.rot = (p.rot ?? 0) + (p.vrot ?? 0.1);
              ctx.translate(p.x, p.y);
              ctx.rotate(p.rot);
              ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else if (p.star) {
              const s = p.size * (0.5 + 0.65 * alpha);
              ctx.translate(p.x, p.y);
              ctx.shadowBlur = 10;
              ctx.shadowColor = p.color;
              ctx.beginPath();
              ctx.moveTo(0, -s);
              ctx.lineTo(s * 0.3, -s * 0.3);
              ctx.lineTo(s, 0);
              ctx.lineTo(s * 0.3, s * 0.3);
              ctx.lineTo(0, s);
              ctx.lineTo(-s * 0.3, s * 0.3);
              ctx.lineTo(-s, 0);
              ctx.lineTo(-s * 0.3, -s * 0.3);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 4. Crisp Floating Score Popups
          const pops = scorePopsRef.current;
          for (let i = pops.length - 1; i >= 0; i--) {
            const sp = pops[i];
            sp.y -= 1.05;
            sp.life--;
            if (sp.life <= 0) {
              pops.splice(i, 1);
              continue;
            }
            const alpha = Math.min(1, (sp.life / sp.maxLife) * 1.4);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '900 18px "Avenir Next", "Trebuchet MS", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.strokeText(sp.text, sp.x, sp.y);
            ctx.fillStyle = sp.color;
            ctx.fillText(sp.text, sp.x, sp.y);
            ctx.restore();
          }
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const spawnMatchFX = useCallback(
    (
      prevBoard: Cell[][],
      positions: Pos[],
      specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }>,
      pointsGained: number,
      comboCount: number
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cellW = canvas.width / level.cols;
      const cellH = canvas.height / level.rows;
      const fallbackPalette = ['#22D3EE', '#FB7185', '#818CF8', '#34D399', '#E879F9', '#FBBF24'];

      let sumX = 0;
      let sumY = 0;
      for (const p of positions) {
        const cx = (p.col + 0.5) * cellW;
        const cy = (p.row + 0.5) * cellH;
        sumX += cx;
        sumY += cy;
        const sweet = prevBoard[p.row]?.[p.col]?.sweet;
        const color = sweet ? RELIC_PARTICLE_COLORS[sweet] : fallbackPalette[Math.floor(Math.random() * fallbackPalette.length)];
        const count = comboCount >= 2 ? 9 : 7;
        for (let k = 0; k < count; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.6 + Math.random() * 4.8;
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.4,
            size: k % 3 === 0 ? 5.5 + Math.random() * 3.5 : 3 + Math.random() * 3.5,
            color: k % 4 === 0 ? '#FFFFFF' : color,
            star: k % 3 === 0,
            life: 24 + Math.floor(Math.random() * 14),
            maxLife: 38,
          });
        }
      }

      // Floating +points popup at cluster centroid
      if (positions.length > 0 && pointsGained > 0) {
        const cx = Math.max(46, Math.min(canvas.width - 46, sumX / positions.length));
        const cy = Math.max(28, Math.min(canvas.height - 16, sumY / positions.length));
        scorePopsRef.current.push({
          x: cx,
          y: cy,
          text: comboCount >= 2 ? `+${pointsGained} (${comboCount}×)` : `+${pointsGained}`,
          color: comboCount >= 3 ? '#FDE047' : comboCount === 2 ? '#67E8F9' : '#FFFFFF',
          life: 40,
          maxLife: 40,
        });
      }

      // Trigger laser beams & shockwaves for special blasts!
      for (const blast of specialBlasts) {
        const bx = (blast.col + 0.5) * cellW;
        const by = (blast.row + 0.5) * cellH;
        if (blast.type === 'striped_h') {
          beamsRef.current.push({ dir: 'h', posPx: by, color: '#22D3EE', life: 18, maxLife: 18 });
        } else if (blast.type === 'striped_v') {
          beamsRef.current.push({ dir: 'v', posPx: bx, color: '#22D3EE', life: 18, maxLife: 18 });
        } else if (blast.type === 'wrapped') {
          shockwavesRef.current.push({
            x: bx,
            y: by,
            radius: 10,
            maxRadius: Math.max(cellW, cellH) * 2.3,
            color: '#FBBF24',
            life: 24,
            maxLife: 24,
          });
        } else if (blast.type === 'rainbow' || blast.type === 'combo') {
          shockwavesRef.current.push({
            x: bx,
            y: by,
            radius: 12,
            maxRadius: canvas.width * 0.65,
            color: blast.type === 'rainbow' ? '#E879F9' : '#34D399',
            life: 28,
            maxLife: 28,
          });
        }
      }

      // Big combo shockwave flare!
      if (comboCount >= 3 && positions.length > 0) {
        shockwavesRef.current.push({
          x: sumX / positions.length,
          y: sumY / positions.length,
          radius: 14,
          maxRadius: Math.max(cellW, cellH) * 2.1,
          color: movieAct.accentHex,
          life: 22,
          maxLife: 22,
        });
      }
    },
    [level.cols, level.rows, movieAct.accentHex]
  );

  const spawnWinConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const colors = ['#22D3EE', '#FB7185', '#34D399', '#FBBF24', '#E879F9', '#FDE047'];
    for (let i = 0; i < 95; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 80,
        vx: (Math.random() - 0.5) * 4.2,
        vy: 1.5 + Math.random() * 3.8,
        size: 8 + Math.random() * 6,
        color: colors[i % colors.length],
        life: 85 + Math.floor(Math.random() * 45),
        maxLife: 130,
        confetti: true,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.25,
      });
    }
  }, []);

  const pushBanner = useCallback((text: string, subtext?: string) => {
    const id = bannerUidRef.current++;
    setFloatingBanners((prev) => [...prev.slice(-2), { id, text, subtext }]);
    window.setTimeout(() => {
      setFloatingBanners((prev) => prev.filter((b) => b.id !== id));
    }, 1150);
  }, []);

  // Countdown timer for Beat-the-Timer & 60s Infinity Blitz levels
  useEffect(() => {
    if (timeLeft === null || phase !== 'playing' || isPaused || showTutorial) return;
    if (timeLeft <= 0) {
      if (level.isBlitz) {
        const credits = Math.min(140, Math.max(25, Math.floor(score / 180)));
        const newBest = score > (save.stats.blitzHighScore ?? 0) && score > 0;
        setBlitzCreditsEarned(credits);
        setIsNewBlitzBest(newBest);
        setPhase('blitz_done');
        setMascotMood('dance');
        soundService.playWin();
        spawnWinConfetti();
        onRecordBlitzScore?.(score, credits, matchesMade, specialsCreated, bestCombo);
      } else {
        setPhase('out_of_moves');
        setMascotMood('gasp');
        soundService.playFail();
      }
      return;
    }
    const timer = window.setTimeout(() => {
      setTimeLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    bestCombo,
    isPaused,
    level.isBlitz,
    matchesMade,
    onRecordBlitzScore,
    phase,
    save.stats.blitzHighScore,
    score,
    showTutorial,
    spawnWinConfetti,
    specialsCreated,
    timeLeft,
  ]);

  // 5-second idle hint glow
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setHintPair(null);
    if (phase !== 'playing' || isBusy || isPaused || showTutorial) return;

    idleTimerRef.current = window.setTimeout(() => {
      const hint = findBestHint(board);
      if (hint && mountedRef.current) {
        setHintPair(hint);
      }
    }, 5000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [board, phase, isBusy, isPaused, showTutorial]);

  const computeStars = useCallback(
    (finalScore: number): number => {
      const [s1, s2, s3] = level.starThresholds;
      if (finalScore >= s3) return 3;
      if (finalScore >= s2) return 2;
      if (finalScore >= s1) return 1;
      return 1; // Completing all goals always grants at least 1 star
    },
    [level.starThresholds]
  );

  const checkGoalsCompleted = useCallback(
    (
      nextBoard: Cell[][],
      nextScore: number,
      nextCollected: Record<SweetType, number>,
      nextCherries: number,
      nextBossHp: number
    ): boolean => {
      if (level.isRelax || level.isKadhaiRush || level.isBlitz) return false;
      return level.goals.every((goal) => {
        if (goal.type === 'score') return nextScore >= goal.target;
        if (goal.type === 'jelly') return countRemainingJelly(nextBoard) === 0;
        if (goal.type === 'collect' && goal.sweet) return nextCollected[goal.sweet] >= goal.target;
        if (goal.type === 'cherry') return nextCherries >= goal.target;
        if (goal.type === 'boss') return nextBossHp <= 0;
        return false;
      });
    },
    [level.goals, level.isBlitz, level.isKadhaiRush, level.isRelax]
  );

  const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));

  const triggerCutIn = useCallback(
    (payload: Omit<CutInOverlayState, 'id'>) => {
      const id = cutInUidRef.current++;
      setCutIn({ id, ...payload });
      window.setTimeout(() => {
        setCutIn((cur) => (cur && cur.id === id ? null : cur));
      }, 900);
    },
    []
  );

  /** Core cascade resolution loop */
  const runResolutionLoop = useCallback(
    async (
      startingBoard: Cell[][],
      initialStep: ReturnType<typeof resolveCurrentMatches>,
      nextMovesLeft: number,
      swapHint?: [Pos, Pos],
      skipBossCounter = false
    ) => {
      let curBoard = startingBoard;
      let curScore = score;
      let curCollected = { ...collected };
      let curCherries = cherriesDropped;
      let curBossHp = bossHp;
      let curCombo = 0;
      let curBestCombo = bestCombo;
      let curMatches = matchesMade;
      let curSpecials = specialsCreated;
      let curRush = sugarRush;

      let step = initialStep ?? resolveCurrentMatches(curBoard, 1, swapHint);

      while (step && mountedRef.current) {
        curCombo++;
        if (curCombo > curBestCombo) curBestCombo = curCombo;
        curMatches++;
        curSpecials += step.specialsCreated;

        // Visual pop highlight & color-matched FX (sparks, beams, shockwaves, floating score pops)
        const clearKeys = new Set(step.clearedPositions.map((p) => `${p.row},${p.col}`));
        setClearingSet(clearKeys);
        spawnMatchFX(curBoard, step.clearedPositions, step.specialBlasts, step.pointsGained, curCombo);

        if (step.specialBlasts.some((b) => b.type === 'rainbow')) {
          soundService.playRainbow();
          setBoardShaking(true);
          window.setTimeout(() => setBoardShaking(false), 280);
        } else if (step.specialBlasts.length > 0 || curCombo >= 3) {
          soundService.playSpecialBlast();
          setBoardShaking(true);
          window.setTimeout(() => setBoardShaking(false), 260);
        } else {
          soundService.playMatch(curCombo);
        }

        // Praise text & Live Hero Comms on combos & big clears
        if (curCombo >= 2 || step.clearedPositions.length >= 6) {
          const idx = Math.min(t.praise.length - 1, Math.max(0, curCombo - 2));
          pushBanner(t.praise[idx], curCombo >= 2 ? `${curCombo}x Combo · +${step.pointsGained}` : `+${step.pointsGained}`);
          setMascotMood('cheer');
          if (curCombo >= 3) {
            pushHeroComm(`${curCombo}× COMBO`, movieAct.comms.combo);
          }
        }

        // Boss damage + Boss 50% enraged story comm
        if (level.bossHp && step.bossDamage > 0) {
          curBossHp = Math.max(0, curBossHp - step.bossDamage);
          setBossHp(curBossHp);
          setBossHit(true);
          soundService.playBossHit();
          window.setTimeout(() => setBossHit(false), 280);
          if (!bossHalfAnnouncedRef.current && curBossHp > 0 && curBossHp <= level.bossHp * 0.5) {
            bossHalfAnnouncedRef.current = true;
            pushHeroComm('BOSS PHASE 2', movieAct.comms.bossHalf);
          }
        }

        curScore += step.pointsGained;
        // Feed dominant matched relic essence into Stark Arc Forge
        let dominantSweet: SweetType | null = null;
        let dominantCount = 0;
        for (const s of Object.keys(step.clearedSweets) as SweetType[]) {
          const cnt = step.clearedSweets[s];
          curCollected[s] += cnt;
          if (cnt > dominantCount) {
            dominantCount = cnt;
            dominantSweet = s;
          }
        }
        if (dominantSweet && kadhaiSlotsRef.current.length < 3) {
          const nextSlots = [...kadhaiSlotsRef.current, dominantSweet].slice(0, 3);
          kadhaiSlotsRef.current = nextSlots;
          setKadhaiSlots(nextSlots);
          if (nextSlots.length === 3) {
            const ready = evaluateKadhaiRecipe(nextSlots);
            if (ready) {
              pushBanner(`${KADHAI_RECIPES[ready].name} Ready!`, 'Tap Fire Overload in Arc Forge');
            }
          }
        }

        // Charge Doomsday Surge meter, Playable Avenger Ultimate Gauge, Infinity Gauntlet Stones & Gravity Tilt
        curRush = Math.min(100, curRush + 12 + curCombo * 8 + step.specialsCreated * 14);
        const prevHeroCharge = heroChargeRef.current;
        const nextHeroCharge = Math.min(100, prevHeroCharge + 14 + curCombo * 6 + step.specialsCreated * 10);
        heroChargeRef.current = nextHeroCharge;
        setHeroCharge(nextHeroCharge);
        if (prevHeroCharge < 100 && nextHeroCharge >= 100) {
          soundService.playUltimateReady();
          pushBanner(`${activeHero.codename} READY!`, `Tap UNLEASH · ${activeHero.ultimate.name}`);
          pushHeroComm('ULTIMATE 100%', `${activeHero.ultimate.name} is fully charged — unleash it now!`);
        }

        // Socket each newly matched Relic essence into the Infinity Gauntlet!
        const prevStoneCount = gauntletStonesRef.current.length;
        if (prevStoneCount < gauntletPalette.length) {
          const nextStoneSet = new Set<SweetType>(gauntletStonesRef.current);
          for (const s of gauntletPalette) {
            if (step.clearedSweets[s] > 0) nextStoneSet.add(s);
          }
          if (nextStoneSet.size > prevStoneCount) {
            const updatedStones = Array.from(nextStoneSet);
            gauntletStonesRef.current = updatedStones;
            setGauntletStones(updatedStones);
            if (updatedStones.length >= gauntletPalette.length) {
              soundService.playUltimateReady();
              pushBanner('GAUNTLET FULL!', 'Tap SNAP! (S) to Disintegrate Half the Board!');
              pushHeroComm('INFINITY SNAP READY', 'All Infinity Relics locked in — unleash the SNAP!');
            }
          }
        }

        setGravityCharge((prev) => Math.min(100, prev + 35));

        setScore(curScore);
        setCollected({ ...curCollected });
        setCombo(curCombo);
        setBestCombo(curBestCombo);
        setMatchesMade(curMatches);
        setSpecialsCreated(curSpecials);
        setSugarRush(curRush);

        await wait(205);
        if (!mountedRef.current) return;

        // Commit cleared board, then apply 4-way gravity & refill
        curBoard = step.board;
        setClearingSet(new Set());
        setBoard(curBoard);

        await wait(65);
        if (!mountedRef.current) return;

        const grav = applyGravityAndRefill(curBoard, level, rngRef.current, gravityDirRef.current);
        curBoard = grav.board;
        if (grav.cherriesDropped > 0) {
          curCherries += grav.cherriesDropped;
          setCherriesDropped(curCherries);
          soundService.playCoin();
          pushBanner('Tesseract Extracted!', `+${grav.cherriesDropped}`);
        }
        setBoard(curBoard);

        await wait(215);
        if (!mountedRef.current) return;

        // Trigger Doomsday Surge bonus special at 100%!
        if (curRush >= 100) {
          const rushRes = spawnSugarRushSpecial(curBoard);
          if (rushRes.pos) {
            curBoard = rushRes.board;
            curRush = 0;
            setSugarRush(0);
            setBoard(curBoard);
            pushBanner(t.sugarRush, 'Free Power Relic!');
            soundService.playRainbow();
          }
        }

        // Next cascade iteration
        const mult = 1 + curCombo * 0.45;
        step = resolveCurrentMatches(curBoard, mult);
      }

      if (!mountedRef.current) return;

      // Auto-shuffle if no moves remain
      if (!findBestHint(curBoard)) {
        setShuffleToast(true);
        await wait(500);
        curBoard = shuffleBoard(curBoard, level, rngRef.current);
        setBoard(curBoard);
        await wait(450);
        setShuffleToast(false);
      }

      // Check halfway target milestone for live Hero Comms encouragement!
      if (!halfwayAnnouncedRef.current && !level.isRelax && !level.isKadhaiRush && level.goals.length > 0) {
        const goalPcts = level.goals.map((g) => {
          if (g.type === 'score') return curScore / Math.max(1, g.target);
          if (g.type === 'jelly') return (initialJellyCount - countRemainingJelly(curBoard)) / Math.max(1, initialJellyCount);
          if (g.type === 'collect' && g.sweet) return curCollected[g.sweet] / Math.max(1, g.target);
          if (g.type === 'cherry') return curCherries / Math.max(1, g.target);
          if (g.type === 'boss' && level.bossHp) return (level.bossHp - curBossHp) / Math.max(1, level.bossHp);
          return 0;
        });
        const avgPct = goalPcts.reduce((a, b) => a + b, 0) / goalPcts.length;
        if (avgPct >= 0.5 && avgPct < 1) {
          halfwayAnnouncedRef.current = true;
          pushHeroComm('50% TARGET', movieAct.comms.halfway);
        }
      }

      // Check win / lose
      const won = checkGoalsCompleted(curBoard, curScore, curCollected, curCherries, curBossHp);
      if (won) {
        // Bonus points for leftover moves + Win Streak bonus credits!
        const moveBonus = nextMovesLeft * 120;
        const finalScore = curScore + moveBonus;
        const stars = computeStars(finalScore);
        const streakBonusCoins = activeWinStreak >= 3 ? 30 : activeWinStreak >= 1 ? 15 : 0;
        const coinsEarned = 35 + stars * 25 + (level.bossHp ? 80 : 0) + (level.isDaily ? 60 : 0) + streakBonusCoins;
        setScore(finalScore);
        setWinCoinsEarned(coinsEarned);
        setPhase('won');
        setMascotMood('dance');
        pushHeroComm('VICTORY', movieAct.comms.victory);
        soundService.playWin();
        spawnWinConfetti();
        onLevelComplete({
          level,
          score: finalScore,
          stars,
          coinsEarned,
          matchesMade: curMatches,
          specialsCreated: curSpecials,
          bestCombo: curBestCombo,
          bossDefeated: Boolean(level.bossHp && curBossHp <= 0),
          collectedSweets: curCollected,
        });
      } else if (!level.isRelax && !level.isBlitz && nextMovesLeft <= 0) {
        setPhase('out_of_moves');
        setMascotMood('gasp');
        soundService.playFail();
      } else {
        // LIVE BOSS COUNTERATTACK & STUN MECHANIC!
        if (level.bossHp && curBossHp > 0 && !skipBossCounter) {
          if (curCombo >= 3) {
            // Big combo stuns the Boss and delays their sabotage strike!
            const delayed = Math.min(3, bossStrikeTurnsRef.current + 1);
            bossStrikeTurnsRef.current = delayed;
            setBossStrikeTurns(delayed);
            setBossStunned(true);
            pushBanner('BOSS STUNNED!', '3×+ Combo delayed Doom Strike!');
          } else {
            setBossStunned(false);
            const nextCd = bossStrikeTurnsRef.current - 1;
            if (nextCd <= 0) {
              const strike = applyBossCounterattack(curBoard, rngRef.current);
              if (strike.corrupted.length > 0) {
                curBoard = strike.board;
                setBoard(curBoard);
                soundService.playBossStrike();
                setBoardShaking(true);
                window.setTimeout(() => setBoardShaking(false), 320);
                const canvas = canvasRef.current;
                if (canvas) {
                  const cellW = canvas.width / level.cols;
                  const cellH = canvas.height / level.rows;
                  for (const cp of strike.corrupted) {
                    shockwavesRef.current.push({
                      x: (cp.col + 0.5) * cellW,
                      y: (cp.row + 0.5) * cellH,
                      radius: 8,
                      maxRadius: Math.max(cellW, cellH) * 1.8,
                      color: strike.kind === 'ice' ? '#38BDF8' : '#FB7185',
                      life: 26,
                      maxLife: 26,
                    });
                  }
                }
                pushBanner(
                  'DOOM STRIKE!',
                  strike.kind === 'ice'
                    ? `${level.bossName ?? 'Villain'} froze 2 tiles!`
                    : `${level.bossName ?? 'Villain'} deployed 2 Doom Shields!`
                );
                pushHeroComm(
                  'INCOMING SABOTAGE',
                  `${level.bossName ?? 'The villain'} counterattacked! Land a 3× combo or Ultimate to STUN them!`
                );
              }
              bossStrikeTurnsRef.current = 3;
              setBossStrikeTurns(3);
            } else {
              bossStrikeTurnsRef.current = nextCd;
              setBossStrikeTurns(nextCd);
            }
          }
        }

        if (!level.isRelax && !level.isBlitz && nextMovesLeft <= 5) {
          setMascotMood('gasp');
          if (!lowMovesAnnouncedRef.current) {
            lowMovesAnnouncedRef.current = true;
            pushHeroComm('FINAL TURNS', movieAct.comms.lowMoves);
          }
        } else if (curCombo < 2) {
          setMascotMood(level.bossHp ? 'boss' : 'idle');
        }
      }

      setCombo(0);
      setIsBusy(false);
    },
    [
      activeHero.codename,
      activeHero.ultimate.name,
      activeWinStreak,
      bestCombo,
      bossHp,
      checkGoalsCompleted,
      cherriesDropped,
      collected,
      computeStars,
      gauntletPalette,
      initialJellyCount,
      level,
      matchesMade,
      movieAct.comms.bossHalf,
      movieAct.comms.combo,
      movieAct.comms.halfway,
      movieAct.comms.lowMoves,
      movieAct.comms.victory,
      onLevelComplete,
      pushBanner,
      pushHeroComm,
      score,
      spawnMatchFX,
      spawnWinConfetti,
      specialsCreated,
      sugarRush,
      t.praise,
      t.sugarRush,
    ]
  );

  const attemptSwap = useCallback(
    async (a: Pos, b: Pos) => {
      if (isBusy || phase !== 'playing' || isPaused || showTutorial) return;
      if (!areAdjacent(a, b)) return;
      const cellA = board[a.row]?.[a.col];
      const cellB = board[b.row]?.[b.col];
      if (!cellA || !cellB || !isCellMovable(cellA) || !isCellMovable(cellB)) {
        soundService.playInvalid();
        setInvalidPair([a, b]);
        window.setTimeout(() => setInvalidPair(null), 260);
        return;
      }

      setSelected(null);
      setHintPair(null);

      if (!isValidSwap(board, a, b)) {
        soundService.playInvalid();
        setInvalidPair([a, b]);
        window.setTimeout(() => setInvalidPair(null), 260);
        return;
      }

      // Save Undo snapshot before executing move
      setUndoStack((prev) => [
        ...prev.slice(-(MAX_UNDOS - 1)),
        {
          board: cloneBoard(board),
          score,
          movesLeft,
          collected: { ...collected },
          cherriesDropped,
          bossHp,
        },
      ]);

      setIsBusy(true);
      soundService.playSwap();

      const nextMoves = level.isRelax || level.isBlitz ? movesLeft : Math.max(0, movesLeft - 1);
      setMovesLeft(nextMoves);

      // Check Special+Special or Rainbow+Sweet swap first
      const specialResult = resolveSpecialSwap(board, a, b, 1.35);
      if (specialResult) {
        await runResolutionLoop(board, specialResult, nextMoves, [a, b]);
        return;
      }

      const swapped = cloneBoard(board);
      swapCellContents(swapped, a, b);
      setBoard(swapped);
      await wait(140);
      await runResolutionLoop(swapped, null, nextMoves, [a, b]);
    },
    [
      board,
      bossHp,
      cherriesDropped,
      collected,
      isBusy,
      isPaused,
      level.isBlitz,
      level.isRelax,
      movesLeft,
      phase,
      runResolutionLoop,
      score,
      showTutorial,
    ]
  );

  const triggerTargetedBooster = useCallback(
    async (booster: BoosterType, target?: Pos) => {
      if (isBusy || phase !== 'playing') return;
      if (!onConsumeBooster(booster)) {
        soundService.playInvalid();
        setActiveBooster(null);
        return;
      }
      setActiveBooster(null);
      setSelected(null);

      if (booster === 'extra_moves') {
        setMovesLeft((m) => m + 5);
        soundService.playCoin();
        pushBanner('+5 Turns!', 'Hold the line!');
        return;
      }

      if (booster === 'shuffle') {
        setIsBusy(true);
        const res = applyBoosterEffect(board, 'shuffle', level);
        setBoard(res.board);
        soundService.playSwap();
        pushBanner('Grid Scrambled!', 'Fresh tactical matrix');
        await wait(240);
        setIsBusy(false);
        return;
      }

      setIsBusy(true);
      const res = applyBoosterEffect(board, booster, level, target);
      await runResolutionLoop(board, res, movesLeft);
    },
    [board, isBusy, level, movesLeft, onConsumeBooster, phase, pushBanner, runResolutionLoop]
  );

  // Signature Mechanic 1: 4-Way Thali Gravity Shift (zero-move board physics tilt!)
  const handleTiltThali = useCallback(
    async (delta: -1 | 1) => {
      if (isBusy || phase !== 'playing' || isPaused || showTutorial) return;
      if (!level.isKadhaiRush && gravityCharge < 100) return;

      const nextDir = rotateGravityDir(gravityDirRef.current, delta);
      gravityDirRef.current = nextDir;
      setGravityDir(nextDir);
      if (!level.isKadhaiRush) {
        setGravityCharge(0);
      }
      setSelected(null);
      setHintPair(null);
      setTiltKick(delta);
      window.setTimeout(() => setTiltKick(0), 320);

      soundService.playThaliTilt();
      const dirNames: Record<GravityDir, string> = {
        down: 'South ↓',
        right: 'East →',
        up: 'North ↑',
        left: 'West ←',
      };
      pushBanner(`Gravity Shifted ${dirNames[nextDir]}`, 'Zero-Turn Physics Shift!');

      setIsBusy(true);
      await wait(140);
      const shifted = applyGravityAndRefill(board, level, rngRef.current, nextDir);
      setBoard(shifted.board);
      if (shifted.cherriesDropped > 0) {
        setCherriesDropped((prev) => prev + shifted.cherriesDropped);
        soundService.playCoin();
      }
      await wait(220);
      await runResolutionLoop(shifted.board, null, movesLeft);
    },
    [board, gravityCharge, isBusy, isPaused, level, movesLeft, phase, pushBanner, runResolutionLoop, showTutorial]
  );

  // Signature Mechanic 2: Fire Charged Stark Arc Forge Overload!
  const handleServeKadhaiDish = useCallback(async () => {
    if (isBusy || phase !== 'playing' || isPaused || showTutorial || !brewedRecipe) return;

    const recipe = KADHAI_RECIPES[brewedRecipe];
    const currentSlots = [...kadhaiSlotsRef.current];
    kadhaiSlotsRef.current = [];
    setKadhaiSlots([]);
    setSelected(null);
    setHintPair(null);
    setIsBusy(true);

    soundService.playKadhaiSizzle();
    setBoardShaking(true);
    window.setTimeout(() => setBoardShaking(false), 300);

    const { step, bonusMoves } = applyKadhaiRecipeEffect(board, brewedRecipe, rngRef.current);
    let addedMoves = bonusMoves;

    // Check Doomsday Reactor Rush directive completion!
    if (level.isKadhaiRush && doesFusionSatisfyOrder(currentSlots, brewedRecipe, guestOrder)) {
      const nextCount = ordersServed + 1;
      setOrdersServed(nextCount);
      onRecordKadhaiOrders?.(nextCount);
      onBonusCoins(guestOrder.rewardCoins);
      addedMoves += guestOrder.rewardMoves;
      pushBanner(
        `${guestOrder.guestName} Cleared!`,
        `+${guestOrder.rewardCoins} Credits · +${guestOrder.rewardMoves} Turns`
      );
      spawnWinConfetti();
      setGuestOrder(createGuestOrder(nextCount));
    } else {
      pushBanner(
        `${recipe.name}!`,
        addedMoves > 0 ? `${recipe.badgeText} · +${addedMoves} Turns` : recipe.badgeText
      );
    }

    const updatedMoves = level.isRelax ? movesLeft : movesLeft + addedMoves;
    if (addedMoves > 0 && !level.isRelax) {
      setMovesLeft(updatedMoves);
      if (timeLeft !== null) setTimeLeft((prev) => (prev !== null ? prev + addedMoves * 5 : null));
    }

    setMascotMood('dance');
    await runResolutionLoop(board, step, updatedMoves);
  }, [
    board,
    brewedRecipe,
    guestOrder,
    isBusy,
    isPaused,
    level.isKadhaiRush,
    level.isRelax,
    movesLeft,
    onBonusCoins,
    onRecordKadhaiOrders,
    ordersServed,
    phase,
    pushBanner,
    runResolutionLoop,
    showTutorial,
    spawnWinConfetti,
    timeLeft,
  ]);

  // Signature Mechanic 3: Unleash Active Avenger's Ultimate Superpower at 100% Charge!
  const handleUnleashHeroUltimate = useCallback(async () => {
    if (isBusy || phase !== 'playing' || isPaused || showTutorial || heroChargeRef.current < 100) return;

    heroChargeRef.current = 0;
    setHeroCharge(0);
    setSelected(null);
    setHintPair(null);
    setIsBusy(true);

    // Trigger 880ms Comic-Book Movie Cut-In Slash!
    triggerCutIn({
      title: activeHero.ultimate.name.toUpperCase(),
      subtitle: activeHero.ultimate.shortDesc,
      heroName: activeHero.codename,
      posterUrl: activeHero.posterUrl,
      accentHex: activeHero.ultimate.colorHex,
      gradientClass: activeHero.ultimate.gradientClass,
    });

    soundService.playHeroUltimate();
    await wait(340);
    if (!mountedRef.current) return;

    setBoardShaking(true);
    window.setTimeout(() => setBoardShaking(false), 380);

    // Ultimates stun any active Boss!
    if (level.bossHp && bossHp > 0) {
      bossStrikeTurnsRef.current = 3;
      setBossStrikeTurns(3);
      setBossStunned(true);
    }

    const res = applyHeroUltimate(board, activeHero.id, level, rngRef.current);

    // Fire Hero-Colored Laser Beams & Shockwaves onto the 60fps canvas!
    const canvas = canvasRef.current;
    if (canvas) {
      const cellW = canvas.width / level.cols;
      const cellH = canvas.height / level.rows;
      for (const beam of res.beamLines) {
        beamsRef.current.push({
          dir: beam.dir,
          posPx: beam.dir === 'h' ? (beam.index + 0.5) * cellH : (beam.index + 0.5) * cellW,
          color: beam.color,
          life: 28,
          maxLife: 28,
        });
      }
      for (const sp of res.shockPoints) {
        shockwavesRef.current.push({
          x: (sp.pos.col + 0.5) * cellW,
          y: (sp.pos.row + 0.5) * cellH,
          radius: 10,
          maxRadius: Math.max(cellW, cellH) * 2.3,
          color: sp.color,
          life: 30,
          maxLife: 30,
        });
      }
    }

    const updatedMoves =
      res.bonusMoves > 0 && !level.isRelax && !level.isBlitz ? movesLeft + res.bonusMoves : movesLeft;
    if (res.bonusMoves > 0 && !level.isRelax && !level.isBlitz) {
      setMovesLeft(updatedMoves);
    }
    if (res.bonusTimeSec > 0 && timeLeft !== null) {
      setTimeLeft((prev) => (prev !== null ? prev + res.bonusTimeSec : null));
    }

    pushBanner(res.bannerTitle, res.bannerSub);
    pushHeroComm('ULTIMATE UNLEASHED', `${activeHero.codename} fired ${activeHero.ultimate.name}!`);
    setMascotMood('dance');

    await runResolutionLoop(board, res.step, updatedMoves, undefined, true);
  }, [
    activeHero.codename,
    activeHero.id,
    activeHero.posterUrl,
    activeHero.ultimate.colorHex,
    activeHero.ultimate.gradientClass,
    activeHero.ultimate.name,
    activeHero.ultimate.shortDesc,
    board,
    bossHp,
    isBusy,
    isPaused,
    level,
    movesLeft,
    phase,
    pushBanner,
    pushHeroComm,
    runResolutionLoop,
    showTutorial,
    timeLeft,
    triggerCutIn,
  ]);

  // Signature Mechanic 4: THE INFINITY SNAP (Disintegrate 50% of the Board into Golden Cosmic Dust!)
  const handleTriggerInfinitySnap = useCallback(async () => {
    if (
      isBusy ||
      phase !== 'playing' ||
      isPaused ||
      showTutorial ||
      gauntletStonesRef.current.length < gauntletPalette.length
    ) {
      return;
    }

    gauntletStonesRef.current = [];
    setGauntletStones([]);
    setSelected(null);
    setHintPair(null);
    setIsBusy(true);

    soundService.playInfinitySnap();
    setSnapFlash(true);
    window.setTimeout(() => {
      if (mountedRef.current) setSnapFlash(false);
    }, 800);

    triggerCutIn({
      title: 'INFINITY SNAP!',
      subtitle: '50% of the Grid Disintegrated · 2× Cosmic Surge!',
      heroName: activeHero.codename,
      posterUrl: activeHero.posterUrl,
      accentHex: '#FBBF24',
      gradientClass: 'from-amber-300 via-yellow-400 to-fuchsia-400',
    });

    await wait(360);
    if (!mountedRef.current) return;

    setBoardShaking(true);
    window.setTimeout(() => setBoardShaking(false), 420);

    if (level.bossHp && bossHp > 0) {
      bossStrikeTurnsRef.current = 3;
      setBossStrikeTurns(3);
      setBossStunned(true);
    }

    const { step, dustedPositions } = applyInfinitySnap(board, level, rngRef.current);

    // Golden Cosmic Dust Disintegration Particles drifting upward!
    const canvas = canvasRef.current;
    if (canvas) {
      const cellW = canvas.width / level.cols;
      const cellH = canvas.height / level.rows;
      const dustColors = ['#FDE047', '#FBBF24', '#F59E0B', '#FEF08A', '#E879F9', '#FFFFFF'];
      shockwavesRef.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 14,
        maxRadius: canvas.width * 0.85,
        color: '#FDE047',
        life: 34,
        maxLife: 34,
      });
      for (const p of dustedPositions) {
        const cx = (p.col + 0.5) * cellW;
        const cy = (p.row + 0.5) * cellH;
        for (let k = 0; k < 5; k++) {
          particlesRef.current.push({
            x: cx + (Math.random() - 0.5) * cellW * 0.7,
            y: cy + (Math.random() - 0.5) * cellH * 0.7,
            vx: 0.7 + Math.random() * 2.6,
            vy: -1.8 - Math.random() * 3.4,
            size: 3 + Math.random() * 4.5,
            color: dustColors[Math.floor(Math.random() * dustColors.length)],
            star: k % 2 === 0,
            life: 34 + Math.floor(Math.random() * 22),
            maxLife: 56,
          });
        }
      }
    }

    pushBanner('INFINITY SNAP!', 'Half the Board Turned to Dust!');
    pushHeroComm('COSMIC SNAP', 'I am inevitable — half of Doomsday’s grid just vanished!');
    setMascotMood('dance');

    await runResolutionLoop(board, step, movesLeft, undefined, true);
  }, [
    activeHero.codename,
    activeHero.posterUrl,
    board,
    bossHp,
    gauntletPalette.length,
    isBusy,
    isPaused,
    level,
    movesLeft,
    phase,
    pushBanner,
    pushHeroComm,
    runResolutionLoop,
    showTutorial,
    triggerCutIn,
  ]);

  // Signature Mechanic 5: Live In-Battle Avenger Tag-Team Switcher!
  const handleTagTeamSwitch = useCallback(() => {
    if (isBusy || phase !== 'playing' || availableHeroes.length <= 1) return;
    const curIdx = availableHeroes.findIndex((h) => h.id === activeHero.id);
    const nextHero = availableHeroes[(curIdx + 1) % availableHeroes.length];
    soundService.playHeroTag();
    setBattleHeroId(nextHero.id);
    setHeroPortraitFailed(false);
    if (!level.isBlitz && save.unlockedLevel >= nextHero.unlockLevel) {
      onSelectHero?.(nextHero.id);
    }
    pushHeroComm('TAG-TEAM', `${nextHero.codename} tagging in — Ultimate: ${nextHero.ultimate.name}!`);
  }, [
    activeHero.id,
    availableHeroes,
    isBusy,
    level.isBlitz,
    onSelectHero,
    phase,
    pushHeroComm,
    save.unlockedLevel,
  ]);

  const handleCellClick = (r: number, c: number) => {
    if (isBusy || phase !== 'playing' || isPaused || showTutorial) return;
    setCursor({ row: r, col: c });

    if (activeBooster === 'hammer' || activeBooster === 'color_bomb') {
      triggerTargetedBooster(activeBooster, { row: r, col: c });
      return;
    }

    const cell = board[r][c];
    if (!isCellMovable(cell)) {
      soundService.playInvalid();
      return;
    }

    if (!selected) {
      soundService.playTap();
      setSelected({ row: r, col: c });
      return;
    }

    if (selected.row === r && selected.col === c) {
      setSelected(null);
      return;
    }

    if (areAdjacent(selected, { row: r, col: c })) {
      attemptSwap(selected, { row: r, col: c });
    } else {
      soundService.playTap();
      setSelected({ row: r, col: c });
    }
  };

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (isBusy || phase !== 'playing' || isPaused || showTutorial) return;
    if (activeBooster === 'hammer' || activeBooster === 'color_bomb') return;
    dragStartRef.current = { row: r, col: c, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start || isBusy || phase !== 'playing') return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const threshold = 22;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    dragStartRef.current = null;
    let target: Pos;
    if (Math.abs(dx) > Math.abs(dy)) {
      target = { row: start.row, col: start.col + (dx > 0 ? 1 : -1) };
    } else {
      target = { row: start.row + (dy > 0 ? 1 : -1), col: start.col };
    }
    if (target.row >= 0 && target.row < level.rows && target.col >= 0 && target.col < level.cols) {
      attemptSwap({ row: start.row, col: start.col }, target);
    }
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  // Keyboard support for desktop players
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'playing' || showTutorial) return;
      if (e.key === 'Escape') {
        setIsPaused((p) => !p);
        return;
      }
      if (isPaused || isBusy) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const dr = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        const dc = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        if (selected) {
          const target = { row: selected.row + dr, col: selected.col + dc };
          if (target.row >= 0 && target.row < level.rows && target.col >= 0 && target.col < level.cols) {
            attemptSwap(selected, target);
            setCursor(target);
          }
        } else {
          setCursor((prev) => ({
            row: Math.max(0, Math.min(level.rows - 1, prev.row + dr)),
            col: Math.max(0, Math.min(level.cols - 1, prev.col + dc)),
          }));
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCellClick(cursor.row, cursor.col);
      } else if ((e.key === 'z' || e.key === 'Z') && undoStack.length > 0 && undosRemaining > 0) {
        handleUndo();
      } else if (e.key === 'q' || e.key === 'Q') {
        handleTiltThali(-1);
      } else if (e.key === 'e' || e.key === 'E') {
        handleTiltThali(1);
      } else if ((e.key === 'f' || e.key === 'F') && brewedRecipe) {
        handleServeKadhaiDish();
      } else if ((e.key === 'u' || e.key === 'U') && heroCharge >= 100) {
        handleUnleashHeroUltimate();
      } else if ((e.key === 's' || e.key === 'S') && gauntletStones.length >= gauntletPalette.length) {
        handleTriggerInfinitySnap();
      } else if ((e.key === 't' || e.key === 'T') && availableHeroes.length > 1) {
        handleTagTeamSwitch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isPaused, isBusy, showTutorial, selected, cursor, level.rows, level.cols, undoStack.length, undosRemaining, brewedRecipe, gravityCharge, heroCharge, gauntletStones.length, gauntletPalette.length, availableHeroes.length]);

  const handleUndo = () => {
    if (isBusy || undoStack.length === 0 || undosRemaining <= 0) return;
    const snap = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setUndosRemaining((u) => u - 1);
    setBoard(snap.board);
    setScore(snap.score);
    setMovesLeft(snap.movesLeft);
    setCollected(snap.collected);
    setCherriesDropped(snap.cherriesDropped);
    setBossHp(snap.bossHp);
    setSelected(null);
    soundService.playTap();
  };

  // Rewarded ad handlers (always user-initiated, only when online & ready)
  const canShowRewarded = isOnline && AdService.isAdReady();

  const handleWatchAdFor5Moves = async () => {
    setAdBusy(true);
    const ok = await AdService.showRewarded('out_of_moves_5');
    setAdBusy(false);
    if (ok) {
      setMovesLeft((m) => m + 5);
      if (timeLeft !== null && timeLeft <= 0) setTimeLeft(25);
      setPhase('playing');
      setMascotMood('cheer');
      soundService.playCoin();
    }
  };

  const handleBuy5MovesWithCoins = () => {
    if (onSpendCoins(90)) {
      setMovesLeft((m) => m + 5);
      if (timeLeft !== null && timeLeft <= 0) setTimeLeft(25);
      setPhase('playing');
      setMascotMood('cheer');
      soundService.playCoin();
    }
  };

  const handleGiveUpToFail = () => {
    setPhase('failed');
    setMascotMood('sad');
    onLevelFail(level, score);
  };

  const handleWatchAdToRevive = async () => {
    setAdBusy(true);
    const ok = await AdService.showRewarded('fail_revive');
    setAdBusy(false);
    if (ok) {
      setReviveUsed(true);
      setMovesLeft(5);
      if (timeLeft !== null) setTimeLeft(30);
      setPhase('playing');
      setMascotMood('cheer');
      soundService.playCoin();
    }
  };

  const handleWatchAdForFreeBooster = async () => {
    setAdBusy(true);
    const ok = await AdService.showRewarded('booster_bar_free');
    setAdBusy(false);
    if (ok) {
      const pool: BoosterType[] = ['hammer', 'shuffle', 'color_bomb', 'extra_moves'];
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const labels: Record<BoosterType, string> = {
        hammer: 'Mjolnir',
        shuffle: 'Shuffle',
        color_bomb: 'Infinity Orb',
        extra_moves: '+5 Turns',
      };
      onGrantBooster(picked, 1);
      soundService.playCoin();
      pushBanner('Supply Drop!', `+1 ${labels[picked]}`);
    }
  };

  const handleWatchAdFor2xCoins = async () => {
    if (winCoinsDoubled) return;
    setAdBusy(true);
    const ok = await AdService.showRewarded('win_2x_coins');
    setAdBusy(false);
    if (ok) {
      setWinCoinsDoubled(true);
      onBonusCoins(winCoinsEarned);
      soundService.playCoin();
    }
  };

  const handleShareVictoryPoster = async (isBlitzMode: boolean) => {
    soundService.playTap();
    const outcome = await shareOrDownloadVictoryCard({
      playerName: save.playerName || 'Avenger Agent',
      missionTitle: isBlitzMode
        ? '60s Infinity Blitz'
        : level.isDaily
        ? level.name
        : `Mission ${level.id}: ${level.name}`,
      score,
      stars: isBlitzMode ? (score >= 14000 ? 3 : score >= 7500 ? 2 : 1) : computeStars(score),
      bestCombo: Math.max(1, bestCombo),
      winStreak: save.winStreak ?? 0,
      heroCodename: activeHero.codename,
      heroAccentHex: activeHero.ultimate.colorHex,
      isBlitz: isBlitzMode,
    });
    setShareStatus(outcome === 'shared' ? 'Victory Poster Shared!' : 'Poster Saved + Challenge Copied!');
    window.setTimeout(() => {
      if (mountedRef.current) setShareStatus(null);
    }, 3200);
  };

  const remainingJelly = countRemainingJelly(board);
  const starPct = Math.min(100, Math.round((score / Math.max(1, level.starThresholds[2])) * 100));
  const earnedStarsSoFar =
    score >= level.starThresholds[2]
      ? 3
      : score >= level.starThresholds[1]
      ? 2
      : score >= level.starThresholds[0]
      ? 1
      : 0;

  const boosterItems: Array<{ id: BoosterType; label: string; icon: React.ReactNode; needsTarget: boolean }> = [
    { id: 'hammer', label: 'Mjolnir', icon: <Hammer className="w-4 h-4" />, needsTarget: true },
    { id: 'shuffle', label: 'Shuffle', icon: <Shuffle className="w-4 h-4" />, needsTarget: false },
    { id: 'extra_moves', label: '+5 Turns', icon: <Plus className="w-4 h-4" />, needsTarget: false },
    { id: 'color_bomb', label: 'Infinity', icon: <Sparkles className="w-4 h-4" />, needsTarget: true },
  ];

  const dropAnimClass =
    gravityDir === 'right'
      ? 'animate-sweet-drop-right'
      : gravityDir === 'left'
      ? 'animate-sweet-drop-left'
      : gravityDir === 'up'
      ? 'animate-sweet-drop-up'
      : 'animate-sweet-drop-down';

  // Dynamic 3D platter perspective angle reacts gently to current gravity & tilt impulse
  const thaliTransformStyle: React.CSSProperties | undefined = isThali3D
    ? {
        transform: `rotateX(${gravityDir === 'up' ? 5 : gravityDir === 'down' ? 12 : 9}deg) rotateY(${
          gravityDir === 'right' ? 4.5 : gravityDir === 'left' ? -4.5 : tiltKick * 5
        }deg) rotateZ(${tiltKick * 2.5}deg)`,
      }
    : undefined;

  return (
    <div
      className={`relative min-h-[100dvh] w-full flex flex-col overflow-x-clip transition-colors duration-500 bg-gradient-to-b ${
        isThali3D ? movieAct.atmosphere.arenaGradient : theme.bgClass
      } text-slate-100`}
    >
      {/* Vibrant Act-Specific Cosmic Cinema Atmosphere Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {!posterFailed && (
          <img
            src={movieAct.posterUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setPosterFailed(true)}
            className="h-full w-full object-cover opacity-[0.14] scale-105 blur-[2px]"
          />
        )}
        <div
          className="absolute -top-24 -left-24 h-80 w-80 rounded-full blur-3xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, ${movieAct.atmosphere.glowA}, transparent 70%)`,
            opacity: combo >= 2 || sugarRush >= 75 ? 1 : 0.72,
          }}
        />
        <div
          className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle, ${movieAct.atmosphere.glowB}, transparent 70%)`,
            opacity: combo >= 2 || sugarRush >= 75 ? 1 : 0.72,
          }}
        />
      </div>

      {/* Compact Top Tactical Gameplay Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 pt-2.5 pb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsPaused(true)}
            aria-label={t.pause}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl shadow-sm border bg-slate-950/80 text-white border-white/15 hover:bg-slate-800 transition-colors shrink-0"
          >
            <Pause className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black truncate leading-tight text-white">
              {level.isRelax || level.isDaily || level.isKadhaiRush || level.isBlitz
                ? level.name
                : `Mission ${level.id} · ${level.name}`}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="tabular-nums font-bold text-amber-300">
                {t.score}: {score.toLocaleString()}
              </span>
              <span aria-hidden="true" className="text-slate-500">·</span>
              <span className={`font-bold ${movieAct.atmosphere.commAccentClass}`}>
                {level.isBlitz ? '60s Arcade' : movieAct.actLabel}
              </span>
              {activeWinStreak > 0 && (
                <>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span className="inline-flex items-center gap-0.5 font-black text-amber-300 animate-streak-shimmer">
                    <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {activeWinStreak}× Streak
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Turns / Timer & Undo */}
        <div className="flex items-center gap-2 shrink-0">
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-black tabular-nums shadow-sm border ${
                timeLeft <= 15
                  ? 'bg-rose-600 text-white border-rose-400 animate-target-pulse'
                  : level.isBlitz
                  ? 'bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-400/60'
                  : 'bg-slate-950/80 text-cyan-200 border-cyan-400/35'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </div>
          )}

          {!level.isRelax && !level.isBlitz && (
            <div
              className={`flex flex-col items-center justify-center rounded-xl px-3 py-1 shadow-md border min-w-[58px] ${
                movesLeft <= 5
                  ? 'bg-gradient-to-b from-rose-500 to-red-600 text-white border-rose-300 animate-target-pulse'
                  : 'bg-slate-950/85 text-white border-cyan-400/45'
              }`}
            >
              <span className="text-[10px] font-bold leading-none text-cyan-200">{t.moves}</span>
              <span className="text-base sm:text-lg font-black tabular-nums leading-tight">{movesLeft}</span>
            </div>
          )}

          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0 || undosRemaining <= 0 || isBusy}
            title={`${t.undo} (${undosRemaining})`}
            className="flex min-h-[40px] items-center gap-1 rounded-xl px-2.5 text-xs font-bold border shadow-sm disabled:opacity-40 transition-colors bg-slate-950/80 text-slate-100 border-white/15 hover:bg-slate-800"
          >
            <Undo2 className="w-4 h-4" />
            <span className="tabular-nums">{undosRemaining}</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Workspace: Mobile Portrait Stack -> Desktop 3-Column Arena */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 pb-3 flex flex-col lg:grid lg:grid-cols-[276px_minmax(0,550px)_256px] lg:items-start lg:justify-center gap-2.5 lg:gap-5">
        {/* Left Column (Desktop) / Top Bar (Mobile): Juicy Mission Targets + Live Hero Comms */}
        <section className="flex flex-col gap-2">
          {/* Avenger Dispatch Directive Card (in Doomsday Reactor Rush mode) */}
          {level.isKadhaiRush && (
            <RoyalGuestOrderCard
              order={guestOrder}
              ordersServed={ordersServed}
              bestOrders={save.stats.kadhaiOrdersBest ?? 0}
              slots={kadhaiSlots}
              brewedRecipe={brewedRecipe}
              colorBlindMode={save.settings.colorBlindMode}
              isDarkTheme
            />
          )}

          {/* Upgraded Colorful Mission Targets Card */}
          {!level.isKadhaiRush && (
            <div className="rounded-2xl p-3 shadow-lg border bg-slate-950/80 backdrop-blur-md border-white/15 text-slate-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
                  {level.isBlitz ? <Timer className="w-3.5 h-3.5 text-fuchsia-300" /> : <Target className="w-3.5 h-3.5" />}
                  <span>
                    {level.isBlitz ? '60s Infinity Blitz' : level.isRelax ? 'Sim Training' : 'Mission Targets'}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 transition-transform ${
                        earnedStarsSoFar >= s
                          ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {level.isBlitz ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-fuchsia-950/60 border border-fuchsia-400/40 px-2.5 py-2">
                    <div className="text-[10px] font-bold uppercase text-fuchsia-300">Live Score</div>
                    <div className="text-sm font-black tabular-nums text-white">{score.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl bg-slate-900/90 border border-amber-400/35 px-2.5 py-2">
                    <div className="text-[10px] font-bold uppercase text-amber-300">Best Blitz</div>
                    <div className="text-sm font-black tabular-nums text-amber-200">
                      {Math.max(save.stats.blitzHighScore ?? 0, score).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : level.isRelax ? (
                <div className="rounded-xl bg-slate-900/90 border border-cyan-500/30 px-3 py-2 text-xs font-bold">
                  Endless High Score:{' '}
                  <span className="tabular-nums text-cyan-300">
                    {Math.max(save.stats.relaxHighScore, score).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {level.goals.map((g, i) => {
                    if (g.type === 'collect' && g.sweet) {
                      const got = Math.min(g.target, collected[g.sweet]);
                      const rem = Math.max(0, g.target - got);
                      const pct = Math.min(100, Math.round((got / Math.max(1, g.target)) * 100));
                      const done = rem === 0;
                      const almost = !done && rem <= 3;
                      return (
                        <div
                          key={i}
                          className={`rounded-xl p-2 border transition-all ${
                            done
                              ? 'bg-emerald-950/60 border-emerald-400/70'
                              : almost
                              ? 'bg-amber-950/45 border-amber-400/70 animate-target-pulse'
                              : 'bg-slate-900/85 border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 shrink-0">
                                <SweetIcon sweet={g.sweet} colorBlindMode={save.settings.colorBlindMode} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-200 truncate">
                                  {SWEET_META[g.sweet].name}
                                </div>
                                <div className="text-[10px] text-slate-400 tabular-nums">
                                  {got}/{g.target}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`flex items-center justify-center text-sm font-black tabular-nums shrink-0 ${
                                done ? 'text-emerald-300' : almost ? 'text-amber-300' : 'text-white'
                              }`}
                            >
                              {done ? <Check className="w-5 h-5" /> : rem}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: done ? '#34D399' : RELIC_PARTICLE_COLORS[g.sweet],
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                    if (g.type === 'jelly') {
                      const cleared = Math.max(0, initialJellyCount - remainingJelly);
                      const pct = Math.min(100, Math.round((cleared / Math.max(1, initialJellyCount)) * 100));
                      const done = remainingJelly === 0;
                      const almost = !done && remainingJelly <= 3;
                      return (
                        <div
                          key={i}
                          className={`rounded-xl p-2 border transition-all ${
                            done
                              ? 'bg-emerald-950/60 border-emerald-400/70'
                              : almost
                              ? 'bg-amber-950/45 border-amber-400/70 animate-target-pulse'
                              : 'bg-slate-900/85 border-emerald-500/25'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/35 border border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.65)]">
                                <Shield className="w-4 h-4 text-emerald-200" />
                              </span>
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-100 truncate">{t.goals.jelly}</div>
                                <div className="text-[10px] text-slate-400 tabular-nums">
                                  {cleared}/{initialJellyCount} shattered
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-sm font-black tabular-nums ${
                                done ? 'text-emerald-300' : almost ? 'text-amber-300' : 'text-emerald-200'
                              }`}
                            >
                              {done ? <Check className="w-5 h-5" /> : remainingJelly}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                    if (g.type === 'cherry') {
                      const rem = Math.max(0, g.target - cherriesDropped);
                      const pct = Math.min(100, Math.round((cherriesDropped / Math.max(1, g.target)) * 100));
                      const done = rem === 0;
                      return (
                        <div
                          key={i}
                          className={`rounded-xl p-2 border ${
                            done ? 'bg-emerald-950/60 border-emerald-400/70' : 'bg-slate-900/85 border-sky-400/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 shrink-0">
                                <CherryIcon />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-100 truncate">Drop Tesseract</div>
                                <div className="text-[10px] text-slate-400 tabular-nums">
                                  {cherriesDropped}/{g.target} extracted
                                </div>
                              </div>
                            </div>
                            <span className={`text-sm font-black tabular-nums ${done ? 'text-emerald-300' : 'text-sky-300'}`}>
                              {done ? <Check className="w-5 h-5" /> : rem}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                    if (g.type === 'boss') {
                      const maxHp = Math.max(1, level.bossHp ?? 100);
                      const pct = Math.min(100, Math.round(((maxHp - Math.max(0, bossHp)) / maxHp) * 100));
                      return (
                        <div key={i} className="rounded-xl p-2 border bg-rose-950/45 border-rose-400/45">
                          <div className="flex items-center justify-between text-xs font-black text-rose-200">
                            <span>{t.goals.boss}</span>
                            <span className="tabular-nums text-amber-300">{Math.max(0, bossHp)} HP</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                    const scoreGoalPct = Math.min(100, Math.round((score / Math.max(1, g.target)) * 100));
                    const done = score >= g.target;
                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-2 border ${
                          done ? 'bg-emerald-950/60 border-emerald-400/70' : 'bg-slate-900/85 border-amber-400/30'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-200">{t.goals.score}</span>
                          <span className="tabular-nums text-amber-300 font-black">
                            {done ? <Check className="w-4 h-4 text-emerald-300" /> : g.target.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-300"
                            style={{ width: `${scoreGoalPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Star Meter + Doomsday Surge Fever Gauge */}
              <div className="mt-2.5 space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-400 transition-all duration-300"
                    style={{ width: `${starPct}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Zap
                    className={`w-3.5 h-3.5 shrink-0 ${
                      sugarRush >= 75 ? 'text-amber-300 animate-target-pulse' : 'text-cyan-400'
                    }`}
                  />
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 transition-all duration-300"
                      style={{ width: `${sugarRush}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 tabular-nums whitespace-nowrap">
                    {t.sugarRush} {sugarRush}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Villain Health Bar + Live Counterattack Countdown on Boss Missions */}
          {level.bossHp && level.bossName && (
            <BossBar
              name={level.bossName}
              currentHp={bossHp}
              maxHp={level.bossHp}
              isHit={bossHit}
              turnsUntilStrike={bossStrikeTurns}
              maxStrikeCooldown={3}
              isStunned={bossStunned}
            />
          )}

          {/* Playable Active Avenger Ultimate + Tag-Team Switcher + 6-Stone Infinity Gauntlet */}
          <div
            className={`rounded-2xl p-2.5 sm:p-3 border shadow-lg backdrop-blur-md transition-all ${
              gauntletStones.length >= gauntletPalette.length
                ? 'bg-slate-900/95 border-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.45)]'
                : heroCharge >= 100
                ? 'bg-slate-900/95 border-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.38)]'
                : 'bg-slate-950/85 border-white/15'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border-2 bg-slate-900 ${
                  heroCharge >= 100 ? 'border-amber-300 animate-target-pulse' : 'border-white/25'
                }`}
              >
                {!heroPortraitFailed ? (
                  <img
                    src={activeHero.posterUrl}
                    alt={activeHero.codename}
                    referrerPolicy="no-referrer"
                    onError={() => setHeroPortraitFailed(true)}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-amber-300">
                    <Zap className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 text-[11px] font-black">
                  <span className="truncate" style={{ color: activeHero.ultimate.colorHex }}>
                    {activeHero.ultimate.name}
                  </span>
                  <span className="tabular-nums text-white shrink-0">{heroCharge}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-950 border border-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${activeHero.ultimate.gradientClass} transition-all duration-300`}
                    style={{ width: `${heroCharge}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-slate-300">
                  <span className="truncate">{activeHero.codename}</span>
                  {availableHeroes.length > 1 && (
                    <button
                      type="button"
                      disabled={isBusy || phase !== 'playing'}
                      onClick={handleTagTeamSwitch}
                      title="Tag-Team Next Avenger (T)"
                      className="inline-flex items-center gap-1 rounded-md bg-slate-800/95 border border-cyan-400/40 px-1.5 py-0.5 text-[10px] font-extrabold text-cyan-300 hover:bg-slate-700 whitespace-nowrap shrink-0"
                    >
                      <Repeat2 className="w-3 h-3" />
                      <span>{level.isBlitz ? 'Tag 5×' : 'Tag'}</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={heroCharge < 100 || isBusy || phase !== 'playing' || isPaused || showTutorial}
                onClick={handleUnleashHeroUltimate}
                className={`min-h-[40px] shrink-0 rounded-xl px-3 text-xs font-black transition-all whitespace-nowrap ${
                  heroCharge >= 100
                    ? `bg-gradient-to-r ${activeHero.ultimate.gradientClass} text-slate-950 shadow-md hover:brightness-110 active:scale-95 animate-target-pulse`
                    : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                {heroCharge >= 100 ? 'UNLEASH!' : 'CHARGE'}
              </button>
            </div>

            {/* 6-Stone Infinity Gauntlet Collector & SNAP! Trigger */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 whitespace-nowrap">
                  Gauntlet
                </span>
                <div className="flex items-center gap-1" aria-label={`Infinity Stones collected: ${gauntletStones.length} of ${gauntletPalette.length}`}>
                  {gauntletPalette.map((st) => {
                    const lit = gauntletStones.includes(st);
                    const hex = RELIC_PARTICLE_COLORS[st];
                    return (
                      <span
                        key={st}
                        title={SWEET_META[st].name}
                        className={`h-3.5 w-3.5 rounded-full border transition-all duration-300 ${
                          lit ? 'scale-110 border-white' : 'border-slate-700 bg-slate-900/90 opacity-45'
                        }`}
                        style={
                          lit
                            ? {
                                backgroundColor: hex,
                                boxShadow: `0 0 10px ${hex}`,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {gauntletStones.length >= gauntletPalette.length ? (
                <button
                  type="button"
                  disabled={isBusy || phase !== 'playing' || isPaused || showTutorial}
                  onClick={handleTriggerInfinitySnap}
                  className="min-h-[30px] shrink-0 rounded-lg bg-gradient-to-r from-amber-300 via-yellow-400 to-fuchsia-400 px-2.5 text-[11px] font-black text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.75)] hover:brightness-110 active:scale-95 animate-target-pulse whitespace-nowrap"
                >
                  ⚡ SNAP!
                </button>
              ) : (
                <span className="text-[10px] font-bold tabular-nums text-slate-400 whitespace-nowrap">
                  {gauntletStones.length}/{gauntletPalette.length} Stones
                </span>
              )}
            </div>
          </div>

          {/* Live Comic-Movie Avengers Radio Comms (Always visible on Desktop & compact on Mobile!) */}
          <div
            key={heroComm.id}
            className="animate-hero-comm-in rounded-2xl p-2.5 sm:p-3 border shadow-lg bg-slate-950/85 backdrop-blur-md border-white/15 text-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-xl border-2 border-white/30 bg-slate-900 shadow-md">
                {!posterFailed ? (
                  <img
                    src={movieAct.posterUrl}
                    alt={movieAct.codename}
                    referrerPolicy="no-referrer"
                    onError={() => setPosterFailed(true)}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <ChotuMascot mood={mascotMood} outfit={save.equippedOutfit} size="sm" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                  <Radio className={`w-3 h-3 shrink-0 ${movieAct.atmosphere.commAccentClass}`} />
                  <span className={movieAct.atmosphere.commAccentClass}>{movieAct.codename}</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-amber-300 truncate">{heroComm.tag}</span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-slate-100 font-medium line-clamp-2">
                  “{heroComm.text}”
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: View Mode Switcher + Helicarrier 3D / Tactical 2D Board + Gravity Dial */}
        <section className="flex flex-col items-center justify-center w-full gap-2">
          {/* Interactive Gaming View Mode Switcher */}
          <div className="w-full max-w-[min(94vw,520px)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-xl p-1 bg-[#0E1729] border border-emerald-500/35">
              <button
                type="button"
                onClick={() => {
                  soundService.playTap();
                  onSetViewMode('thali_3d');
                }}
                className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                  isThali3D
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Helicarrier 3D</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundService.playTap();
                  onSetViewMode('classic');
                }}
                className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                  !isThali3D
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tactical 2D</span>
              </button>
            </div>

            <span className="text-[11px] font-semibold hidden sm:inline text-emerald-300/80">
              {isThali3D ? 'Holo-Deck 3D Perspective' : 'Flat Tactical Grid'}
            </span>
          </div>

          <div className={`w-full max-w-[min(94vw,520px)] ${isThali3D ? 'thali-3d-stage py-1' : ''}`}>
            <div
              style={thaliTransformStyle}
              className={`relative w-full aspect-square rounded-3xl p-2 sm:p-3 border-2 ${
                isThali3D
                  ? `thali-3d-platter bg-gradient-to-br from-[#132538] via-[#0C1829] to-[#08121E] ${movieAct.atmosphere.borderGlow}`
                  : `shadow-xl ${theme.boardFrameClass}`
              } ${boardShaking ? 'animate-board-shake' : ''}`}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Glowing Doomsday Emerald Gravity Edge Guide */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute z-20 rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-400 animate-thali-glow ${
                  gravityDir === 'down'
                    ? 'bottom-0.5 left-8 right-8 h-1.5'
                    : gravityDir === 'up'
                    ? 'top-0.5 left-8 right-8 h-1.5'
                    : gravityDir === 'right'
                    ? 'right-0.5 top-8 bottom-8 w-1.5'
                    : 'left-0.5 top-8 bottom-8 w-1.5'
                }`}
              />

              {/* Armored Titanium Inner Holo-Deck Surface in Helicarrier 3D View */}
              {isThali3D && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-1.5 sm:inset-2 rounded-[20px] bg-gradient-to-b from-[#0A1322] via-[#08101C] to-[#060C16] border border-emerald-400/35"
                />
              )}

              {/* Active Booster Target Banner */}
              {activeBooster && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-1 text-xs font-extrabold text-slate-950 shadow-md whitespace-nowrap">
                  <span>Tap a relic to deploy {activeBooster === 'hammer' ? 'Mjolnir' : 'Infinity Orb'}</span>
                  <button
                    onClick={() => setActiveBooster(null)}
                    className="underline text-slate-900 hover:text-black"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Live Cascade Combo Hype Pill */}
              {combo >= 2 && (
                <div className="pointer-events-none absolute -top-3.5 right-4 z-30 rounded-xl bg-gradient-to-r from-amber-300 via-fuchsia-400 to-cyan-300 px-3 py-0.5 text-xs font-black text-slate-950 shadow-[0_0_18px_rgba(232,121,249,0.75)] animate-target-pulse whitespace-nowrap">
                  {combo >= 5 ? `${combo}× GODLIKE!` : combo >= 4 ? `${combo}× COSMIC!` : combo >= 3 ? `${combo}× SUPER!` : `${combo}× CHAIN!`}
                </div>
              )}

            {/* Match-3 Tactical Grid */}
            <div
              className="grid h-full w-full gap-1 sm:gap-1.5 select-none touch-none"
              style={{
                gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${level.rows}, minmax(0, 1fr))`,
              }}
              role="grid"
              aria-label="Super Crush Doomsday puzzle grid"
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const isSel = selected?.row === r && selected?.col === c;
                  const isFocused = cursor.row === r && cursor.col === c;
                  const isHint =
                    hintPair !== null &&
                    ((hintPair[0].row === r && hintPair[0].col === c) ||
                      (hintPair[1].row === r && hintPair[1].col === c));
                  const isInvalid =
                    invalidPair !== null &&
                    ((invalidPair[0].row === r && invalidPair[0].col === c) ||
                      (invalidPair[1].row === r && invalidPair[1].col === c));
                  const isClearing = clearingSet.has(key);

                  // Special + Special Mega-Combo Synergy Glow!
                  const selectedCell = selected ? board[selected.row]?.[selected.col] : null;
                  const isSpecialComboPartner =
                    Boolean(selected && selectedCell && selectedCell.special !== 'none') &&
                    areAdjacent(selected!, { row: r, col: c }) &&
                    isCellMovable(cell) &&
                    (selectedCell!.special === 'rainbow' || cell.special !== 'none');

                  if (cell.isHole) {
                    return <div key={key} className="rounded-lg bg-transparent" aria-hidden="true" />;
                  }

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCellClick(r, c)}
                      onPointerDown={(e) => handlePointerDown(r, c, e)}
                      aria-label={
                        cell.isCherry
                          ? `Row ${r + 1} Col ${c + 1} Tesseract`
                          : cell.sweet
                          ? `Row ${r + 1} Col ${c + 1} ${SWEET_META[cell.sweet].name}`
                          : `Row ${r + 1} Col ${c + 1} ${cell.blocker}`
                      }
                      className={`relative flex items-center justify-center rounded-xl border transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                        isThali3D
                          ? 'thali-3d-cell bg-[#111D30]/95 border-emerald-500/25'
                          : theme.tileBgClass
                      } ${isSel ? 'ring-3 ring-emerald-400 scale-105 z-20 bg-emerald-950/80' : ''} ${
                        isSpecialComboPartner ? 'animate-combo-ring z-20 bg-fuchsia-950/70' : ''
                      } ${
                        isFocused && !isSel ? 'ring-1 ring-emerald-400/60' : ''
                      } ${isInvalid ? 'animate-invalid-shake' : ''} ${
                        activeBooster ? 'cursor-crosshair hover:ring-2 hover:ring-amber-400' : 'cursor-pointer'
                      }`}
                    >
                      {isSpecialComboPartner && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -top-1.5 -right-1.5 z-30 rounded-md bg-amber-300 px-1 text-[8px] font-black text-slate-950 shadow"
                        >
                          2×
                        </span>
                      )}
                      {/* 2-Layer or 1-Layer Doomsday Energy Shield Underlay */}
                      {cell.jelly > 0 && (
                        <div
                          aria-hidden="true"
                          className={`pointer-events-none absolute inset-0.5 rounded-lg ${
                            cell.jelly === 2
                              ? 'bg-gradient-to-br from-emerald-500/65 to-teal-400/55 ring-2 ring-emerald-300/90 shadow-[inset_0_0_10px_rgba(16,185,129,0.7)]'
                              : 'bg-emerald-500/35 ring-1 ring-emerald-400/80'
                          }`}
                        />
                      )}

                      {/* Vibranium Wall Stone Blocker */}
                      {cell.blocker === 'stone' && (
                        <div className="relative z-10 flex h-[86%] w-[86%] items-center justify-center rounded-lg bg-gradient-to-b from-slate-600 to-slate-800 border-2 border-slate-500 shadow-inner">
                          <div className="h-3 w-3 rotate-45 border border-emerald-400/50" />
                        </div>
                      )}

                      {/* Avenger Relic or Tesseract */}
                      {cell.isCherry && (
                        <div
                          key={cell.id}
                          className={`relative z-10 w-[86%] h-[86%] ${isThali3D ? 'thali-3d-sweet' : ''} ${
                            cell.justDropped ? dropAnimClass : ''
                          }`}
                        >
                          <CherryIcon />
                        </div>
                      )}

                      {cell.sweet && cell.blocker !== 'stone' && (
                        <div
                          key={cell.id}
                          className={`relative z-10 w-[92%] h-[92%] ${isThali3D ? 'thali-3d-sweet' : ''} ${
                            isClearing
                              ? 'animate-sweet-pop'
                              : cell.justDropped
                              ? dropAnimClass
                              : isHint
                              ? 'animate-sweet-hint'
                              : ''
                          }`}
                        >
                          <SweetIcon
                            sweet={cell.sweet}
                            special={cell.special}
                            colorBlindMode={save.settings.colorBlindMode}
                          />
                        </div>
                      )}

                      {/* Cryo Stasis Ice Overlay */}
                      {cell.blocker === 'ice' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0.5 z-20 flex items-center justify-center rounded-lg bg-sky-300/45 border-2 border-cyan-300/90 backdrop-blur-[1px]"
                        >
                          <Snowflake className="w-4 h-4 text-cyan-100 drop-shadow" />
                        </div>
                      )}

                      {/* Titanium Lock Overlay */}
                      {cell.blocker === 'locked' && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0.5 z-20 flex items-center justify-center rounded-lg border-2 border-slate-400/90 bg-slate-950/45"
                        >
                          <div className="rounded-md bg-slate-800/95 p-1 text-emerald-300 border border-emerald-400/40 shadow">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* 60fps Particle & Confetti Canvas Overlay */}
            <canvas
              ref={canvasRef}
              width={520}
              height={520}
              className="pointer-events-none absolute inset-2 sm:inset-3 h-[calc(100%-1rem)] w-[calc(100%-1rem)] sm:h-[calc(100%-1.5rem)] sm:w-[calc(100%-1.5rem)] z-30"
            />

            {/* Floating Avengers Praise Text ("Avengers Smash!", "Cosmic Surge!", "Doomsday Breaker!") */}
            <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center">
              {floatingBanners.map((b) => (
                <div
                  key={b.id}
                  className="animate-float-up text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]"
                >
                  <div className="font-display text-2xl sm:text-3xl font-black text-emerald-300 [-webkit-text-stroke:1.5px_#052e16]">
                    {b.text}
                  </div>
                  {b.subtext && (
                    <div className="text-xs sm:text-sm font-extrabold text-slate-950 bg-emerald-400 px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
                      {b.subtext}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Auto-Shuffle Notification */}
            {shuffleToast && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 rounded-3xl backdrop-blur-[1px]">
                <div className="rounded-2xl bg-[#0D1628] px-5 py-3 text-sm font-bold text-emerald-200 shadow-xl border border-emerald-400/50">
                  {t.noMovesShuffling}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Interactive 4-Way Gravity Shift Dial */}
          <ThaliGravityDial
            gravityDir={gravityDir}
            charge={gravityCharge}
            disabled={isBusy || phase !== 'playing' || isPaused || showTutorial}
            isDarkTheme
            unlimitedTilt={Boolean(level.isKadhaiRush)}
            onTilt={handleTiltThali}
          />
        </section>

        {/* Right Column (Desktop) / Bottom Thumb-Zone Bar (Mobile): Stark Arc Forge + Boosters */}
        <section className="flex flex-col gap-2 w-full max-w-[520px] mx-auto lg:mx-0">
          {/* Desktop Full Stark Arc Forge Panel */}
          <div className="hidden lg:block">
            <KadhaiAlchemyPanel
              slots={kadhaiSlots}
              brewedRecipe={brewedRecipe}
              colorBlindMode={save.settings.colorBlindMode}
              disabled={isBusy || phase !== 'playing' || isPaused || showTutorial}
              isDarkTheme
              onServeDish={handleServeKadhaiDish}
            />
          </div>

          {/* Mobile Compact Stark Arc Forge Strip */}
          <div className="lg:hidden">
            <KadhaiAlchemyPanel
              slots={kadhaiSlots}
              brewedRecipe={brewedRecipe}
              colorBlindMode={save.settings.colorBlindMode}
              disabled={isBusy || phase !== 'playing' || isPaused || showTutorial}
              isDarkTheme
              onServeDish={handleServeKadhaiDish}
              compact
            />
          </div>

          <div className="rounded-2xl p-2.5 sm:p-3 shadow-sm border bg-[#0E1729]/95 border-emerald-500/30 text-slate-100">
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
              {boosterItems.map((b) => {
                const count = save.boosters[b.id];
                const isSelected = activeBooster === b.id;
                return (
                  <button
                    key={b.id}
                    disabled={count <= 0 || isBusy || phase !== 'playing'}
                    onClick={() => {
                      if (b.needsTarget) {
                        setActiveBooster(isSelected ? null : b.id);
                      } else {
                        triggerTargetedBooster(b.id);
                      }
                    }}
                    className={`relative flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 scale-105 shadow-md'
                        : 'bg-slate-900/90 text-slate-100 border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 disabled:opacity-40'
                    }`}
                  >
                    {b.icon}
                    <span className="text-[11px] whitespace-nowrap">{b.label}</span>
                    <span
                      className={`absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                        isSelected ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rewarded Ad #3: Free Booster on Booster Bar (Online + Ad Ready only) */}
            {canShowRewarded && phase === 'playing' && (
              <button
                disabled={adBusy || isBusy}
                onClick={handleWatchAdForFreeBooster}
                className="mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.watchAdFreeBooster}</span>
              </button>
            )}
          </div>

          {/* Mobile compact Commander Nova reaction bar */}
          <div className="lg:hidden flex items-center justify-between rounded-2xl px-3 py-1.5 border bg-[#0E1729]/90 border-emerald-500/25 text-slate-100">
            <ChotuMascot
              mood={mascotMood}
              outfit={save.equippedOutfit}
              quote={t.chotuQuotes[mascotMood]}
              size="sm"
            />
          </div>

          {/* Controls & Shortcuts Tip on Desktop */}
          <div className="hidden lg:block rounded-2xl p-3 text-xs border leading-relaxed bg-[#0E1729]/80 text-slate-300 border-emerald-500/20">
            <div className="font-bold mb-1 text-emerald-300">Tactical Shortcuts</div>
            <p>
              Swipe or Arrow keys + Enter. <strong>U</strong> Avenger Ultimate, <strong>S</strong> Infinity Snap, <strong>T</strong> Tag-Team Hero, <strong>Q / E</strong> Gravity Shift, <strong>F</strong> Arc Forge.
            </p>
          </div>
        </section>
      </main>

      {/* Tutorial Overlay for First 3 Missions */}
      {showTutorial && level.tutorialKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1628] p-6 shadow-2xl border-2 border-emerald-500/50 text-center text-slate-100">
            <div className="flex justify-center mb-3">
              <ChotuMascot mood="cheer" outfit={save.equippedOutfit} size="md" />
            </div>
            <h2 className="text-xl font-black text-white">
              {level.tutorialKey === 'swap'
                ? t.tutorial.swapTitle
                : level.tutorialKey === 'special'
                ? t.tutorial.specialTitle
                : t.tutorial.jellyTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {level.tutorialKey === 'swap'
                ? t.tutorial.swapBody
                : level.tutorialKey === 'special'
                ? t.tutorial.specialBody
                : t.tutorial.jellyBody}
            </p>
            <button
              onClick={() => {
                soundService.playTap();
                setShowTutorial(false);
              }}
              className="mt-5 w-full min-h-[46px] rounded-xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition-colors shadow-md"
            >
              {t.tutorial.gotIt}
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && phase === 'playing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1628] p-6 shadow-2xl border border-emerald-500/40 text-slate-100">
            <h2 className="text-xl font-black text-center text-white">{t.pause}</h2>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => onToggleSetting('sound')}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold border ${
                  save.settings.sound
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {save.settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                SFX
              </button>
              <button
                onClick={() => onToggleSetting('colorBlindMode')}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold border ${
                  save.settings.colorBlindMode
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                Symbols: {save.settings.colorBlindMode ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={() => setIsPaused(false)}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400"
              >
                <Play className="w-4 h-4 fill-current" /> {t.resume}
              </button>
              <button
                onClick={resetLevel}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-700"
              >
                <RotateCcw className="w-4 h-4" /> {t.restart}
              </button>
              <button
                onClick={() => onExitToMap(false)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800"
              >
                {t.exitToMap}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Moves Popup — High-Stakes Win Streak Warning + Rewarded Ad #1 (+5 Turns) */}
      {phase === 'out_of_moves' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1628] p-6 shadow-2xl border-2 border-amber-400/60 text-center text-slate-100">
            <div className="flex justify-center mb-2">
              <ChotuMascot mood="gasp" outfit={save.equippedOutfit} size="md" />
            </div>
            <h2 className="text-xl font-black text-white">{t.outOfMoves}</h2>
            <p className="mt-1 text-sm text-slate-300">Keep your battle progress and grab +5 extra turns!</p>

            {activeWinStreak > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-rose-950/70 border border-rose-400/50 px-3 py-2 text-xs font-bold text-rose-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ending now resets your {activeWinStreak}-Win Streak & free board specials!</span>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2.5">
              {canShowRewarded && (
                <button
                  disabled={adBusy}
                  onClick={handleWatchAdFor5Moves}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-sm font-black text-slate-950 hover:brightness-110 shadow-md disabled:opacity-50"
                >
                  <Video className="w-4 h-4" /> {t.watchAd5Moves}
                </button>
              )}

              <button
                disabled={save.coins < 90}
                onClick={handleBuy5MovesWithCoins}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 text-sm font-black text-slate-950 hover:brightness-110 disabled:opacity-45"
              >
                <Coins className="w-4 h-4" /> +5 Turns (90 Credits · You have {save.coins})
              </button>

              <button
                onClick={handleGiveUpToFail}
                className="min-h-[42px] rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                {activeWinStreak > 0 ? 'End Mission (Reset Streak)' : 'End Mission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Popup — Rewarded Ad #2 (Revive) */}
      {phase === 'failed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#0D1628] p-6 shadow-2xl border-2 border-rose-500/50 text-center text-slate-100">
            <div className="flex justify-center mb-2">
              <ChotuMascot mood={level.isKadhaiRush && ordersServed > 0 ? 'dance' : 'sad'} outfit={save.equippedOutfit} size="md" />
            </div>
            <h2 className="text-2xl font-black text-white">
              {level.isKadhaiRush ? 'Reactor Rush Complete!' : t.levelFailed}
            </h2>
            <p className="mt-1 text-sm text-slate-300 tabular-nums">
              {level.isKadhaiRush ? (
                <>
                  Directives Cleared: <strong className="text-emerald-300">{ordersServed}</strong> · Score:{' '}
                  <strong className="text-amber-300">{score.toLocaleString()}</strong>
                </>
              ) : (
                <>
                  Final Score: <strong className="text-emerald-300">{score.toLocaleString()}</strong>
                </>
              )}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {canShowRewarded && !reviveUsed && (
                <button
                  disabled={adBusy}
                  onClick={handleWatchAdToRevive}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-slate-950 hover:bg-emerald-400 shadow-md"
                >
                  <Video className="w-4 h-4" /> {t.watchAdRevive}
                </button>
              )}
              <button
                onClick={resetLevel}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 text-sm font-black text-slate-950 hover:brightness-110"
              >
                <RotateCcw className="w-4 h-4" /> {t.tryAgain}
              </button>
              <button
                onClick={() => onExitToMap(false)}
                className="min-h-[44px] rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                {t.exitToMap}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Juicy Sticky Win Popup — Staggered Stars, Win Streak Power-Up Preview & Next Avenger Recruit Progress */}
      {phase === 'won' && (() => {
        const nextStreak = canUseWinStreak ? (save.winStreak ?? 0) : 0;
        const nextStreakInfo = getWinStreakInfo(nextStreak);
        const nextRecruit = squadAfterWin.nextRecruit;
        const levelsUntilRecruit = nextRecruit
          ? Math.max(0, nextRecruit.unlockLevel - Math.max(save.unlockedLevel, level.id + 1))
          : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#0E1C33] via-[#0B1628] to-[#08101E] p-5 sm:p-6 shadow-2xl border-2 border-amber-400/70 text-center text-slate-100">
              <div className="flex justify-center mb-1">
                <ChotuMascot mood="dance" outfit={save.equippedOutfit} size="sm" />
              </div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                {t.levelComplete}
              </h2>

              {/* Staggered Bouncy 1-3 Stars */}
              <div className="mt-2.5 flex items-center justify-center gap-2.5">
                {[1, 2, 3].map((s) => {
                  const earned = computeStars(score) >= s;
                  return (
                    <Star
                      key={s}
                      style={{ animationDelay: `${(s - 1) * 140}ms` }}
                      className={`w-10 h-10 ${
                        earned
                          ? 'animate-star-pop fill-amber-400 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
                          : 'text-slate-700'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="mt-2.5 flex items-center justify-center gap-3 text-sm font-black text-slate-100 tabular-nums">
                <span>{t.score}: {score.toLocaleString()}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Coins className="w-4 h-4" /> +{winCoinsDoubled ? winCoinsEarned * 2 : winCoinsEarned}
                </span>
              </div>

              {/* Win Streak Momentum Upgrade Strip */}
              {canUseWinStreak && (
                <div className="mt-3 rounded-2xl bg-slate-900/90 border border-amber-400/45 p-2.5 text-left">
                  <div className="flex items-center justify-between gap-2 text-xs font-black">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                      Win Streak: {nextStreak}× · {nextStreakInfo.label}
                    </span>
                    <span className="text-[10px] text-cyan-300">NEXT MISSION</span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-200">
                    {nextStreakInfo.perkShort}
                  </p>
                </div>
              )}

              {/* Next Avenger Recruit Countdown Bar */}
              {!level.isRelax && !level.isCustom && nextRecruit && (
                <div className="mt-2.5 rounded-2xl bg-slate-900/85 border border-cyan-400/35 p-2.5 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-cyan-300">Next Recruit: {nextRecruit.codename}</span>
                    <span className="text-slate-300 tabular-nums">
                      {levelsUntilRecruit === 0 ? 'UNLOCKED!' : `${levelsUntilRecruit} left`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-950">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${nextRecruit.badgeGrad}`}
                      style={{
                        width: `${Math.min(100, Math.max(12, Math.round(((12 - Math.min(12, levelsUntilRecruit)) / 12) * 100)))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Post-Battle Victory Relief Epilogue */}
              {!level.isRelax && !level.isCustom && (
                <div className="mt-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/35 p-2.5 text-left">
                  <div className="text-[11px] font-extrabold text-emerald-300">Mission Relief!</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-200">
                    {levelStory.solvedRelief}
                  </p>
                  <p className="mt-1 text-[11px] italic font-semibold text-emerald-400">
                    {levelStory.npcThankYou}
                  </p>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {canShowRewarded && !winCoinsDoubled && (
                  <button
                    disabled={adBusy}
                    onClick={handleWatchAdFor2xCoins}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500 shadow-md"
                  >
                    <Video className="w-4 h-4" /> {t.watchAd2xCoins} (+{winCoinsEarned})
                  </button>
                )}

                {!level.isDaily && !level.isCustom && level.id < 60 && (
                  <button
                    onClick={() => onNextLevel(level.id)}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-emerald-400 to-cyan-400 px-4 text-sm font-black text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(52,211,153,0.45)]"
                  >
                    {t.nextLevel} (Keep {nextStreak}× Streak!) →
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleShareVictoryPoster(false)}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 text-sm font-extrabold text-white hover:brightness-110 shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{shareStatus ?? 'Share Victory Poster'}</span>
                </button>

                <button
                  onClick={() => onExitToMap(true)}
                  className="min-h-[42px] rounded-xl border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                >
                  {t.exitToMap} (Watch Squad Advance!)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 60-Second Infinity Blitz Complete Modal */}
      {phase === 'blitz_done' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#1E1038] via-[#0F172A] to-[#08101E] p-6 shadow-2xl border-2 border-fuchsia-400/75 text-center text-slate-100">
            <div className="flex justify-center mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-amber-400 to-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(232,121,249,0.55)]">
                <Trophy className="w-7 h-7" />
              </div>
            </div>

            {isNewBlitzBest && (
              <div className="inline-block rounded-lg bg-amber-400 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-slate-950 mb-1">
                New Personal Record!
              </div>
            )}

            <h2 className="text-2xl font-black bg-gradient-to-r from-fuchsia-300 via-amber-300 to-cyan-300 bg-clip-text text-transparent">
              60s Blitz Complete!
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-300">
              Active Avenger: <span style={{ color: activeHero.ultimate.colorHex }}>{activeHero.codename}</span>
            </p>

            <div className="mt-4 rounded-2xl bg-slate-950/85 border border-fuchsia-400/35 p-4">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Final Blitz Score
              </div>
              <div className="mt-0.5 text-4xl font-black tabular-nums text-white">
                {score.toLocaleString()}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 text-xs font-bold tabular-nums">
                <span className="text-cyan-300">Best Combo: {Math.max(1, bestCombo)}×</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-amber-300">
                  <Coins className="w-3.5 h-3.5" /> +{blitzCreditsEarned} Credits
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={resetLevel}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-fuchsia-400 to-cyan-400 px-4 text-sm font-black text-slate-950 hover:brightness-110 shadow-[0_0_22px_rgba(232,121,249,0.4)]"
              >
                <RotateCcw className="w-4 h-4" /> Play Again (60s Blitz)
              </button>

              <button
                type="button"
                onClick={() => handleShareVictoryPoster(true)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 text-sm font-extrabold text-white hover:brightness-110 shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>{shareStatus ?? 'Share Blitz Record Card'}</span>
              </button>

              <button
                onClick={() => onExitToMap(false)}
                className="min-h-[42px] rounded-xl border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                Back to Command Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Golden Cosmic Flash on Infinity Snap */}
      {snapFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[70] animate-snap-flash bg-gradient-to-br from-amber-200 via-yellow-100 to-fuchsia-300"
        />
      )}

      {/* 880ms Comic-Book Movie Ultimate / Infinity Snap Cut-In Slash */}
      {cutIn && (
        <div
          key={cutIn.id}
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-1/2 -translate-y-1/2 z-[65] flex items-center justify-center overflow-hidden py-4"
        >
          <div
            className={`animate-cutin-slash w-full max-w-2xl mx-4 rounded-2xl border-y-4 border-white/90 bg-gradient-to-r ${cutIn.gradientClass} p-1 shadow-[0_0_50px_rgba(0,0,0,0.85)]`}
          >
            <div className="flex items-center gap-4 rounded-xl bg-slate-950/90 px-4 py-3 sm:px-6 sm:py-4">
              <div
                className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 shadow-lg"
                style={{ borderColor: cutIn.accentHex }}
              >
                <img
                  src={cutIn.posterUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="text-[11px] sm:text-xs font-black uppercase tracking-[0.26em]"
                  style={{ color: cutIn.accentHex }}
                >
                  {cutIn.heroName}
                </div>
                <div className="font-display text-2xl sm:text-4xl font-black italic tracking-tight text-white leading-none drop-shadow">
                  {cutIn.title}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-bold text-slate-200 truncate">
                  {cutIn.subtitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
