import { FestivalId, MascotOutfit, RegionId, SweetType, ThemeId } from './types';

export interface ThemePalette {
  id: ThemeId;
  name: string;
  tagline: string;
  priceCoins: number; // 0 = free
  bgClass: string;
  boardFrameClass: string;
  tileBgClass: string;
  accentClass: string;
  accentBgClass: string;
  accentBorderClass: string;
  bannerGradient: string;
  ornamentSymbol: string;
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  classic: {
    id: 'classic',
    name: 'Doomsday Obsidian',
    tagline: 'Forged dark titanium & emerald lightning',
    priceCoins: 0,
    bgClass: 'from-[#05080F] via-[#0A1618] to-[#0B1220]',
    boardFrameClass: 'bg-gradient-to-b from-slate-900/95 to-emerald-950/90 border-emerald-500/60 shadow-emerald-950/40',
    tileBgClass: 'bg-slate-900/70 border-emerald-500/25',
    accentClass: 'text-emerald-400',
    accentBgClass: 'bg-emerald-600 hover:bg-emerald-500',
    accentBorderClass: 'border-emerald-500/60',
    bannerGradient: 'from-emerald-700 via-teal-700 to-slate-800',
    ornamentSymbol: '⚡',
  },
  diwali: {
    id: 'diwali',
    name: 'Stark Reactor Gold',
    tagline: 'Mark-85 crimson titanium & arc gold',
    priceCoins: 350,
    bgClass: 'from-[#16080A] via-[#260E12] to-[#120A07]',
    boardFrameClass: 'bg-gradient-to-b from-red-950/95 to-amber-950/90 border-amber-400/75 shadow-red-950/40',
    tileBgClass: 'bg-red-950/60 border-amber-500/35',
    accentClass: 'text-amber-400',
    accentBgClass: 'bg-red-600 hover:bg-red-500',
    accentBorderClass: 'border-amber-400/70',
    bannerGradient: 'from-red-700 via-amber-600 to-yellow-600',
    ornamentSymbol: '◆',
  },
  pongal: {
    id: 'pongal',
    name: 'Wakanda Vibranium',
    tagline: 'Kinetic violet steel & silver sheen',
    priceCoins: 350,
    bgClass: 'from-[#0B0617] via-[#1B0D33] to-[#0C0A1E]',
    boardFrameClass: 'bg-gradient-to-b from-indigo-950/95 to-purple-950/90 border-violet-400/70 shadow-purple-950/40',
    tileBgClass: 'bg-indigo-950/60 border-violet-400/30',
    accentClass: 'text-violet-300',
    accentBgClass: 'bg-violet-600 hover:bg-violet-500',
    accentBorderClass: 'border-violet-400/60',
    bannerGradient: 'from-violet-700 via-purple-600 to-indigo-700',
    ornamentSymbol: '◈',
  },
  holi: {
    id: 'holi',
    name: 'Quantum Realm',
    tagline: 'Subatomic neon cyan & magenta rift',
    priceCoins: 400,
    bgClass: 'from-[#060B1A] via-[#150B2E] to-[#061826]',
    boardFrameClass: 'bg-gradient-to-b from-slate-900/95 to-fuchsia-950/90 border-cyan-400/70 shadow-cyan-950/40',
    tileBgClass: 'bg-slate-900/65 border-cyan-400/30',
    accentClass: 'text-cyan-300',
    accentBgClass: 'bg-cyan-600 hover:bg-cyan-500',
    accentBorderClass: 'border-cyan-400/60',
    bannerGradient: 'from-cyan-600 via-fuchsia-600 to-violet-700',
    ornamentSymbol: '✦',
  },
  eid: {
    id: 'eid',
    name: 'Asgard Bifrost',
    tagline: 'Uru storm steel & celestial starlight',
    priceCoins: 400,
    bgClass: 'from-[#06131C] via-[#0B222E] to-[#111827]',
    boardFrameClass: 'bg-gradient-to-b from-sky-950/95 to-teal-950/90 border-amber-300/70 shadow-sky-950/40',
    tileBgClass: 'bg-sky-950/60 border-sky-400/30',
    accentClass: 'text-sky-300',
    accentBgClass: 'bg-sky-600 hover:bg-sky-500',
    accentBorderClass: 'border-sky-400/60',
    bannerGradient: 'from-sky-600 via-teal-600 to-amber-500',
    ornamentSymbol: '★',
  },
  christmas: {
    id: 'christmas',
    name: 'Jotunheim Cryo',
    tagline: 'Sub-zero frost armor & crimson pulse',
    priceCoins: 400,
    bgClass: 'from-[#08121E] via-[#102033] to-[#1A0D18]',
    boardFrameClass: 'bg-gradient-to-b from-slate-900/95 to-sky-950/90 border-sky-300/70 shadow-sky-950/40',
    tileBgClass: 'bg-slate-900/65 border-sky-300/30',
    accentClass: 'text-sky-300',
    accentBgClass: 'bg-rose-600 hover:bg-rose-500',
    accentBorderClass: 'border-sky-300/60',
    bannerGradient: 'from-sky-600 via-indigo-700 to-rose-600',
    ornamentSymbol: '❄',
  },
};

