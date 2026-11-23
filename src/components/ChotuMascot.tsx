import React from 'react';
import { MascotMood, MascotOutfit } from '../game/types';

interface ChotuMascotProps {
  mood?: MascotMood;
  outfit?: MascotOutfit;
  quote?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ARMOR_PALETTES: Record<
  MascotOutfit,
  { armor: string; plate: string; visor: string; glow: string; emblem: string }
> = {
  halwai: { armor: '#1E293B', plate: '#334155', visor: '#10B981', glow: '#34D399', emblem: '#6EE7B7' },
  diwali_sherwani: { armor: '#991B1B', plate: '#F59E0B', visor: '#38BDF8', glow: '#FDE047', emblem: '#7DD3FC' },
  pongal_veshti: { armor: '#1E1B4B', plate: '#4C1D95', visor: '#A855F7', glow: '#C084FC', emblem: '#E9D5FF' },
  holi_kurta: { armor: '#F1F5F9', plate: '#DC2626', visor: '#06B6D4', glow: '#22D3EE', emblem: '#67E8F9' },
  royal_turban: { armor: '#0F172A', plate: '#D97706', visor: '#FACC15', glow: '#FDE047', emblem: '#FEF08A' },
  santa_chef: { armor: '#B91C1C', plate: '#E2E8F0', visor: '#38BDF8', glow: '#BAE6FD', emblem: '#FFFFFF' },
};

/**
 * Commander Nova — Armored Avengers Captain Mascot
 * Reacts live with battle cheers, alert gasps, victory surges, and 6 unlockable Armor Suits!
 */
export const ChotuMascot: React.FC<ChotuMascotProps> = ({
  mood = 'idle',
  outfit = 'halwai',
  quote,
  size = 'md',
}) => {
  const colors = ARMOR_PALETTES[outfit] ?? ARMOR_PALETTES.halwai;
  const dim = size === 'sm' ? 'w-14 h-14' : size === 'lg' ? 'w-28 h-28' : 'w-20 h-20';
  const animClass =
    mood === 'dance' || mood === 'cheer'
      ? 'animate-chotu-dance'
      : mood === 'gasp'
      ? 'animate-invalid-shake'
      : 'animate-chotu-bounce';

  return (
    <div className="flex items-center gap-3">
      <div className={`relative shrink-0 ${dim} ${animClass}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(16,185,129,0.35)]"
          aria-label="Captain Nova Avenger Commander"
        >
          {/* Tactical Cape / Energy Aura */}
          <path
            d="M16 88 L28 58 L72 58 L84 88 Z"
            fill={colors.armor}
            opacity="0.72"
            stroke={colors.glow}
            strokeWidth="1.5"
          />

          {/* Armored Torso & Pauldrons */}
          <path
            d="M22 90 C22 66 32 60 50 60 C68 60 78 66 78 90 Z"
            fill={colors.armor}
            stroke={colors.plate}
            strokeWidth="2.4"
          />
          {/* Shoulder Pauldrons */}
          <path d="M18 72 Q24 58 36 63 L33 74 Z" fill={colors.plate} stroke="#0F172A" strokeWidth="1.5" />
          <path d="M82 72 Q76 58 64 63 L67 74 Z" fill={colors.plate} stroke="#0F172A" strokeWidth="1.5" />

          {/* Glowing Chest Arc Reactor */}
          <polygon points="50,67 59,75 50,83 41,75" fill="#0F172A" stroke={colors.glow} strokeWidth="1.8" />
          <circle cx="50" cy="75" r="4.5" fill={colors.emblem} />
          <circle cx="50" cy="75" r="2.2" fill="#FFFFFF" />

          {/* Avenger Tactical Helmet */}
          <path
            d="M27 42 C27 21 38 14 50 14 C62 14 73 21 73 42 L70 57 C64 63 57 65 50 65 C43 65 36 63 30 57 Z"
            fill={colors.armor}
            stroke={colors.glow}
            strokeWidth="2.2"
          />
          {/* Helmet Crest & Brow Plate */}
          <path d="M44 15 L50 32 L56 15" fill={colors.plate} stroke={colors.glow} strokeWidth="1.2" />
          <path d="M32 37 L50 41 L68 37 L66 53 L50 58 L34 53 Z" fill={colors.plate} opacity="0.92" />

          {/* Heroic "A" Crest on Forehead */}
          <path
            d="M46.5 28 L50 19 L53.5 28 M47.8 25.5 L52.2 25.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glowing Tactical Visor Eyes based on Mood */}
          {mood === 'dance' || mood === 'cheer' ? (
            <g stroke={colors.glow} strokeWidth="3.2" fill="none" strokeLinecap="round">
              <path d="M36 45 Q41 40 46 45" />
              <path d="M54 45 Q59 40 64 45" />
            </g>
          ) : mood === 'gasp' ? (
            <g>
              <circle cx="41" cy="44" r="4.2" fill={colors.glow} />
              <circle cx="59" cy="44" r="4.2" fill={colors.glow} />
              <circle cx="41" cy="44" r="2" fill="#FFFFFF" />
              <circle cx="59" cy="44" r="2" fill="#FFFFFF" />
            </g>
          ) : mood === 'boss' ? (
            <g>
              <polygon points="34,40 47,45 36,47" fill="#F43F5E" />
              <polygon points="66,40 53,45 64,47" fill="#F43F5E" />
            </g>
          ) : mood === 'sad' ? (
            <g>
              <polygon points="35,46 46,43 45,47" fill={colors.visor} opacity="0.7" />
              <polygon points="65,46 54,43 55,47" fill={colors.visor} opacity="0.7" />
            </g>
          ) : (
            <g>
              <polygon points="35,41 47,44 45,47 36,46" fill={colors.glow} />
              <polygon points="65,41 53,44 55,47 64,46" fill={colors.glow} />
              <line x1="37" y1="43" x2="44" y2="44.5" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="63" y1="43" x2="56" y2="44.5" stroke="#FFFFFF" strokeWidth="1.2" />
            </g>
          )}

          {/* Chin Guard Seam */}
          <path d="M40 56 L50 59 L60 56" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />

          {/* Glowing Vibranium Energy Shield on Cheer/Dance */}
          {(mood === 'cheer' || mood === 'dance') && (
            <g>
              <circle cx="82" cy="64" r="11" fill="#DC2626" stroke="#E2E8F0" strokeWidth="2.2" />
              <circle cx="82" cy="64" r="6" fill="#1D4ED8" />
              <polygon points="82,59 83.5,63 87,63 84,65.5 85,69 82,67 79,69 80,65.5 77,63 80.5,63" fill="#FFFFFF" />
            </g>
          )}
        </svg>
      </div>

      {quote && (
        <div className="relative rounded-2xl bg-slate-900/92 px-3 py-2 text-xs sm:text-sm font-medium text-emerald-50 shadow-md border border-emerald-500/40 max-w-[240px]">
          <span className="block leading-snug">{quote}</span>
        </div>
      )}
    </div>
  );
};
