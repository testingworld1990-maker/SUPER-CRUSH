import { CityRegionId } from './stories';

export interface ActHeroComms {
  start: string;
  halfway: string;
  combo: string;
  lowMoves: string;
  bossHalf: string;
  victory: string;
}

export interface ActAtmosphere {
  arenaGradient: string;
  glowA: string;
  glowB: string;
  borderGlow: string;
  commAccentClass: string;
}

export interface HeroUltimateInfo {
  name: string;
  shortDesc: string;
  colorHex: string;
  gradientClass: string;
}

export interface SuperheroMember {
  id: string;
  codename: string;
  realName: string;
  role: string;
  powerSignature: string;
  regionId: CityRegionId;
  actNumber: 1 | 2 | 3 | 4 | 5;
  actLabel: string;
  movieTitle: string;
  squadStageLabel: string;
  unlockLevel: number;
  posterUrl: string;
  accentHex: string;
  badgeGrad: string;
  recruitmentLine: string;
  crossoverNextTitle?: string;
  crossoverNextTeaser?: string;
  atmosphere: ActAtmosphere;
  comms: ActHeroComms;
  ultimate: HeroUltimateInfo;
}

export const DOOMSDAY_LOGO_URL =
  '/src/assets/images/super_crush_doomsday_logo_1795428830964.jpg';

export const BOSS_VILLAIN_PORTRAIT =
  '/src/assets/images/hero_boss_sugar_emperor_1795427391281.jpg';