export interface RegionInfo {
  id: RegionId;
  title: string;
  subtitle: string;
  levelRange: [number, number];
  gradient: string;
  roadColor: string;
  badgeColor: string;
}

export const REGIONS: RegionInfo[] = [
  {
    id: 'chennai_marina',
    title: 'Sector I · Coastal Citadel',
    subtitle: 'First Avenger strike zone & coastal radar base',
    levelRange: [1, 12],
    gradient: 'from-slate-900 via-emerald-950/80 to-slate-900',
    roadColor: '#10B981',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'madurai_temple',
    title: 'Sector II · Sanctum Spires',
    subtitle: 'Skyline speedster intercept & plasma towers',
    levelRange: [13, 24],
    gradient: 'from-slate-900 via-rose-950/80 to-slate-900',
    roadColor: '#F43F5E',
    badgeColor: 'bg-rose-600',
  },
  {
    id: 'kanyakumari',
    title: 'Sector III · Trident Abyss',
    subtitle: 'Three-sea storm wall & orbital lightning core',
    levelRange: [25, 36],
    gradient: 'from-slate-900 via-cyan-950/80 to-slate-900',
    roadColor: '#06B6D4',
    badgeColor: 'bg-cyan-600',
  },
  {
    id: 'jaipur',
    title: 'Sector IV · Astral Fortress',
    subtitle: 'Time Stone vault & crystalline reality wards',
    levelRange: [37, 48],
    gradient: 'from-slate-900 via-fuchsia-950/80 to-slate-900',
    roadColor: '#D946EF',
    badgeColor: 'bg-fuchsia-600',
  },
  {
    id: 'delhi',
    title: 'Sector V · Doomsday Nexus',
    subtitle: 'Final Avengers Endgame assault on Doctor Doomsday',
    levelRange: [49, 60],
    gradient: 'from-slate-900 via-amber-950/80 to-emerald-950/90',
    roadColor: '#F59E0B',
    badgeColor: 'bg-amber-600',
  },
];

export interface FestivalEvent {
  id: FestivalId;
  name: string;
  themeId: ThemeId;
  levelId: number;
  rewardCoins: number;
  rewardStickerId: string;
  description: string;
}

export const FESTIVAL_EVENTS: FestivalEvent[] = [
  {
    id: 'diwali',
    name: 'Doomsday Incursion Raid',
    themeId: 'diwali',
    levelId: 101,
    rewardCoins: 250,
    rewardStickerId: 'st_diwali',
    description: 'Charge 25 Arc Reactors & 25 Vibranium Shields under emerald fire!',
  },
  {
    id: 'pongal',
    name: 'Wakanda Vault Defense',
    themeId: 'pongal',
    levelId: 102,
    rewardCoins: 250,
    rewardStickerId: 'st_pongal',
    description: 'Extract 3 Tesseract Cubes & power up Gauntlet Cores!',
  },
  {
    id: 'holi',
    name: 'Quantum Rift Breach',
    themeId: 'holi',
    levelId: 103,
    rewardCoins: 250,
    rewardStickerId: 'st_holi',
    description: 'Shatter 13 multi-layer Doomsday Energy Shields across the rift!',
  },
  {
    id: 'eid',
    name: 'Asgard Bifrost Siege',
    themeId: 'eid',
    levelId: 104,
    rewardCoins: 250,
    rewardStickerId: 'st_eid',
    description: 'Break Titanium Locks to deploy Storm Hammers & Reality Prisms!',
  },
  {
    id: 'christmas',
    name: 'Jotunheim Cryo Boss',
    themeId: 'christmas',
    levelId: 105,
    rewardCoins: 300,
    rewardStickerId: 'st_christmas',
    description: 'Defeat the Frost Giant Prime in a sub-zero Avengers duel!',
  },
];

export interface OutfitInfo {
  id: MascotOutfit;
  name: string;
  priceCoins: number;
  vipExclusive?: boolean;
  description: string;
}

