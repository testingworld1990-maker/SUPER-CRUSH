import { RegionId } from './types';

export interface ChapterStory {
  regionId: RegionId;
  chapterTitle: string;
  npcName: string;
  npcRole: string;
  introStory: string;
  climaxWarning: string;
  chapterRelief: string;
}

export interface LevelStoryBeat {
  title: string;
  dilemma: string;
  chotuLine: string;
  solvedRelief: string;
  npcThankYou: string;
  isMilestone?: boolean;
}

export const CHAPTER_STORIES: Record<Exclude<RegionId, 'festival'>, ChapterStory> = {
  chennai_marina: {
    regionId: 'chennai_marina',
    chapterTitle: 'Act I · First Avenger Protocol',
    npcName: 'Director Vance',
    npcRole: 'Helicarrier Command Officer',
    introStory:
      'Emerald lightning fractures the horizon above the Coastal Citadel! Doctor Doomsday’s vanguard, the Dread Sentinel, has scrambled Earth’s defense grid. Standing alone at dawn, Captain Nova activates the Vibranium Shield to hold the line.',
    climaxWarning:
      'The Dread Sentinel is charging its orbital plasma cannon above the Citadel Tower! Unleash Repulsor Beams and combos to crack its titanium hull.',
    chapterRelief:
      'Coastal Citadel secured! Radar arrays lock back online, civilians emerge cheering from the bunkers, and a crimson distress beacon flashes from the Sanctum Spires.',
  },
  madurai_temple: {
    regionId: 'madurai_temple',
    chapterTitle: 'Act II · Age of Sparks',
    npcName: 'Scarlet Bolt',
    npcRole: 'Supersonic Avenger Recruit',
    introStory:
      'Inside the neon-lit Sanctum Spires, Ultron Rift Core drones have sealed the power relays behind layered Doom Shields. Blazing in at Mach-9, Scarlet Bolt joins Captain Nova to form a Dynamic Duo!',
    climaxWarning:
      'High atop the central spire, the Ultron Rift Core projects hardened energy grids. Chain Quantum Novas to overload its central processor!',
    chapterRelief:
      'The Sanctum skyline lights up clean again! Scarlet Bolt locks shields with Captain Nova — two Avengers stand united as storm alerts surge across the Trident Abyss.',
  },
  kanyakumari: {
    regionId: 'kanyakumari',
    chapterTitle: 'Act III · Stormbreaker Tide',
    npcName: 'Deep Trident',
    npcRole: 'Storm Guardian Recruit',
    introStory:
      'Where three oceans crash against the continental shelf, the Abyssal Leviathan has flash-frozen the orbital defense relay in cryo-stasis. Wielding a storm-forged Uru Trident, Deep Trident joins the squad to form the Storm Trio!',
    climaxWarning:
      'The Abyssal Leviathan rises from the trench, coating the board in Cryo Stasis! Ignite high-voltage cascades to shatter its frost armor.',
    chapterRelief:
      'Thunder clears the storm wall! The oceanic relay powers back to 100%, and three Avengers board the Quinjet north toward the fracturing Astral Fortress.',
  },
  jaipur: {
    regionId: 'jaipur',
    chapterTitle: 'Act IV · Multiverse Ward',
    npcName: 'Mystic Prism',
    npcRole: 'Master of the Astral Sanctum',
    introStory:
      'Crimson-emerald rifts tear open above the Astral Fortress as Baron Mordo-X attempts to siphon the Time Stone vault. Weaving crystalline Reality Prisms, Mystic Prism unlocks the sanctum gates and joins as the fourth Avenger!',
    climaxWarning:
      'Inside the Mirror Hall, Baron Mordo-X traps the vault in Titanium Locks. Channel Infinity Singularities to break his arcane blockade!',
    chapterRelief:
      'The multiverse tears snap shut! Four Avengers stand beneath the restored Astral dome as a final golden portal opens toward the Doomsday Nexus.',
  },
  delhi: {
    regionId: 'delhi',
    chapterTitle: 'Act V · Avengers: Doomsday',
    npcName: 'Iron Titan',
    npcRole: 'Mark-85 Forge Marshal',
    introStory:
      'At last — the Doomsday Nexus! Doctor Doomsday towers behind double-layer emerald shields, preparing to rewrite reality itself. Blasting through the sky in Mark-85 Arc armor, Iron Titan unites all five Avengers for Endgame!',
    climaxWarning:
      'Doctor Doomsday unleashes his full cosmic gauntlet! Combine every Avenger Relic, Infinity Singularity, and Stark Arc Forge strike to save the universe.',
    chapterRelief:
      'DOOMSDAY AVERTED! Emerald storm clouds part into brilliant daylight across every Sector. All five Avengers stand victorious as Earth’s Mightiest Heroes!',
  },
};

