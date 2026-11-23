import React from 'react';
import { SWEET_META } from '../game/themes';
import { SpecialType, SweetType } from '../game/types';

interface SweetIconProps {
  sweet: SweetType;
  special?: SpecialType;
  colorBlindMode?: boolean;
  className?: string;
}

/**
 * Hand-crafted glossy vector Avengers Superhero Relics.
 * Each relic has BOTH a distinct color AND a distinct geometric silhouette for accessibility:
 *  - laddu       -> Arc Reactor (electric cyan circular Stark core)
 *  - jalebi      -> Vibranium Shield (crimson-silver-blue concentric star shield)
 *  - gulab_jamun -> Storm Hammer (forged Uru titanium hammer with storm lightning)
 *  - rasgulla    -> Time Stone (Doomsday emerald mystic eye medallion)
 *  - barfi       -> Reality Prism (royal magenta faceted diamond crystal)
 *  - mysore_pak  -> Gauntlet Core (molten solar-gold hexagonal Infinity armor plate)
 */
const RELIC_GLOW: Record<SweetType, string> = {
  laddu: 'drop-shadow-[0_0_7px_rgba(34,211,238,0.75)]',
  jalebi: 'drop-shadow-[0_0_7px_rgba(251,113,133,0.75)]',
  gulab_jamun: 'drop-shadow-[0_0_7px_rgba(129,140,248,0.8)]',
  rasgulla: 'drop-shadow-[0_0_7px_rgba(52,211,153,0.8)]',
  barfi: 'drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]',
  mysore_pak: 'drop-shadow-[0_0_7px_rgba(251,191,36,0.8)]',
};