export const SUPERHERO_MOVIE_ACTS: SuperheroMember[] = [
  {
    id: 'captain_nova',
    codename: 'Captain Nova',
    realName: 'Commander Rex Vance',
    role: 'Shield Captain · Solo Origin',
    powerSignature: 'Vibranium Kinetic Shield',
    regionId: 'chennai_marina',
    actNumber: 1,
    actLabel: 'Act I · Solo Origin',
    movieTitle: 'Super Crush: First Avenger',
    squadStageLabel: '1 Hero · Solo Origin',
    unlockLevel: 1,
    posterUrl: '/src/assets/images/hero_act1_chennai_origin_1795427390741.jpg',
    accentHex: '#22D3EE',
    badgeGrad: 'from-cyan-500 via-emerald-500 to-teal-600',
    recruitmentLine:
      'Standing alone at the Coastal Citadel as Doomsday lightning tears the sky, Captain Nova raises the Vibranium Shield against the Dread Sentinel.',
    crossoverNextTitle: 'Act I → II Post-Credits · Signal at Sanctum Spires',
    crossoverNextTeaser: 'Supersonic crimson lightning streaks across the Sanctum skyline — an elite speedster answers Captain Nova’s Avenger beacon.',
    atmosphere: {
      arenaGradient: 'from-[#041524] via-[#09273D] to-[#062127]',
      glowA: 'rgba(34, 211, 238, 0.30)',
      glowB: 'rgba(16, 185, 129, 0.26)',
      borderGlow: 'border-cyan-400/80 shadow-[0_0_32px_rgba(34,211,238,0.28)]',
      commAccentClass: 'text-cyan-300',
    },
    comms: {
      start: 'Arc Core online! Lock onto the mission targets before Doomsday seals the grid.',
      halfway: 'Halfway through the target! Keep chaining 4-matches to blast rows clean!',
      combo: 'BOOM! That chain cascade just fried their coastal defense grid!',
      lowMoves: 'Final turns! Fire the Stark Arc Forge or tilt gravity for a zero-turn cascade!',
      bossHalf: 'Dread Sentinel armor is cracking — hit it with Repulsor Beams!',
      victory: 'Sector I secured! One mission closer to uniting the Avengers.',
    },
    ultimate: {
      name: 'Vibranium Ricochet',
      shortDesc: 'Smashes 6 Shields/Blockers & deals heavy Boss damage',
      colorHex: '#22D3EE',
      gradientClass: 'from-cyan-400 via-emerald-400 to-teal-400',
    },
  },
  {
    id: 'scarlet_bolt',
    codename: 'Scarlet Bolt',
    realName: 'Agent Maya Vex',
    role: 'Supersonic Speedster · Duo Formed',
    powerSignature: 'Mach-9 Plasma Trails',
    regionId: 'madurai_temple',
    actNumber: 2,
    actLabel: 'Act II · Dynamic Duo',
    movieTitle: 'Super Crush: Age of Sparks',
    squadStageLabel: '2 Heroes · Dynamic Duo',
    unlockLevel: 13,
    posterUrl: '/src/assets/images/hero_act2_madurai_duo_1795427401343.jpg',
    accentHex: '#FB7185',
    badgeGrad: 'from-rose-500 via-orange-500 to-amber-400',
    recruitmentLine:
      'Blazing across the Sanctum Spires at Mach-9, Scarlet Bolt locks in beside Captain Nova to shatter the Ultron Rift Core.',
    crossoverNextTitle: 'Act II → III Post-Credits · Distress from Trident Abyss',
    crossoverNextTeaser: 'Cataclysmic storm walls rise above the oceanic fault line — the Duo launches into Trident Abyss to recruit the Storm Guardian.',
    atmosphere: {
      arenaGradient: 'from-[#220714] via-[#341022] to-[#23140A]',
      glowA: 'rgba(251, 113, 133, 0.32)',
      glowB: 'rgba(251, 191, 36, 0.26)',
      borderGlow: 'border-rose-400/80 shadow-[0_0_32px_rgba(251,113,133,0.28)]',
      commAccentClass: 'text-rose-300',
    },
    comms: {
      start: 'Scarlet Bolt on comms! Ready to blur through these Sanctum relays?',
      halfway: '50% cleared already — Captain Nova, try to keep up with this speed!',
      combo: 'SUPERSONIC! Did you see that plasma cascade light up the whole spire?!',
      lowMoves: 'Clutch time! Detonate a Quantum Nova or swap two specials!',
      bossHalf: 'Ultron Rift Core is exposed — pour every combo straight into it!',
      victory: 'Sanctum Spires cleared at Mach-9! Our duo is unstoppable.',
    },
    ultimate: {
      name: 'Mach-9 Plasma Blur',
      shortDesc: 'Blasts 2 full lanes + deploys a free Repulsor Beam',
      colorHex: '#FB7185',
      gradientClass: 'from-rose-500 via-orange-400 to-amber-300',
    },
  },
  {
    id: 'deep_trident',
    codename: 'Deep Trident',
    realName: 'Commander Orion',
    role: 'Storm Powerhouse · Trio Formed',
    powerSignature: 'Uru Storm Trident',
    regionId: 'kanyakumari',
    actNumber: 3,
    actLabel: 'Act III · Storm Trio',
    movieTitle: 'Super Crush: Stormbreaker Tide',
    squadStageLabel: '3 Heroes · Storm Trio',
    unlockLevel: 25,
    posterUrl: '/src/assets/images/hero_act3_kanyakumari_trio_1795427391657.jpg',
    accentHex: '#38BDF8',
    badgeGrad: 'from-sky-500 via-indigo-500 to-cyan-400',
    recruitmentLine:
      'Channeling orbital lightning where three seas collide, Deep Trident joins the squad to smash the Abyssal Leviathan’s cryo armor.',
    crossoverNextTitle: 'Act III → IV Post-Credits · Rift Above Astral Fortress',
    crossoverNextTeaser: 'Emerald Time Stone portals fracture the Astral Fortress — the Trio ascends to recruit the Master of Reality.',
    atmosphere: {
      arenaGradient: 'from-[#06132E] via-[#0D2854] to-[#072638]',
      glowA: 'rgba(56, 189, 248, 0.34)',
      glowB: 'rgba(129, 140, 248, 0.28)',
      borderGlow: 'border-sky-400/80 shadow-[0_0_32px_rgba(56,189,248,0.28)]',
      commAccentClass: 'text-sky-300',
    },
    comms: {
      start: 'By thunder, the abyssal blockade falls today! Forge Repulsor & Nova combos!',
      halfway: 'The tide turns — half the mission target is already shattered!',
      combo: 'LIGHTNING STRIKE! The storm answers your every swap!',
      lowMoves: 'Few turns left — swing Mjolnir or shift 4-way gravity now!',
      bossHalf: 'Abyssal Leviathan roars in retreat! Strike the heart of the storm!',
      victory: 'Victory over the abyss! The Storm Trio stands unbroken.',
    },
    ultimate: {
      name: 'Orbital Stormbreaker',
      shortDesc: 'Calls 3 lightning columns + forges 2 Quantum Novas',
      colorHex: '#38BDF8',
      gradientClass: 'from-sky-400 via-indigo-400 to-cyan-300',
    },
  },
  {
    id: 'mystic_prism',
    codename: 'Mystic Prism',
    realName: 'Sorceress Lyra',
    role: 'Arcane Sorceress · Quartet Formed',
    powerSignature: 'Time & Reality Runes',
    regionId: 'jaipur',
    actNumber: 4,
    actLabel: 'Act IV · Astral Quartet',
    movieTitle: 'Super Crush: Multiverse Ward',
    squadStageLabel: '4 Heroes · Astral Quartet',
    unlockLevel: 37,
    posterUrl: '/src/assets/images/hero_act4_jaipur_quartet_1795427390866.jpg',
    accentHex: '#E879F9',
    badgeGrad: 'from-fuchsia-500 via-purple-500 to-cyan-400',
    recruitmentLine:
      'Weaving crystalline Reality Prisms across the Astral Fortress, Mystic Prism seals the incursion rift and unites the Quartet.',
    crossoverNextTitle: 'Act IV → V Endgame · Avengers Assemble for Doomsday',
    crossoverNextTeaser: 'Doctor Doomsday ignites the Nexus Citadel — all four heroes rally through a glowing portal to awaken Iron Titan for the Final Battle.',
    atmosphere: {
      arenaGradient: 'from-[#1B0930] via-[#2C124D] to-[#12163D]',
      glowA: 'rgba(232, 121, 249, 0.32)',
      glowB: 'rgba(139, 92, 246, 0.30)',
      borderGlow: 'border-fuchsia-400/80 shadow-[0_0_34px_rgba(232,121,249,0.28)]',
      commAccentClass: 'text-fuchsia-300',
    },
    comms: {
      start: 'I scanned 14 million timelines — match sharp and this victory is ours.',
      halfway: 'Half the astral seals are broken! Feel the Reality Prism surging.',
      combo: 'DIMENSIONAL CASCADE! Reality bends straight to your strategy!',
      lowMoves: 'Time runs thin — warp gravity or unleash an Infinity Orb!',
      bossHalf: 'The Rift Warden fractures — unleash your Arc Forge overload!',
      victory: 'The Astral Fortress belongs to the Quartet! Next stop: Doomsday Nexus.',
    },
    ultimate: {
      name: 'Time Stone Rewind',
      shortDesc: '+3 Turns (or +12s Blitz) & shatters 5 priority targets',
      colorHex: '#E879F9',
      gradientClass: 'from-fuchsia-400 via-purple-400 to-cyan-300',
    },
  },
  {
    id: 'iron_titan',
    codename: 'Iron Titan',
    realName: 'Tony-Class Forge Marshal',
    role: 'Armored Heavy · Full Team Assemble',
    powerSignature: 'Arc Reactor Overdrive Gauntlets',
    regionId: 'delhi',
    actNumber: 5,
    actLabel: 'Act V · Doomsday Assemble',
    movieTitle: 'Super Crush: Doomsday',
    squadStageLabel: '5 Heroes · Avengers Assembled',
    unlockLevel: 49,
    posterUrl: '/src/assets/images/hero_act5_delhi_assemble_1795427391399.jpg',
    accentHex: '#FBBF24',
    badgeGrad: 'from-emerald-400 via-amber-400 to-rose-500',
    recruitmentLine:
      'Clad in Mark-85 Arc Reactor armor, Iron Titan blasts through the Nexus portal — uniting all five Avengers for the final showdown with Doctor Doomsday!',
    atmosphere: {
      arenaGradient: 'from-[#061F17] via-[#0D3026] to-[#261B0A]',
      glowA: 'rgba(52, 211, 153, 0.34)',
      glowB: 'rgba(251, 191, 36, 0.28)',
      borderGlow: 'border-amber-400/80 shadow-[0_0_36px_rgba(251,191,36,0.28)]',
      commAccentClass: 'text-amber-300',
    },
    comms: {
      start: 'AVENGERS ASSEMBLE! Max power to the Arc Forge — bring down Doomsday!',
      halfway: 'Halfway done! Doctor Doomsday’s emerald citadel is shaking!',
      combo: 'ENDGAME POWER! That chain just rocked the entire multiverse!',
      lowMoves: 'Hold the line, Commander — every last turn decides the universe!',
      bossHalf: 'Doctor Doomsday is enraged! Combine two specials to shatter his throne!',
      victory: 'DOOMSDAY DEFEATED! The Avengers triumph across the multiverse!',
    },
    ultimate: {
      name: 'Mark-85 Unibeam',
      shortDesc: '3×3 core blast + cross laser & forges an Infinity Orb',
      colorHex: '#FBBF24',
      gradientClass: 'from-amber-300 via-emerald-400 to-rose-400',
    },
  },
];