const KEY_LEVEL_STORIES: Record<number, LevelStoryBeat> = {
  1: {
    title: 'First Avenger Deployment',
    dilemma: 'Doomsday scout drones have scrambled the Coastal Citadel’s Arc Reactor grid at dawn!',
    chotuLine: 'Align 3 matching Avenger Relics — let’s power up the defense grid!',
    solvedRelief: 'Defense grid online! The Coastal Citadel’s perimeter shields flash emerald-clear.',
    npcThankYou: '“Solid first strike, Captain Nova!” — Director Vance',
    isMilestone: true,
  },
  2: {
    title: 'Repulsor Calibration',
    dilemma: 'Incoming drone waves require heavy weapon surges before they breach Sector I.',
    chotuLine: 'Match 4 or 5 relics to forge Repulsor Beams and Infinity Orbs!',
    solvedRelief: 'Drone wave neutralized! Every defense turret is locked and charged.',
    npcThankYou: '“Weapons telemetry looking razor-sharp!”',
    isMilestone: true,
  },
  3: {
    title: 'Doom Shield Breach',
    dilemma: 'Doctor Doomsday’s emerald energy plating has fused across the command deck tiles!',
    chotuLine: 'Match relics directly over emerald Doom Shield tiles to shatter them!',
    solvedRelief: 'Command deck clear! All tactical consoles are unlocked and responsive.',
    npcThankYou: '“Shields wiped clean — nice work!”',
    isMilestone: true,
  },
  6: {
    title: 'Citadel Perimeter Hold',
    dilemma: 'A heavy drop-pod barrage scattered the Vibranium supply crates along the seawall.',
    chotuLine: 'Halfway to the Dread Sentinel — keep those cascades firing!',
    solvedRelief: 'Seawall secured! The Helicarrier drops fresh supply cores for the push ahead.',
    npcThankYou: '“Sector I perimeter is holding strong!”',
    isMilestone: true,
  },
  12: {
    title: 'Showdown: Dread Sentinel',
    dilemma: 'The towering Dread Sentinel locks onto the Coastal Citadel reactor with its plasma beam!',
    chotuLine: 'Big combos deal massive boss damage — bring this Sentinel down!',
    solvedRelief: 'TARGET NEUTRALIZED! The Dread Sentinel collapses in sparks as Sector I erupts in relief.',
    npcThankYou: '“Coastal Citadel saved! Next signal: Sanctum Spires!” — Director Vance',
    isMilestone: true,
  },
  13: {
    title: 'Duo Formed: Scarlet Bolt',
    dilemma: 'Ultron Rift drones swarmed the Sanctum Spires power junctions before sunrise.',
    chotuLine: 'Scarlet Bolt is on comms! Let’s sweep these junctions at Mach speed!',
    solvedRelief: 'Two heroes move twice as fast! The Sanctum skyline powers back on.',
    npcThankYou: '“Glad to have you on my wing, Captain!” — Scarlet Bolt',
    isMilestone: true,
  },
  24: {
    title: 'Boss: Ultron Rift Core',
    dilemma: 'The Ultron Rift Core sealed the central tower inside an impenetrable plasma firewall!',
    chotuLine: 'Unleash Quantum Novas and Repulsor Beams to shatter the Rift Core!',
    solvedRelief: 'FIREWALL SHATTERED! The Ultron swarm powers down across the entire city.',
    npcThankYou: '“Sanctum Spires are free! Onward to Trident Abyss!” — Scarlet Bolt',
    isMilestone: true,
  },
  25: {
    title: 'Trio Formed: Deep Trident',
    dilemma: 'Cryo storm waves flash-froze the oceanic relay array just before the Quinjet landed.',
    chotuLine: 'Deep Trident commands the storm — let’s thaw this grid with cosmic combos!',
    solvedRelief: 'Lightning shatters the frost! Three Avengers stand ready on the storm deck.',
    npcThankYou: '“The seas answer our call!” — Deep Trident',
    isMilestone: true,
  },
  36: {
    title: 'Boss: Abyssal Leviathan',
    dilemma: 'The armored Abyssal Leviathan surfaced to crush the deep-sea defense beacon!',
    chotuLine: 'Keep chaining cascades — every strike cracks the Leviathan’s cryo hull!',
    solvedRelief: 'LEVIATHAN DEFEATED! The ocean calms beneath golden sunlight as the Quinjet lifts off.',
    npcThankYou: '“Three oceans cleared — next stop, Astral Fortress!” — Deep Trident',
    isMilestone: true,
  },
  37: {
    title: 'Quartet Formed: Mystic Prism',
    dilemma: 'Interdimensional fissures are opening around the Astral Fortress vault doors.',
    chotuLine: 'Mystic Prism is holding the portal — match Reality Prisms to seal the breach!',
    solvedRelief: 'Fissures sealed! Four Avengers unite inside the shimmering Astral sanctum.',
    npcThankYou: '“The Time Stone vault is secure — for now.” — Mystic Prism',
    isMilestone: true,
  },
  48: {
    title: 'Boss: Baron Mordo-X',
    dilemma: 'Baron Mordo-X locked the Astral Vault and deployed mirrored reality barriers!',
    chotuLine: 'Charge Infinity Singularities to break Mordo-X’s arcane ward!',
    solvedRelief: 'WARD SHATTERED! Baron Mordo-X retreats into the shadows as the Endgame portal opens.',
    npcThankYou: '“Four heroes stand united — the Doomsday Nexus awaits!” — Mystic Prism',
    isMilestone: true,
  },
  49: {
    title: 'Full Team: Iron Titan Arrives',
    dilemma: 'Doomsday legions surround the Nexus Bridge as the final countdown begins!',
    chotuLine: 'Iron Titan just touched down — all five Avengers are assembled!',
    solvedRelief: 'Bridgehead taken! Five heroes march in formation straight toward Doctor Doomsday’s throne.',
    npcThankYou: '“Suit is at 400% capacity. Let’s finish this!” — Iron Titan',
    isMilestone: true,
  },
  60: {
    title: 'Endgame: Doctor Doomsday',
    dilemma: 'Doctor Doomsday channels the full cosmic rift to rewrite the multiverse!',
    chotuLine: 'AVENGERS ASSEMBLE! Unleash every Infinity Orb and Stark Arc Forge blast!',
    solvedRelief: 'VICTORY ACROSS THE MULTIVERSE! Doctor Doomsday’s emerald crown shatters into starlight as all five Avengers raise the shield!',
    npcThankYou: '“Earth’s Mightiest Heroes saved reality itself!” — Full Avengers Squad',
    isMilestone: true,
  },
};

