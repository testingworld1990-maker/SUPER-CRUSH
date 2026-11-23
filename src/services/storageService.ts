import { LevelConfig, QuickBounty, SaveState } from '../game/types';

const STORAGE_KEY = 'sweet_crush_save_v1';
const IDB_NAME = 'SweetCrushDB';
const IDB_STORE = 'saveStore';

export const LIFE_REFILL_MS = 15 * 60 * 1000; // 15 minutes per heart

export function getTodayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const BOUNTY_POOL: Array<Omit<QuickBounty, 'id' | 'progress'>> = [
  { kind: 'matches', title: 'Land 15 Relic Matches', target: 15, rewardCoins: 90 },
  { kind: 'specials', title: 'Forge 3 Special Relics', target: 3, rewardBooster: 'hammer' },
  { kind: 'combo', title: 'Hit a 3× Chain Combo', target: 3, rewardCoins: 120 },
  { kind: 'collect_relic', title: 'Collect 24 Arc Reactors', target: 24, sweet: 'laddu', rewardCoins: 100 },
  { kind: 'wins', title: 'Win 2 Missions', target: 2, rewardBooster: 'color_bomb' },
  { kind: 'collect_relic', title: 'Collect 24 Vibranium Shields', target: 24, sweet: 'jalebi', rewardCoins: 100 },
  { kind: 'specials', title: 'Forge 5 Special Relics', target: 5, rewardCoins: 150 },
  { kind: 'collect_relic', title: 'Collect 24 Time Eyes', target: 24, sweet: 'rasgulla', rewardBooster: 'extra_moves' },
  { kind: 'combo', title: 'Hit a 4× Chain Combo', target: 4, rewardBooster: 'shuffle' },
  { kind: 'matches', title: 'Land 25 Relic Matches', target: 25, rewardCoins: 140 },
];

export function createInitialBounties(): QuickBounty[] {
  return [0, 1, 2].map((idx) => ({
    ...BOUNTY_POOL[idx],
    id: `bounty_init_${idx}`,
    progress: 0,
  }));
}