export const SweetIcon: React.FC<SweetIconProps> = ({
  sweet,
  special = 'none',
  colorBlindMode = false,
  className = 'w-full h-full',
}) => {
  if (special === 'rainbow') {
    return (
      <svg
        viewBox="0 0 64 64"
        className={`${className} drop-shadow-[0_0_12px_rgba(52,211,153,0.95)]`}
        aria-label="Infinity Singularity Orb"
      >
        <defs>
          <radialGradient id="inf-core" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="28%" stopColor="#A7F3D0" />
            <stop offset="58%" stopColor="#10B981" />
            <stop offset="85%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#0F172A" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="27" fill="url(#inf-core)" stroke="#FEF08A" strokeWidth="2.4" className="animate-special-pulse" />
        <g className="origin-center animate-spin-slow">
          <circle cx="32" cy="32" r="20.5" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="6 4" opacity="0.92" />
          {/* 6 Infinity Stone orbiting gems */}
          <circle cx="32" cy="7.5" r="4.5" fill="#22D3EE" stroke="#FFF" strokeWidth="1.2" />
          <circle cx="53.5" cy="19.5" r="4.5" fill="#FB7185" stroke="#FFF" strokeWidth="1.2" />
          <circle cx="53.5" cy="44.5" r="4.5" fill="#FB923C" stroke="#FFF" strokeWidth="1.2" />
          <circle cx="32" cy="56.5" r="4.5" fill="#34D399" stroke="#FFF" strokeWidth="1.2" />
          <circle cx="10.5" cy="44.5" r="4.5" fill="#C084FC" stroke="#FFF" strokeWidth="1.2" />
          <circle cx="10.5" cy="19.5" r="4.5" fill="#FDE047" stroke="#FFF" strokeWidth="1.2" />
        </g>
        <polygon points="32,17 36.5,27.5 47,32 36.5,36.5 32,47 27.5,36.5 17,32 27.5,27.5" fill="#FFFFFF" opacity="0.98" />
        <circle cx="32" cy="32" r="5" fill="#22D3EE" />
      </svg>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Quantum Nova (Wrapped) luminous prism blast ring */}
      {special === 'wrapped' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-fuchsia-500/60 via-cyan-400/55 to-amber-400/65 ring-2 ring-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.9)] animate-special-pulse"
        />
      )}

      <svg
        viewBox="0 0 64 64"
        className={`relative z-10 w-[92%] h-[92%] ${RELIC_GLOW[sweet]}`}
        aria-label={SWEET_META[sweet].name}
      >
        {/* 1. Arc Reactor (Electric Cyan Stark Core) */}
        {sweet === 'laddu' && (
          <g>
            <defs>
              <radialGradient id="g-arc" cx="45%" cy="40%" r="58%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="36%" stopColor="#A5F3FC" />
                <stop offset="72%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#0E7490" />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="25.5" fill="#0C4A6E" stroke="#67E8F9" strokeWidth="2.6" />
            <circle cx="32" cy="32" r="21" fill="url(#g-arc)" />
            {/* 8 magnetic coil spokes */}
            <g stroke="#083344" strokeWidth="2.6" strokeLinecap="round" opacity="0.82">
              <line x1="32" y1="10.5" x2="32" y2="17.5" />
              <line x1="32" y1="46.5" x2="32" y2="53.5" />
              <line x1="10.5" y1="32" x2="17.5" y2="32" />
              <line x1="46.5" y1="32" x2="53.5" y2="32" />
              <line x1="16.5" y1="16.5" x2="21.5" y2="21.5" />
              <line x1="42.5" y1="42.5" x2="47.5" y2="47.5" />
              <line x1="47.5" y1="16.5" x2="42.5" y2="21.5" />
              <line x1="21.5" y1="42.5" x2="16.5" y2="47.5" />
            </g>
            <polygon points="32,19 44,39.5 20,39.5" fill="#FFFFFF" stroke="#0891B2" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="32" cy="32" r="5.5" fill="#CFFAFE" />
            <circle cx="29.5" cy="29.5" r="2" fill="#FFFFFF" />
          </g>
        )}

        {/* 2. Vibranium Shield (Vibrant Crimson / Platinum / Cobalt Star Disc) */}
        {sweet === 'jalebi' && (
          <g>
            <defs>
              <linearGradient id="g-shield-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDA4AF" />
                <stop offset="35%" stopColor="#F43F5E" />
                <stop offset="80%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
              <linearGradient id="g-shield-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#94A3B8" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="25.5" fill="url(#g-shield-red)" stroke="#FECDD3" strokeWidth="1.8" />
            <circle cx="32" cy="32" r="19.5" fill="url(#g-shield-silver)" />
            <circle cx="32" cy="32" r="14.5" fill="url(#g-shield-red)" />
            <circle cx="32" cy="32" r="10.2" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.2" />
            <polygon
              points="32,22.5 34.6,29 41.5,29.4 36,33.6 37.9,40.2 32,36.2 26.1,40.2 28,33.6 22.5,29.4 29.4,29"
              fill="#FFFFFF"
            />
            <path d="M15 20 A21 21 0 0 1 44 13.5" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" opacity="0.78" />
          </g>
        )}

        {/* 3. Storm Hammer (Electric Indigo Uru Hammer + Cyan Lightning Bolt) */}
        {sweet === 'gulab_jamun' && (
          <g>
            <defs>
              <linearGradient id="g-uru" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EEF2FF" />
                <stop offset="38%" stopColor="#818CF8" />
                <stop offset="78%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#1E1B4B" />
              </linearGradient>
            </defs>
            <rect x="28" y="34" width="8" height="23" rx="3" fill="#B45309" stroke="#FDE68A" strokeWidth="1.4" />
            <line x1="28.5" y1="41" x2="35.5" y2="41" stroke="#FEF08A" strokeWidth="1.8" />
            <line x1="28.5" y1="47" x2="35.5" y2="47" stroke="#FEF08A" strokeWidth="1.8" />
            <circle cx="32" cy="56" r="4.5" fill="#CBD5E1" stroke="#312E81" strokeWidth="1.5" />
            <polygon
              points="13,11 51,11 56.5,16.5 56.5,33.5 51,39 13,39 7.5,33.5 7.5,16.5"
              fill="url(#g-uru)"
              stroke="#E0E7FF"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <rect x="14" y="15.5" width="36" height="19" rx="2.5" fill="#312E81" opacity="0.4" />
            <path
              d="M35.5 14 L24 26 L31.5 26 L27.5 37 L41 23 L33.5 23 Z"
              fill="#67E8F9"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* 4. Time Stone (Radiant Emerald Mystic Eye Medallion) */}
        {sweet === 'rasgulla' && (
          <g>
            <defs>
              <radialGradient id="g-time" cx="45%" cy="38%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="32%" stopColor="#6EE7B7" />
                <stop offset="72%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#064E3B" />
              </radialGradient>
            </defs>
            <path
              d="M5 32 Q32 7 59 32 Q32 57 5 32 Z"
              fill="#064E3B"
              stroke="#FDE047"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M12 32 Q32 14 52 32 Q32 50 12 32 Z" fill="url(#g-time)" />
            <circle cx="32" cy="32" r="10.5" fill="none" stroke="#D1FAE5" strokeWidth="2" strokeDasharray="3.5 2.5" />
            <polygon points="32,21 40,32 32,43 24,32" fill="#FFFFFF" opacity="0.96" />
            <circle cx="32" cy="32" r="4.2" fill="#059669" />
            <circle cx="30" cy="29.5" r="1.8" fill="#FFFFFF" />
          </g>
        )}

        {/* 5. Reality Prism (Luminous Fuchsia-Violet Cosmic Diamond) */}
        {sweet === 'barfi' && (
          <g>
            <defs>
              <linearGradient id="g-reality" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDF4FF" />
                <stop offset="35%" stopColor="#F0ABFC" />
                <stop offset="70%" stopColor="#D946EF" />
                <stop offset="100%" stopColor="#86198F" />
              </linearGradient>
            </defs>
            <polygon
              points="32,4.5 57,32 32,59.5 7,32"
              fill="url(#g-reality)"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <polygon points="32,4.5 45,32 32,59.5 19,32" fill="#FFFFFF" opacity="0.28" />
            <polygon points="32,12 46,32 32,33 18,32" fill="#FFFFFF" opacity="0.68" />
            <line x1="7" y1="32" x2="57" y2="32" stroke="#F5D0FE" strokeWidth="1.6" opacity="0.85" />
            <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
          </g>
        )}

        {/* 6. Gauntlet Core (Solar Molten-Gold Hexagonal Infinity Plate) */}
        {sweet === 'mysore_pak' && (
          <g>
            <defs>
              <linearGradient id="g-gauntlet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF9C3" />
                <stop offset="38%" stopColor="#FACC15" />
                <stop offset="75%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
            <polygon
              points="32,6 55,18.5 55,45.5 32,58 9,45.5 9,18.5"
              fill="url(#g-gauntlet)"
              stroke="#FFFBEB"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <polygon
              points="32,13.5 48,22.5 48,41.5 32,50.5 16,41.5 16,22.5"
              fill="#92400E"
              opacity="0.42"
            />
            <polygon points="32,18 44,32 32,46 20,32" fill="#FEF08A" stroke="#FFFFFF" strokeWidth="1.8" />
            <circle cx="32" cy="32" r="5.5" fill="#FFFFFF" />
            <circle cx="32" cy="11" r="2" fill="#FFFBEB" />
            <circle cx="32" cy="53" r="2" fill="#FFFBEB" />
          </g>
        )}
      </svg>

      {/* Repulsor Beam Indicator (High-visibility electric plasma rails + directional chevrons) */}
      {special === 'striped_h' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 via-white to-cyan-300 shadow-[0_0_10px_#22d3ee]" />
          <div className="h-1 rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-amber-300 shadow-[0_0_8px_#34d399]" />
        </div>
      )}
      {special === 'striped_v' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          <div className="w-1.5 rounded-full bg-gradient-to-b from-cyan-300 via-white to-cyan-300 shadow-[0_0_10px_#22d3ee]" />
          <div className="w-1 rounded-full bg-gradient-to-b from-amber-300 via-emerald-300 to-amber-300 shadow-[0_0_8px_#34d399]" />
        </div>
      )}

      {/* Color-blind Accessibility Symbol Badge */}
      {colorBlindMode && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0.5 right-0.5 z-30 flex h-4 w-4 items-center justify-center rounded-sm bg-slate-950/90 border border-white/30 text-[10px] font-bold leading-none text-white"
        >
          {SWEET_META[sweet].symbol}
        </span>
      )}
    </div>
  );
};

/**
 * Drop Collectible Icon: Glowing Electric-Blue Tesseract Cube
 */
export const CherryIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 64 64"
    className={`${className} drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]`}
    aria-label="Tesseract Cube"
  >
    <defs>
      <radialGradient id="g-tesseract" cx="45%" cy="40%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#7DD3FC" />
        <stop offset="80%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#1E3A8A" />
      </radialGradient>
    </defs>
    {/* Isometric cosmic cube */}
    <polygon points="32,8 54,20 54,44 32,56 10,44 10,20" fill="url(#g-tesseract)" stroke="#E0F2FE" strokeWidth="2.4" strokeLinejoin="round" />
    <polyline points="10,20 32,32 54,20" fill="none" stroke="#BAE6FD" strokeWidth="2" />
    <line x1="32" y1="32" x2="32" y2="56" stroke="#BAE6FD" strokeWidth="2" />
    {/* Inner cosmic energy flare */}
    <polygon points="32,18 42,24 42,38 32,44 22,38 22,24" fill="#FFFFFF" opacity="0.4" />
    <circle cx="32" cy="31" r="6" fill="#FFFFFF" opacity="0.92" />
  </svg>
);