const REGION_FLAVOR_TEMPLATES: Record<
  Exclude<RegionId, 'festival'>,
  Array<{ dilemma: (name: string) => string; relief: (name: string) => string; chotu: string; thankYou: string }>
> = {
  chennai_marina: [
    {
      dilemma: (n) => `At ${n}, Doomsday recon drones scrambled the coastal relay before reinforcements could arrive!`,
      relief: (n) => `Sector clear at ${n}! Coastal beacons lock back on target as the Helicarrier passes overhead.`,
      chotu: 'Fast tactical swaps — hold the line at Coastal Citadel!',
      thankYou: '“Outstanding precision, Captain!”',
    },
    {
      dilemma: (n) => `A plasma strike left hardened Doom Shields across the tactical deck at ${n}.`,
      relief: (n) => `Deck stabilized at ${n}! Every Arc Reactor core is humming at peak output.`,
      chotu: 'Watch how fast our shield breaks through!',
      thankYou: '“Citadel defenses restored!”',
    },
  ],
  madurai_temple: [
    {
      dilemma: (n) => `Rift drones are converging on ${n}, threatening to sever the Sanctum’s upper power grid.`,
      relief: (n) => `Grid secured at ${n}! Scarlet Bolt’s lightning trails sweep the last drone out of the sky.`,
      chotu: 'Sync up with Scarlet Bolt — speed and power!',
      thankYou: '“Sanctum Spires are holding!”',
    },
    {
      dilemma: (n) => `Armored Titanium Locks sealed the Vibranium reserves inside ${n}.`,
      relief: (n) => `Locks shattered at ${n}! The Duo recovers the supply caches without a scratch.`,
      chotu: 'No firewall can stop two Avengers!',
      thankYou: '“Clean sweep across the skyline!”',
    },
  ],
  kanyakumari: [
    {
      dilemma: (n) => `Sub-zero cryo mist from the Leviathan froze the weapon consoles at ${n}.`,
      relief: (n) => `Cryo stasis broken at ${n}! Deep Trident’s storm bolt restores full harbor power.`,
      chotu: 'High-energy combos will melt that cryo armor fast!',
      thankYou: '“Oceanic defenses back online!”',
    },
    {
      dilemma: (n) => `Heavy storm surges knocked out the sonar buoys surrounding ${n}.`,
      relief: (n) => `All buoys online at ${n}! The Storm Trio tracks the Leviathan’s exact heading.`,
      chotu: 'All three Avengers — unleash a tidal cascade!',
      thankYou: '“Trident Abyss is clearing up!”',
    },
  ],
  jaipur: [
    {
      dilemma: (n) => `Reality distortions warped the energy lattice inside ${n}, locking away key relics.`,
      relief: (n) => `Reality stabilized at ${n}! Mystic Prism seals the dimensional rift with emerald light.`,
      chotu: 'Focus your specials — stabilize the Astral Fortress!',
      thankYou: '“The Quartet is unstoppable!”',
    },
    {
      dilemma: (n) => `Baron Mordo-X placed arcane wards across ${n} to stall the Avengers’ advance.`,
      relief: (n) => `Wards dissolved at ${n}! The path toward the inner vault gleams wide open.`,
      chotu: 'One well-timed Infinity combo breaks every ward!',
      thankYou: '“Astral Fortress secured!”',
    },
  ],
  delhi: [
    {
      dilemma: (n) => `Doomsday shock troopers locked down ${n} with multi-layer shields and cryo traps.`,
      relief: (n) => `Shock troopers routed at ${n}! All five Avengers surge forward toward the Nexus throne.`,
      chotu: 'Full team power — light up the Doomsday Nexus!',
      thankYou: '“Avengers Assemble! Push to the finale!”',
    },
    {
      dilemma: (n) => `Doctor Doomsday deployed heavy Vibranium barricades across ${n} to halt the squad!`,
      relief: (n) => `Barricades pulverized at ${n}! Iron Titan clears the skies for the final confrontation.`,
      chotu: 'Nothing stops the Avengers now!',
      thankYou: '“Every Sector is backing you up!”',
    },
  ],
};