export function getHeroById(heroId: string, unlockedLevel = 60): SuperheroMember {
  const found = SUPERHERO_MOVIE_ACTS.find((h) => h.id === heroId);
  if (found && unlockedLevel >= found.unlockLevel) {
    return found;
  }
  const unlocked = SUPERHERO_MOVIE_ACTS.filter((h) => unlockedLevel >= h.unlockLevel);
  return unlocked[unlocked.length - 1] ?? SUPERHERO_MOVIE_ACTS[0];
}

export function getMovieActForRegion(regionId: string): SuperheroMember {
  return (
    SUPERHERO_MOVIE_ACTS.find((m) => m.regionId === regionId) ??
    SUPERHERO_MOVIE_ACTS[0]
  );
}

export function getSquadState(unlockedLevel: number) {
  const assembledHeroes = SUPERHERO_MOVIE_ACTS.filter(
    (h) => unlockedLevel >= h.unlockLevel
  );
  const activeAct =
    assembledHeroes[assembledHeroes.length - 1] ?? SUPERHERO_MOVIE_ACTS[0];
  const nextRecruit =
    SUPERHERO_MOVIE_ACTS.find((h) => unlockedLevel < h.unlockLevel) ?? null;

  return {
    assembledHeroes,
    assembledCount: assembledHeroes.length,
    totalHeroes: SUPERHERO_MOVIE_ACTS.length,
    activeAct,
    nextRecruit,
    isFullTeamAssembled: assembledHeroes.length >= SUPERHERO_MOVIE_ACTS.length,
  };
}