export const MASCOT_OUTFITS: OutfitInfo[] = [
  { id: 'halwai', name: 'Mark I Doomsday', priceCoins: 0, description: 'Brushed dark titanium armor with glowing emerald arc core' },
  { id: 'diwali_sherwani', name: 'Stark Mark-85', priceCoins: 300, description: 'Crimson & molten-gold nanotech Avenger battle suit' },
  { id: 'pongal_veshti', name: 'Vibranium Stealth', priceCoins: 300, description: 'Midnight panther-weave armor with kinetic violet trim' },
  { id: 'holi_kurta', name: 'Quantum Time Suit', priceCoins: 350, description: 'White & neon-cyan subatomic multiverse tactical suit' },
  { id: 'royal_turban', name: 'Endgame Sovereign', priceCoins: 500, vipExclusive: true, description: 'VIP Infinity-plated obsidian armor with radiant gold visor' },
  { id: 'santa_chef', name: 'Crimson Sentinel', priceCoins: 350, description: 'Heavy crimson & arctic-silver polar strike exo-suit' },
];

export interface StickerItem {
  id: string;
  name: string;
  category: 'Sweets' | 'Cities' | 'Festivals';
  sweet?: SweetType;
  unlockHint: string;
}

export const STICKER_ALBUM: StickerItem[] = [
  { id: 'st_laddu', name: 'Arc Reactor Mk-I', category: 'Sweets', sweet: 'laddu', unlockHint: 'Complete Mission 1' },
  { id: 'st_jalebi', name: 'Vibranium Disc', category: 'Sweets', sweet: 'jalebi', unlockHint: 'Complete Mission 3' },
  { id: 'st_jamun', name: 'Uru Storm Hammer', category: 'Sweets', sweet: 'gulab_jamun', unlockHint: 'Complete Mission 5' },
  { id: 'st_rasgulla', name: 'Eye of Time Stone', category: 'Sweets', sweet: 'rasgulla', unlockHint: 'Create 5 Power Specials' },
  { id: 'st_barfi', name: 'Reality Prism Shard', category: 'Sweets', sweet: 'barfi', unlockHint: 'Hit a 4x Cascade Combo' },
  { id: 'st_mysore', name: 'Infinity Gauntlet Plate', category: 'Sweets', sweet: 'mysore_pak', unlockHint: 'Earn 15 Total Stars' },
  { id: 'st_chennai', name: 'Coastal Citadel Crest', category: 'Cities', unlockHint: 'Defeat Dread Sentinel (Lv 12)' },
  { id: 'st_madurai', name: 'Sanctum Spires Crest', category: 'Cities', unlockHint: 'Defeat Ultron Rift Core (Lv 24)' },
  { id: 'st_kanya', name: 'Trident Abyss Crest', category: 'Cities', unlockHint: 'Defeat Abyssal Leviathan (Lv 36)' },
  { id: 'st_jaipur', name: 'Astral Fortress Crest', category: 'Cities', unlockHint: 'Defeat Baron Mordo-X (Lv 48)' },
  { id: 'st_delhi', name: 'Doomsday Nexus Crest', category: 'Cities', unlockHint: 'Defeat Doctor Doomsday (Lv 60)' },
  { id: 'st_daily', name: 'S.H.I.E.L.D. Commendation', category: 'Cities', unlockHint: 'Complete a Daily Avenger Op' },
  { id: 'st_diwali', name: 'Incursion Sigil', category: 'Festivals', unlockHint: 'Complete Doomsday Incursion Raid' },
  { id: 'st_pongal', name: 'Vibranium Panther Seal', category: 'Festivals', unlockHint: 'Complete Wakanda Vault Defense' },
  { id: 'st_holi', name: 'Quantum Vortex Core', category: 'Festivals', unlockHint: 'Complete Quantum Rift Breach' },
  { id: 'st_eid', name: 'Bifrost Star Key', category: 'Festivals', unlockHint: 'Complete Asgard Bifrost Siege' },
  { id: 'st_christmas', name: 'Casket of Winters', category: 'Festivals', unlockHint: 'Complete Jotunheim Cryo Boss' },
  { id: 'st_master', name: 'Avengers Assemble Emblem', category: 'Festivals', unlockHint: 'Earn 50 Total Stars' },
];

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  check: (stats: {
    totalMatches: number;
    totalSpecials: number;
    totalBossesDefeated: number;
    totalLevelsWon: number;
    bestCombo: number;
    dailyChallengesWon: number;
    totalStars: number;
  }) => boolean;
}