/** Returns a curated cinematic superhero story beat & mission victory epilogue */
export function getLevelStory(levelId: number, levelName: string, region: RegionId): LevelStoryBeat {
  if (KEY_LEVEL_STORIES[levelId]) {
    return KEY_LEVEL_STORIES[levelId];
  }
  const safeRegion: Exclude<RegionId, 'festival'> = region === 'festival' ? 'delhi' : region;
  const templates = REGION_FLAVOR_TEMPLATES[safeRegion];
  const tpl = templates[levelId % templates.length];
  return {
    title: levelName,
    dilemma: tpl.dilemma(levelName),
    chotuLine: tpl.chotu,
    solvedRelief: tpl.relief(levelName),
    npcThankYou: tpl.thankYou,
  };
}

export type CityRegionId = Exclude<RegionId, 'festival'>;

export interface AdventureLogEntry {
  id: string;
  regionId: CityRegionId;
  cityLabel: string;
  stampCode: string;
  orderInCity: 1 | 2 | 3 | 4;
  milestoneLabel: string;
  unlockRequirementText: string;
  requiredUnlockedLevel?: number;
  requiredCityClears?: number;
  requiredCityStars?: number;
  headline: string;
  snippet: string;
  chotuMarginNote: string;
}

/**
 * Avengers Mission Dossier — 20 classified field logs spanning all 5 Movie Saga Sectors
 */
