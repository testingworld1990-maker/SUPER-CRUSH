import { KadhaiRecipeId, SweetType } from './types';

export interface KadhaiRecipeInfo {
  id: KadhaiRecipeId;
  name: string;
  tagline: string;
  effectSummary: string;
  comboHint: string;
  accentGradient: string;
  badgeText: string;
  bonusMoves: number;
}

export const KADHAI_RECIPES: Record<KadhaiRecipeId, KadhaiRecipeInfo> = {
  supernova: {
    id: 'supernova',
    name: 'Infinity Supernova',
    tagline: 'Triple-Same Relic Overload',
    effectSummary: 'Forges an Infinity Singularity Orb on the board + grants +2 Bonus Turns!',
    comboHint: 'Match the same relic 3 times in a row',
    accentGradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    badgeText: 'Infinity Orb +2 Turns',
    bonusMoves: 2,
  },
  kesar_trio: {
    id: 'kesar_trio',
    name: 'Repulsor Barrage',
    tagline: 'Stark-Vibranium Tactical Blend',
    effectSummary: 'Supercharges 3 relics into Repulsor Beams & triggers a tactical sweep!',
    comboHint: 'Mix 3 Tech relics (Arc Reactor, Vibranium Shield, Gauntlet Core)',
    accentGradient: 'from-red-600 via-amber-500 to-yellow-500',
    badgeText: '3x Repulsor Strike',
    bonusMoves: 0,
  },
  rabri_melt: {
    id: 'rabri_melt',
    name: 'Quantum Shatter',
    tagline: 'Mystic & Storm Fusion',
    effectSummary: 'Shatters up to 4 Cryo/Locked tiles & clears 4 Doom Shield layers!',
    comboHint: 'Mix 3 Cosmic relics (Storm Hammer, Time Stone, Reality Prism)',
    accentGradient: 'from-fuchsia-600 via-purple-600 to-cyan-500',
    badgeText: 'Break Shields & Locks',
    bonusMoves: 0,
  },
  masala_tadka: {
    id: 'masala_tadka',
    name: 'Doomsday Pulse',
    tagline: 'Avenger Team Fusion',
    effectSummary: 'Detonates a 3×3 emerald shockwave & deals heavy Boss damage!',
    comboHint: 'Any 3-relic combination in the Stark Arc Forge',
    accentGradient: 'from-emerald-600 via-green-500 to-teal-500',
    badgeText: '3×3 Shockwave',
    bonusMoves: 0,
  },
};

const TECH_RELICS = new Set<SweetType>(['laddu', 'jalebi', 'mysore_pak']);
const COSMIC_RELICS = new Set<SweetType>(['gulab_jamun', 'rasgulla', 'barfi']);

/**
 * Evaluates 3 relic charges collected in the Stark Arc Forge into an Avengers fusion strike.
 */
export function evaluateKadhaiRecipe(slots: SweetType[]): KadhaiRecipeId | null {
  if (slots.length < 3) return null;
  const [a, b, c] = slots;
  if (a === b && b === c) {
    return 'supernova';
  }
  if (TECH_RELICS.has(a) && TECH_RELICS.has(b) && TECH_RELICS.has(c)) {
    return 'kesar_trio';
  }
  if (COSMIC_RELICS.has(a) && COSMIC_RELICS.has(b) && COSMIC_RELICS.has(c)) {
    return 'rabri_melt';
  }
  return 'masala_tadka';
}

export interface RoyalGuestOrder {
  orderNumber: number;
  guestName: string;
  guestTitle: string;
  quote: string;
  targetType: 'recipe' | 'sweet_combo';
  requiredRecipe?: KadhaiRecipeId;
  requiredSweet?: SweetType;
  rewardCoins: number;
  rewardMoves: number;
}

const DIRECTIVE_POOL: Array<{
  guestName: string;
  guestTitle: string;
  quote: string;
  targetType: 'recipe' | 'sweet_combo';
  requiredRecipe?: KadhaiRecipeId;
  requiredSweet?: SweetType;
}> = [
  {
    guestName: 'Director Vance',
    guestTitle: 'Helicarrier Command',
    quote: 'Fire a Repulsor Barrage — lock in 3 Tech relics right now, Avenger!',
    targetType: 'recipe',
    requiredRecipe: 'kesar_trio',
  },
  {
    guestName: 'Commander Orion',
    guestTitle: 'Asgard Storm Division',
    quote: 'Channel any Arc Forge strike infused with Storm Hammer power!',
    targetType: 'sweet_combo',
    requiredSweet: 'gulab_jamun',
  },
  {
    guestName: 'Sorceress Lyra',
    guestTitle: 'Sanctum Keeper',
    quote: 'Unleash a Quantum Shatter — combine Hammer, Time Stone, or Reality Prism!',
    targetType: 'recipe',
    requiredRecipe: 'rabri_melt',
  },
  {
    guestName: 'Iron Titan',
    guestTitle: 'Stark Forge Marshal',
    quote: 'Overload the core with an Infinity Supernova — three identical relics!',
    targetType: 'recipe',
    requiredRecipe: 'supernova',
  },
  {
    guestName: 'Captain Nova',
    guestTitle: 'Field Squad Leader',
    quote: 'Route a Vibranium Shield signature into the Forge and fire!',
    targetType: 'sweet_combo',
    requiredSweet: 'jalebi',
  },
  {
    guestName: 'Agent Maya',
    guestTitle: 'Tactical Recon',
    quote: 'Feed an Arc Reactor charge into the Forge to stabilize the grid!',
    targetType: 'sweet_combo',
    requiredSweet: 'laddu',
  },
];

export function createGuestOrder(orderIndex: number): RoyalGuestOrder {
  const tpl = DIRECTIVE_POOL[orderIndex % DIRECTIVE_POOL.length];
  return {
    orderNumber: orderIndex + 1,
    ...tpl,
    rewardCoins: 45 + Math.min(80, orderIndex * 10),
    rewardMoves: 4,
  };
}

export function doesFusionSatisfyOrder(
  slots: SweetType[],
  recipeId: KadhaiRecipeId,
  order: RoyalGuestOrder
): boolean {
  if (order.targetType === 'recipe' && order.requiredRecipe) {
    return recipeId === order.requiredRecipe;
  }
  if (order.targetType === 'sweet_combo' && order.requiredSweet) {
    return slots.includes(order.requiredSweet);
  }
  return true;
}