export interface WinStreakInfo {
  tier: 0 | 1 | 2 | 3;
  label: string;
  perkShort: string;
  nextPerkHint: string;
  gradientClass: string;
}

export function getWinStreakInfo(winStreak: number): WinStreakInfo {
  if (winStreak >= 3) {
    return {
      tier: 3,
      label: 'OVERDRIVE MAX',
      perkShort: '+1 Beam · +1 Nova · +1 Infinity Orb',
      nextPerkHint: 'Max Momentum! Every win keeps 3 free specials on the board.',
      gradientClass: 'from-amber-400 via-fuchsia-500 to-cyan-400',
    };
  }
  if (winStreak === 2) {
    return {
      tier: 2,
      label: 'DUAL SURGE',
      perkShort: '+1 Repulsor Beam · +1 Quantum Nova',
      nextPerkHint: '1 more win unlocks a FREE Infinity Singularity Orb!',
      gradientClass: 'from-fuchsia-500 via-rose-500 to-amber-400',
    };
  }
  if (winStreak === 1) {
    return {
      tier: 1,
      label: 'IGNITED',
      perkShort: '+1 Free Repulsor Beam at launch',
      nextPerkHint: '1 more win adds a FREE Quantum Nova blast!',
      gradientClass: 'from-cyan-400 via-emerald-400 to-teal-300',
    };
  }
  return {
    tier: 0,
    label: 'READY',
    perkShort: 'Win 1 mission for a free starting Repulsor Beam',
    nextPerkHint: 'Reach a 3-win streak to start missions with 3 free specials!',
    gradientClass: 'from-slate-500 to-slate-400',
  };
}