export const ADVENTURE_LOG_ENTRIES: AdventureLogEntry[] = [
  // 1. SECTOR I: COASTAL CITADEL (Levels 1–12)
  {
    id: 'log_chn_1',
    regionId: 'chennai_marina',
    cityLabel: 'Sector I · Coastal Citadel',
    stampCode: 'SEC-01 · A',
    orderInCity: 1,
    milestoneLabel: 'Origin Dispatch',
    unlockRequirementText: 'Begin Act I at Mission 1',
    requiredUnlockedLevel: 1,
    headline: 'Emerald Lightning Over the Coastal Citadel',
    snippet:
      '05:40 Hours — Emerald storm fronts breached Sector I without warning. Captain Nova deployed solo from the coastal radar deck with the Vibranium Shield. Arc Reactor telemetry confirms Doctor Doomsday’s vanguard is already on the ground.',
    chotuMarginNote: 'Field Note: Vibranium Shield absorbs 100% of Sentinel shockwaves.',
  },
  {
    id: 'log_chn_2',
    regionId: 'chennai_marina',
    cityLabel: 'Sector I · Coastal Citadel',
    stampCode: 'SEC-01 · B',
    orderInCity: 2,
    milestoneLabel: 'Tactical Recon',
    unlockRequirementText: 'Clear 3 missions in Sector I',
    requiredCityClears: 3,
    headline: 'Decoding the Doomsday Energy Matrix',
    snippet:
      'Captured a scout drone along the breakwater. Its core uses the same emerald shielding now coating our defense grids. Matching 4+ relics triggers a localized Repulsor surge that strips the plating instantly.',
    chotuMarginNote: 'Stark Arc Forge calibration reached 99.4% efficiency.',
  },
  {
    id: 'log_chn_3',
    regionId: 'chennai_marina',
    cityLabel: 'Sector I · Coastal Citadel',
    stampCode: 'SEC-01 · C',
    orderInCity: 3,
    milestoneLabel: 'Villain Intel',
    unlockRequirementText: 'Clear 7 missions in Sector I',
    requiredCityClears: 7,
    headline: 'Dread Sentinel Sighted at Citadel Tower',
    snippet:
      'Long-range radar locked onto a 40-foot armored automaton scaling the lighthouse tower. Director Vance confirmed it is the Dread Sentinel — Doomsday’s first lieutenant guarding the Sector I jamming beacon.',
    chotuMarginNote: 'Loading extra Infinity Orbs for the tower showdown.',
  },
  {
    id: 'log_chn_4',
    regionId: 'chennai_marina',
    cityLabel: 'Sector I · Coastal Citadel',
    stampCode: 'SEC-01 · ★',
    orderInCity: 4,
    milestoneLabel: 'Act I Cleared',
    unlockRequirementText: 'Defeat Dread Sentinel (Mission 12)',
    requiredCityClears: 12,
    headline: 'First Victory & The Crimson Signal',
    snippet:
      'Dread Sentinel neutralized! As the coastal sky cleared, our encrypted receiver picked up a supersonic crimson signature streaking across the Sanctum Spires. Captain Nova isn’t fighting alone anymore.',
    chotuMarginNote: 'Quinjet fueled. Heading to Sector II to recruit Ally #2!',
  },

  // 2. SECTOR II: SANCTUM SPIRES (Levels 13–24)
  {
    id: 'log_mdu_1',
    regionId: 'madurai_temple',
    cityLabel: 'Sector II · Sanctum Spires',
    stampCode: 'SEC-02 · A',
    orderInCity: 1,
    milestoneLabel: 'Duo Formation',
    unlockRequirementText: 'Reach Sector II (Mission 13)',
    requiredUnlockedLevel: 13,
    headline: 'Mach-9 Rendezvous on the Skyline',
    snippet:
      'Touched down on the upper spire just as a streak of crimson plasma dismantled three Ultron interceptors in under a second. Meet Scarlet Bolt — fastest operative in the hemisphere and officially Avenger #2.',
    chotuMarginNote: 'Dynamic Duo active! Shield + Speedster combo is lethal.',
  },
  {
    id: 'log_mdu_2',
    regionId: 'madurai_temple',
    cityLabel: 'Sector II · Sanctum Spires',
    stampCode: 'SEC-02 · B',
    orderInCity: 2,
    milestoneLabel: 'Tactical Recon',
    unlockRequirementText: 'Clear 3 missions in Sector II',
    requiredCityClears: 3,
    headline: 'Breaking the Ultron Relay Locks',
    snippet:
      'Ultron’s sub-network sealed the city’s power relays behind hardened Titanium Locks. Scarlet Bolt’s high-frequency sweeps expose the weak nodes right before Captain Nova’s shield shatters them.',
    chotuMarginNote: 'Cross-combining Repulsor Beams clears entire skyline rows.',
  },
  {
    id: 'log_mdu_3',
    regionId: 'madurai_temple',
    cityLabel: 'Sector II · Sanctum Spires',
    stampCode: 'SEC-02 · C',
    orderInCity: 3,
    milestoneLabel: 'Villain Intel',
    unlockRequirementText: 'Clear 7 missions in Sector II',
    requiredCityClears: 7,
    headline: 'Tracing the Ultron Rift Core',
    snippet:
      'All hijacked energy flows up to a levitating sphere pulsing above the central spire. The Ultron Rift Core is feeding coordinates directly to Doctor Doomsday’s main citadel.',
    chotuMarginNote: 'Syncing Duo strike patterns for Mission 24.',
  },
  {
    id: 'log_mdu_4',
    regionId: 'madurai_temple',
    cityLabel: 'Sector II · Sanctum Spires',
    stampCode: 'SEC-02 · ★',
    orderInCity: 4,
    milestoneLabel: 'Act II Cleared',
    unlockRequirementText: 'Defeat Ultron Rift Core (Mission 24)',
    requiredCityClears: 12,
    headline: 'Spire Liberated — Storm Warning Ahead',
    snippet:
      'The Ultron Rift Core exploded in harmless cobalt sparks! Before the dust settled, ocean telemetry flagged a massive cryo storm wall forming over Trident Abyss. Time to recruit our powerhouse.',
    chotuMarginNote: 'Two Avengers strong. Course set for Trident Abyss!',
  },

  // 3. SECTOR III: TRIDENT ABYSS (Levels 25–36)
  {
    id: 'log_knk_1',
    regionId: 'kanyakumari',
    cityLabel: 'Sector III · Trident Abyss',
    stampCode: 'SEC-03 · A',
    orderInCity: 1,
    milestoneLabel: 'Trio Formation',
    unlockRequirementText: 'Reach Sector III (Mission 25)',
    requiredUnlockedLevel: 25,
    headline: 'Thunder Over Three Colliding Seas',
    snippet:
      'Lightning split the hurricane clouds as Deep Trident leaped onto the offshore rig, driving his Uru Storm Trident into the deck to deflect an incoming ice barrage. The Storm Trio is officially live.',
    chotuMarginNote: 'Uru lightning supercharges every Storm Hammer on the board.',
  },
  {
    id: 'log_knk_2',
    regionId: 'kanyakumari',
    cityLabel: 'Sector III · Trident Abyss',
    stampCode: 'SEC-03 · B',
    orderInCity: 2,
    milestoneLabel: 'Tactical Recon',
    unlockRequirementText: 'Clear 3 missions in Sector III',
    requiredCityClears: 3,
    headline: 'Shattering Sub-Zero Cryo Stasis',
    snippet:
      'Deep-sea relay cores were encased in glacial cryo blocks. Chaining Quantum Novas beside frozen tiles shatters entire clusters in a single pulse, freeing Tesseract drops to reach extraction.',
    chotuMarginNote: 'Gravity Shift on the Helicarrier deck bypasses stone walls!',
  },
  {
    id: 'log_knk_3',
    regionId: 'kanyakumari',
    cityLabel: 'Sector III · Trident Abyss',
    stampCode: 'SEC-03 · C',
    orderInCity: 3,
    milestoneLabel: 'Villain Intel',
    unlockRequirementText: 'Clear 7 missions in Sector III',
    requiredCityClears: 7,
    headline: 'Sonar Contact: Abyssal Leviathan',
    snippet:
      'A colossal armored serpent forged from Doomsday alloy breached the surface two kilometers south. Its cryo breath freezes entire sectors unless interrupted by relentless cascade strikes.',
    chotuMarginNote: 'Charging Stark Arc Forge to maximum output.',
  },
  {
    id: 'log_knk_4',
    regionId: 'kanyakumari',
    cityLabel: 'Sector III · Trident Abyss',
    stampCode: 'SEC-03 · ★',
    orderInCity: 4,
    milestoneLabel: 'Act III Cleared',
    unlockRequirementText: 'Defeat Abyssal Leviathan (Mission 36)',
    requiredCityClears: 12,
    headline: 'Calm Seas & An Astral Distress Call',
    snippet:
      'With a synchronized three-hero strike, the Abyssal Leviathan powered down and sank into the trench! Overhead, glowing magenta runes shimmered in the sky — Mystic Prism is calling from the Astral Fortress.',
    chotuMarginNote: 'Three Avengers locked in. Ascending to Sector IV!',
  },

  // 4. SECTOR IV: ASTRAL FORTRESS (Levels 37–48)
  {
    id: 'log_jpr_1',
    regionId: 'jaipur',
    cityLabel: 'Sector IV · Astral Fortress',
    stampCode: 'SEC-04 · A',
    orderInCity: 1,
    milestoneLabel: 'Quartet Formation',
    unlockRequirementText: 'Reach Sector IV (Mission 37)',
    requiredUnlockedLevel: 37,
    headline: 'Stepping Through the Mirror Sanctum',
    snippet:
      'Gravity twists sideways inside the Astral Fortress. Mystic Prism greeted our squad amidst spinning emerald Time Stone rings, offering full access to the Sanctum’s Reality Prisms. Quartet assembled!',
    chotuMarginNote: 'Reality Prisms bend cascade angles in our favor.',
  },
  {
    id: 'log_jpr_2',
    regionId: 'jaipur',
    cityLabel: 'Sector IV · Astral Fortress',
    stampCode: 'SEC-04 · B',
    orderInCity: 2,
    milestoneLabel: 'Tactical Recon',
    unlockRequirementText: 'Clear 3 missions in Sector IV',
    requiredCityClears: 3,
    headline: 'Guarding the Time Stone Vault',
    snippet:
      'Doctor Doomsday wants the Time Stone to lock Earth in permanent conquest. Mystic Prism erected layered wards while our squad cleared incursion anomalies across the outer halls.',
    chotuMarginNote: 'Zero temporal breaches recorded on our watch.',
  },
  {
    id: 'log_jpr_3',
    regionId: 'jaipur',
    cityLabel: 'Sector IV · Astral Fortress',
    stampCode: 'SEC-04 · C',
    orderInCity: 3,
    milestoneLabel: 'Villain Intel',
    unlockRequirementText: 'Clear 7 missions in Sector IV',
    requiredCityClears: 7,
    headline: 'Baron Mordo-X’s Arcane Blockade',
    snippet:
      'Rogue sorcerer Baron Mordo-X ambushed the inner courtyard, sealing the portal to Doomsday Nexus with crimson chains. Only high-tier special combos can fracture his mirror barriers.',
    chotuMarginNote: 'Prepare Infinity Singularity + Repulsor Beam combos.',
  },
  {
    id: 'log_jpr_4',
    regionId: 'jaipur',
    cityLabel: 'Sector IV · Astral Fortress',
    stampCode: 'SEC-04 · ★',
    orderInCity: 4,
    milestoneLabel: 'Act IV Cleared',
    unlockRequirementText: 'Defeat Baron Mordo-X (Mission 48)',
    requiredCityClears: 12,
    headline: 'The Endgame Portal Opens',
    snippet:
      'Baron Mordo-X fell back as Mystic Prism spun open a golden sling-ring portal directly to the Doomsday Nexus! Through the sparks, a gleaming red-and-gold armored silhouette hovers ready to join.',
    chotuMarginNote: 'Four Avengers stepping through — Iron Titan awaits!',
  },

  // 5. SECTOR V: DOOMSDAY NEXUS (Levels 49–60)
  {
    id: 'log_del_1',
    regionId: 'delhi',
    cityLabel: 'Sector V · Doomsday Nexus',
    stampCode: 'SEC-05 · A',
    orderInCity: 1,
    milestoneLabel: 'Full Team Assemble',
    unlockRequirementText: 'Reach Sector V (Mission 49)',
    requiredUnlockedLevel: 49,
    headline: 'Mark-85 Touchdown — All Five Heroes United',
    snippet:
      'Sonic booms rattled the obsidian skyline as Iron Titan landed beside Captain Nova, Scarlet Bolt, Deep Trident, and Mystic Prism. The full 5-hero Avengers roster stands united for the final assault!',
    chotuMarginNote: 'Avengers Assemble! Every relic hits with peak synergy.',
  },
  {
    id: 'log_del_2',
    regionId: 'delhi',
    cityLabel: 'Sector V · Doomsday Nexus',
    stampCode: 'SEC-05 · B',
    orderInCity: 2,
    milestoneLabel: 'Tactical Recon',
    unlockRequirementText: 'Clear 3 missions in Sector V',
    requiredCityClears: 3,
    headline: 'Breaching the Obsidian Citadel Walls',
    snippet:
      'Doctor Doomsday’s inner ring combines every hazard we’ve faced: double Doom Shields, Cryo Stasis, Titanium Locks, and Vibranium Walls. Together, the five Avengers carve straight through.',
    chotuMarginNote: 'Stark Arc Forge overloads are shredding outer turrets.',
  },
  {
    id: 'log_del_3',
    regionId: 'delhi',
    cityLabel: 'Sector V · Doomsday Nexus',
    stampCode: 'SEC-05 · C',
    orderInCity: 3,
    milestoneLabel: 'Final Boss Intel',
    unlockRequirementText: 'Clear 7 missions in Sector V',
    requiredCityClears: 7,
    headline: 'Threshold of Doctor Doomsday’s Throne',
    snippet:
      'Every liberated Sector is channeling orbital power straight to our Helicarrier. Ahead stands Doctor Doomsday himself — clad in dark titanium and crackling with emerald multiverse lightning.',
    chotuMarginNote: 'One last battle. Whatever it takes.',
  },
  {
    id: 'log_del_4',
    regionId: 'delhi',
    cityLabel: 'Sector V · Doomsday Nexus',
    stampCode: 'SEC-05 · ★',
    orderInCity: 4,
    milestoneLabel: 'Endgame Victory',
    unlockRequirementText: 'Defeat Doctor Doomsday (Mission 60)',
    requiredCityClears: 12,
    headline: 'Super Crush: Doomsday — Multiverse Saved!',
    snippet:
      'All five Avengers combined their signature powers into a single blinding Infinity Supernova! Doctor Doomsday’s gauntlet shattered, the emerald storm dissolved into sunrise, and peace returned across every Sector.',
    chotuMarginNote: 'Saga Complete — Victory March 3D & Multiverse Ops unlocked!',
  },
];

