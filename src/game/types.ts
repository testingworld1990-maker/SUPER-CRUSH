export type SweetType =
  | 'laddu'
  | 'jalebi'
  | 'gulab_jamun'
  | 'rasgulla'
  | 'barfi'
  | 'mysore_pak';

export const ALL_SWEETS: SweetType[] = [
  'laddu',
  'jalebi',
  'gulab_jamun',
  'rasgulla',
  'barfi',
  'mysore_pak',
];

export type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'wrapped' | 'rainbow';

export type BlockerType = 'none' | 'ice' | 'locked' | 'stone';

export type GridSize = 7 | 8 | 9;

export type GravityDir = 'down' | 'right' | 'up' | 'left';

export type GameViewMode = 'classic' | 'thali_3d';

export type KadhaiRecipeId = 'supernova' | 'kesar_trio' | 'rabri_melt' | 'masala_tadka';

export interface Cell {
  id: string;
  row: number;
  col: number;
  sweet: SweetType | null;
  special: SpecialType;
  jelly: 0 | 1 | 2;
  blocker: BlockerType;
  isCherry?: boolean;
  isHole?: boolean;
  justDropped?: boolean;
  justMatched?: boolean;
}

export type GoalType = 'score' | 'jelly' | 'collect' | 'cherry' | 'boss';

export interface LevelGoal {
  type: GoalType;
  target: number;
  sweet?: SweetType;
}

export type RegionId =
  | 'chennai_marina'
  | 'madurai_temple'
  | 'kanyakumari'
  | 'jaipur'
  | 'delhi'
  | 'festival';

export interface CellOverride {
  r: number;
  c: number;
  jelly?: 1 | 2;
  blocker?: BlockerType;
  cherry?: boolean;
  hole?: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  region: RegionId;
  rows: GridSize;
  cols: GridSize;
  moves: number;
  timeLimitSec?: number;
  goals: LevelGoal[];
  starThresholds: [number, number, number];
  sweetTypesCount?: number; // 4, 5, or 6
  bossName?: string;
  bossHp?: number;
  festivalTag?: FestivalId;
  layout?: CellOverride[];
  tutorialKey?: 'swap' | 'special' | 'jelly';
  isRelax?: boolean;
  isDaily?: boolean;
  isCustom?: boolean;
  isKadhaiRush?: boolean;
  isBlitz?: boolean;
  seed?: number;
}

export type BoosterType = 'hammer' | 'shuffle' | 'extra_moves' | 'color_bomb';

export type ThemeId = 'classic' | 'diwali' | 'pongal' | 'holi' | 'eid' | 'christmas';

export type FestivalId = 'diwali' | 'pongal' | 'holi' | 'eid' | 'christmas';

export type MascotOutfit =
  | 'halwai'
  | 'diwali_sherwani'
  | 'pongal_veshti'
  | 'holi_kurta'
  | 'royal_turban'
  | 'santa_chef';

export type MascotMood = 'idle' | 'cheer' | 'gasp' | 'dance' | 'sad' | 'boss';

export type Language = 'en' | 'ta' | 'hi';

export type ScreenId =
  | 'splash'
  | 'menu'
  | 'map'
  | 'game'
  | 'editor';

export interface GameSettings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  colorBlindMode: boolean;
  theme: ThemeId;
  language: Language;
  relaxGridSize: GridSize;
  viewMode: GameViewMode;
}

export interface LevelProgress {
  stars: number; // 0..3
  bestScore: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: string;
  isPlayer?: boolean;
  city: string;
}

export type QuickBountyKind = 'matches' | 'specials' | 'combo' | 'wins' | 'collect_relic';

export interface QuickBounty {
  id: string;
  kind: QuickBountyKind;
  title: string;
  target: number;
  progress: number;
  sweet?: SweetType;
  rewardCoins?: number;
  rewardBooster?: BoosterType;
}

export interface SaveState {
  consentAccepted: boolean;
  playerName: string;
  unlockedLevel: number;
  levels: Record<number, LevelProgress>;
  festivalCompleted: Record<string, number>; // festivalLevelId -> stars
  coins: number;
  boosters: Record<BoosterType, number>;
  lives: number;
  maxLives: number;
  lastLifeLostAt: number | null;
  unlimitedLivesUntil: number | null;
  vipUntil: number | null;
  removeAds: boolean;
  premiumFestivalPass: boolean;
  festivalPassXp: number;
  festivalPassFreeClaimed: number[];
  festivalPassPremiumClaimed: number[];
  unlockedThemes: ThemeId[];
  unlockedOutfits: MascotOutfit[];
  equippedOutfit: MascotOutfit;
  stickersUnlocked: string[];
  achievementsUnlocked: string[];
  achievementsClaimed: string[];
  winStreak: number;
  bestWinStreak: number;
  activeHeroId: string;
  bounties: QuickBounty[];
  stats: {
    totalMatches: number;
    totalSpecials: number;
    totalBossesDefeated: number;
    totalLevelsWon: number;
    bestCombo: number;
    dailyChallengesWon: number;
    relaxHighScore: number;
    kadhaiOrdersBest: number;
    blitzHighScore: number;
  };
  dailyLogin: {
    streak: number; // 0..6
    lastClaimDate: string | null; // YYYY-MM-DD
    doubledToday: boolean;
  };
  dailySpin: {
    lastSpinDate: string | null;
    bonusSpinUsedDate: string | null;
  };
  dailyChallenge: {
    lastCompletedDate: string | null;
    bestTodayScore: number;
    leaderboard: LeaderboardEntry[];
  };
  ads: {
    totalCompletedLevels: number;
    completedSinceInterstitial: number;
    lastInterstitialAt: number;
  };
  settings: GameSettings;
  customLevels: LevelConfig[];
}

export interface Pos {
  row: number;
  col: number;
}

export interface MatchGroup {
  cells: Pos[];
  sweet: SweetType;
  spawnSpecial?: SpecialType;
  spawnAt?: Pos;
}

export interface StepResult {
  board: Cell[][];
  clearedPositions: Pos[];
  clearedSweets: Record<SweetType, number>;
  jellyCleared: number;
  cherriesDropped: number;
  bossDamage: number;
  specialsCreated: number;
  specialBlasts: Array<{ type: SpecialType | 'combo'; row: number; col: number }>;
  pointsGained: number;
}

export interface UndoSnapshot {
  board: Cell[][];
  score: number;
  movesLeft: number;
  collected: Record<SweetType, number>;
  cherriesDropped: number;
  bossHp: number;
}