export function createReplacementBounty(existingTitles: string[], seed: number): QuickBounty {
  const candidates = BOUNTY_POOL.filter((b) => !existingTitles.includes(b.title));
  const pool = candidates.length > 0 ? candidates : BOUNTY_POOL;
  const picked = pool[Math.abs(seed) % pool.length];
  return {
    ...picked,
    id: `bounty_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    progress: 0,
  };
}

export function createDefaultSaveState(): SaveState {
  const today = getTodayKey();
  return {
    consentAccepted: false,
    playerName: 'Avenger Agent',
    unlockedLevel: 1,
    levels: {},
    festivalCompleted: {},
    coins: 250,
    boosters: {
      hammer: 3,
      shuffle: 3,
      extra_moves: 2,
      color_bomb: 2,
    },
    lives: 5,
    maxLives: 5,
    lastLifeLostAt: null,
    unlimitedLivesUntil: null,
    vipUntil: null,
    removeAds: false,
    premiumFestivalPass: false,
    festivalPassXp: 0,
    festivalPassFreeClaimed: [],
    festivalPassPremiumClaimed: [],
    unlockedThemes: ['classic'],
    unlockedOutfits: ['halwai'],
    equippedOutfit: 'halwai',
    stickersUnlocked: [],
    achievementsUnlocked: [],
    achievementsClaimed: [],
    winStreak: 0,
    bestWinStreak: 0,
    activeHeroId: 'captain_nova',
    bounties: createInitialBounties(),
    stats: {
      totalMatches: 0,
      totalSpecials: 0,
      totalBossesDefeated: 0,
      totalLevelsWon: 0,
      bestCombo: 0,
      dailyChallengesWon: 0,
      relaxHighScore: 0,
      kadhaiOrdersBest: 0,
      blitzHighScore: 0,
    },
    dailyLogin: {
      streak: 0,
      lastClaimDate: null,
      doubledToday: false,
    },
    dailySpin: {
      lastSpinDate: null,
      bonusSpinUsedDate: null,
    },
    dailyChallenge: {
      lastCompletedDate: null,
      bestTodayScore: 0,
      leaderboard: [
        { id: 'bot1', name: 'Capt. Nova', score: 6420, date: today, city: 'Sector I' },
        { id: 'bot2', name: 'Scarlet Bolt', score: 5890, date: today, city: 'Sector II' },
        { id: 'bot3', name: 'Mystic Prism', score: 5150, date: today, city: 'Sector IV' },
        { id: 'bot4', name: 'Iron Titan', score: 4680, date: today, city: 'Sector V' },
      ],
    },
    ads: {
      totalCompletedLevels: 0,
      completedSinceInterstitial: 0,
      lastInterstitialAt: 0,
    },
    settings: {
      sound: true,
      music: false,
      vibration: true,
      colorBlindMode: false,
      theme: 'classic',
      language: 'en',
      relaxGridSize: 9,
      viewMode: 'thali_3d',
    },
    customLevels: [],
  };
}

/** Recalculates refilled hearts based on the device clock */
export function syncLivesFromClock(state: SaveState, now = Date.now()): SaveState {
  if (state.unlimitedLivesUntil && state.unlimitedLivesUntil > now) {
    return { ...state, lives: state.maxLives, lastLifeLostAt: null };
  }
  if (state.lives >= state.maxLives) {
    return state.lastLifeLostAt ? { ...state, lastLifeLostAt: null } : state;
  }
  if (!state.lastLifeLostAt) {
    return { ...state, lastLifeLostAt: now };
  }
  const elapsed = Math.max(0, now - state.lastLifeLostAt);
  const gained = Math.floor(elapsed / LIFE_REFILL_MS);
  if (gained <= 0) return state;

  const newLives = Math.min(state.maxLives, state.lives + gained);
  const nextTimestamp = newLives >= state.maxLives ? null : state.lastLifeLostAt + gained * LIFE_REFILL_MS;
  return {
    ...state,
    lives: newLives,
    lastLifeLostAt: nextTimestamp,
  };
}

export function getNextLifeCountdownSec(state: SaveState, now = Date.now()): number {
  if (state.unlimitedLivesUntil && state.unlimitedLivesUntil > now) return 0;
  if (state.lives >= state.maxLives || !state.lastLifeLostAt) return 0;
  const elapsed = Math.max(0, now - state.lastLifeLostAt);
  const rem = LIFE_REFILL_MS - (elapsed % LIFE_REFILL_MS);
  return Math.ceil(rem / 1000);
}

export function hasUnlimitedLives(state: SaveState, now = Date.now()): boolean {
  return Boolean(state.unlimitedLivesUntil && state.unlimitedLivesUntil > now);
}

export function isVipActive(state: SaveState, now = Date.now()): boolean {
  return Boolean(state.vipUntil && state.vipUntil > now);
}

export function isAdFree(state: SaveState, now = Date.now()): boolean {
  return state.removeAds || isVipActive(state, now);
}

/** Builds today's deterministic Daily Challenge level */
export function buildDailyChallengeLevel(): LevelConfig {
  const today = getTodayKey();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }
  const sweets = ['laddu', 'jalebi', 'gulab_jamun', 'rasgulla', 'barfi', 'mysore_pak'] as const;
  const s1 = sweets[hash % sweets.length];
  const s2 = sweets[(hash + 3) % sweets.length];
  return {
    id: 9001,
    name: `Daily Avenger Op · ${today}`,
    region: 'festival',
    rows: 8,
    cols: 8,
    moves: 24,
    sweetTypesCount: 6,
    goals: [
      { type: 'collect', sweet: s1, target: 20 },
      { type: 'collect', sweet: s2, target: 20 },
    ],
    starThresholds: [3600, 6200, 9500],
    layout: [
      { r: 2, c: 2, jelly: 1 },
      { r: 2, c: 5, jelly: 1 },
      { r: 5, c: 2, jelly: 1 },
      { r: 5, c: 5, jelly: 1 },
      { r: 3, c: 3, blocker: 'ice' },
      { r: 4, c: 4, blocker: 'ice' },
    ],
    isDaily: true,
    seed: hash,
  };
}

/** Builds an endless Sim Training level with user-selected grid size */
export function buildRelaxLevel(gridSize: 7 | 8 | 9): LevelConfig {
  return {
    id: 9999,
    name: `Sim Training (${gridSize}×${gridSize})`,
    region: 'chennai_marina',
    rows: gridSize,
    cols: gridSize,
    moves: 9999,
    sweetTypesCount: 6,
    goals: [{ type: 'score', target: 9999999 }],
    starThresholds: [2500, 6000, 12000],
    isRelax: true,
  };
}

/** Builds the signature Doomsday Reactor Rush 3D showcase mode with live Avenger Dispatch Directives */
export function buildKadhaiRushLevel(): LevelConfig {
  return {
    id: 9500,
    name: 'Doomsday Reactor Rush',
    region: 'jaipur',
    rows: 8,
    cols: 8,
    moves: 22,
    sweetTypesCount: 6,
    goals: [{ type: 'score', target: 9999999 }],
    starThresholds: [4000, 9000, 16000],
    layout: [
      { r: 2, c: 2, jelly: 1 },
      { r: 2, c: 5, jelly: 1 },
      { r: 5, c: 2, jelly: 1 },
      { r: 5, c: 5, jelly: 1 },
    ],
    isKadhaiRush: true,
  };
}

/** Builds a high-adrenaline 60-Second Infinity Blitz Arcade run (zero hearts required, pure combo chasing!) */
export function buildBlitzLevel(): LevelConfig {
  return {
    id: 9600,
    name: '60s Infinity Blitz',
    region: 'delhi',
    rows: 8,
    cols: 8,
    moves: 9999,
    timeLimitSec: 60,
    sweetTypesCount: 5,
    goals: [{ type: 'score', target: 9999999 }],
    starThresholds: [5000, 12000, 22000],
    isBlitz: true,
  };
}

function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function loadSaveSync(): SaveState {
  const def = createDefaultSaveState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    const merged: SaveState = {
      ...def,
      ...parsed,
      winStreak: typeof parsed.winStreak === 'number' ? parsed.winStreak : 0,
      bestWinStreak: typeof parsed.bestWinStreak === 'number' ? parsed.bestWinStreak : 0,
      activeHeroId: typeof parsed.activeHeroId === 'string' ? parsed.activeHeroId : 'captain_nova',
      bounties:
        Array.isArray(parsed.bounties) && parsed.bounties.length > 0
          ? parsed.bounties
          : def.bounties,
      boosters: { ...def.boosters, ...(parsed.boosters ?? {}) },
      stats: { ...def.stats, ...(parsed.stats ?? {}) },
      dailyLogin: { ...def.dailyLogin, ...(parsed.dailyLogin ?? {}) },
      dailySpin: { ...def.dailySpin, ...(parsed.dailySpin ?? {}) },
      dailyChallenge: { ...def.dailyChallenge, ...(parsed.dailyChallenge ?? {}) },
      ads: { ...def.ads, ...(parsed.ads ?? {}) },
      settings: { ...def.settings, ...(parsed.settings ?? {}) },
    };
    return syncLivesFromClock(merged);
  } catch {
    return def;
  }
}

export async function loadSaveFromIDB(): Promise<SaveState | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('state');
      req.onsuccess = () => {
        if (req.result) {
          const def = createDefaultSaveState();
          const parsed = req.result as Partial<SaveState>;
          resolve(
            syncLivesFromClock({
              ...def,
              ...parsed,
              winStreak: typeof parsed.winStreak === 'number' ? parsed.winStreak : 0,
              bestWinStreak: typeof parsed.bestWinStreak === 'number' ? parsed.bestWinStreak : 0,
              activeHeroId: typeof parsed.activeHeroId === 'string' ? parsed.activeHeroId : 'captain_nova',
              bounties:
                Array.isArray(parsed.bounties) && parsed.bounties.length > 0
                  ? parsed.bounties
                  : def.bounties,
              boosters: { ...def.boosters, ...(parsed.boosters ?? {}) },
              stats: { ...def.stats, ...(parsed.stats ?? {}) },
              settings: { ...def.settings, ...(parsed.settings ?? {}) },
            })
          );
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function persistSave(state: SaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
  openIDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(state, 'state');
    } catch {
      // Ignore IDB errors
    }
  });
}

export function resetAllSaveData(): SaveState {
  const fresh = createDefaultSaveState();
  fresh.consentAccepted = true;
  persistSave(fresh);
  return fresh;
}