const REGION_RANGES: Record<CityRegionId, [number, number]> = {
  chennai_marina: [1, 12],
  madurai_temple: [13, 24],
  kanyakumari: [25, 36],
  jaipur: [37, 48],
  delhi: [49, 60],
};

export function isAdventureEntryUnlocked(
  entry: AdventureLogEntry,
  unlockedLevel: number,
  levelsProgress: Record<number, { stars: number; completed: boolean }>
): boolean {
  const [start, end] = REGION_RANGES[entry.regionId];
  if (entry.requiredUnlockedLevel !== undefined) {
    return unlockedLevel >= entry.requiredUnlockedLevel;
  }
  let clears = 0;
  let stars = 0;
  for (let id = start; id <= end; id++) {
    if (levelsProgress[id]?.completed) clears++;
    stars += levelsProgress[id]?.stars ?? 0;
  }
  if (entry.requiredCityClears !== undefined) {
    return clears >= entry.requiredCityClears;
  }
  if (entry.requiredCityStars !== undefined) {
    return stars >= entry.requiredCityStars;
  }
  return false;
}

export function getAdventureLogSummary(
  unlockedLevel: number,
  levelsProgress: Record<number, { stars: number; completed: boolean }>
) {
  const unlockedEntries = ADVENTURE_LOG_ENTRIES.filter((e) =>
    isAdventureEntryUnlocked(e, unlockedLevel, levelsProgress)
  );
  const latestEntry = unlockedEntries[unlockedEntries.length - 1] ?? ADVENTURE_LOG_ENTRIES[0];
  return {
    unlockedCount: unlockedEntries.length,
    totalCount: ADVENTURE_LOG_ENTRIES.length,
    unlockedEntries,
    latestEntry,
  };
}