export const ACHIEVEMENTS: AchievementItem[] = [
  { id: 'ach_first_win', title: 'Avenger Initiative', description: 'Complete your very first mission', rewardCoins: 100, check: (s) => s.totalLevelsWon >= 1 },
  { id: 'ach_matches_50', title: 'Tactical Recruit', description: 'Complete 50 total relic matches', rewardCoins: 120, check: (s) => s.totalMatches >= 50 },
  { id: 'ach_matches_300', title: 'Supreme Avenger', description: 'Complete 300 total relic matches', rewardCoins: 250, check: (s) => s.totalMatches >= 300 },
  { id: 'ach_special_10', title: 'Stark Weaponsmith', description: 'Forge 10 Power Specials', rewardCoins: 150, check: (s) => s.totalSpecials >= 10 },
  { id: 'ach_combo_4', title: 'Repulsor Cascade!', description: 'Trigger a 4x chain combo', rewardCoins: 180, check: (s) => s.bestCombo >= 4 },
  { id: 'ach_combo_7', title: 'Doomsday Surge', description: 'Trigger a 7x chain combo', rewardCoins: 350, check: (s) => s.bestCombo >= 7 },
  { id: 'ach_stars_15', title: 'Star Commander', description: 'Earn 15 stars across the saga map', rewardCoins: 200, check: (s) => s.totalStars >= 15 },
  { id: 'ach_stars_60', title: 'Multiverse Guardian', description: 'Earn 60 stars across all 5 Sectors', rewardCoins: 400, check: (s) => s.totalStars >= 60 },
  { id: 'ach_boss_1', title: 'Villain Breaker', description: 'Defeat your first Supervillain Boss', rewardCoins: 250, check: (s) => s.totalBossesDefeated >= 1 },
  { id: 'ach_boss_5', title: 'Doomsday Vanquisher', description: 'Defeat all 5 Saga Supervillain Bosses', rewardCoins: 800, check: (s) => s.totalBossesDefeated >= 5 },
  { id: 'ach_daily_1', title: 'Field Operative', description: 'Complete a Daily Avenger Op', rewardCoins: 150, check: (s) => s.dailyChallengesWon >= 1 },
  { id: 'ach_levels_25', title: 'Earth’s Mightiest', description: 'Win 25 missions total', rewardCoins: 300, check: (s) => s.totalLevelsWon >= 25 },
];

export interface FestivalPassTier {
  tier: number;
  xpRequired: number;
  freeLabel: string;
  freeReward: { coins?: number; booster?: 'hammer' | 'shuffle' | 'extra_moves' | 'color_bomb'; amount?: number };
  premiumLabel: string;
  premiumReward: { coins?: number; booster?: 'hammer' | 'shuffle' | 'extra_moves' | 'color_bomb'; amount?: number; outfit?: MascotOutfit };
}

export const FESTIVAL_PASS_TIERS: FestivalPassTier[] = [
  { tier: 1, xpRequired: 100, freeLabel: '100 Credits', freeReward: { coins: 100 }, premiumLabel: '2x Mjolnir Strike', premiumReward: { booster: 'hammer', amount: 2 } },
  { tier: 2, xpRequired: 250, freeLabel: '1x Quantum Shuffle', freeReward: { booster: 'shuffle', amount: 1 }, premiumLabel: '300 Credits', premiumReward: { coins: 300 } },
  { tier: 3, xpRequired: 450, freeLabel: '150 Credits', freeReward: { coins: 150 }, premiumLabel: '2x Infinity Orb', premiumReward: { booster: 'color_bomb', amount: 2 } },
  { tier: 4, xpRequired: 700, freeLabel: '1x +5 Turns', freeReward: { booster: 'extra_moves', amount: 1 }, premiumLabel: 'Stark Mark-85 Suit', premiumReward: { outfit: 'diwali_sherwani' } },
  { tier: 5, xpRequired: 1000, freeLabel: '300 Credits', freeReward: { coins: 300 }, premiumLabel: '750 Credits', premiumReward: { coins: 750 } },
];

export const SWEET_META: Record<
  SweetType,
  { name: string; color: string; symbol: string; shortShape: string }
> = {
  laddu: { name: 'Arc Reactor', color: '#06B6D4', symbol: '●', shortShape: 'Core' },
  jalebi: { name: 'Vibranium Shield', color: '#EF4444', symbol: '◎', shortShape: 'Shield' },
  gulab_jamun: { name: 'Storm Hammer', color: '#6366F1', symbol: '◆', shortShape: 'Hammer' },
  rasgulla: { name: 'Time Stone', color: '#10B981', symbol: '○', shortShape: 'Eye' },
  barfi: { name: 'Reality Prism', color: '#D946EF', symbol: '◇', shortShape: 'Prism' },
  mysore_pak: { name: 'Gauntlet Core', color: '#F59E0B', symbol: '■', shortShape: 'Hex' },
};
