import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ADVENTURE_LOG_ENTRIES,
  CityRegionId,
  getAdventureLogSummary,
  isAdventureEntryUnlocked,
} from '../game/stories';
import { getMovieActForRegion } from '../game/superheroes';
import { REGIONS } from '../game/themes';
import { SaveState } from '../game/types';
import { ChotuMascot } from './ChotuMascot';
import { Compass, Lock, MapPin, Shield, Sparkles, Star, X } from 'lucide-react';

interface AdventureLogModalProps {
  save: SaveState;
  initialCity?: CityRegionId | 'all';
  onClose: () => void;
  onJumpToCity?: (regionId: CityRegionId) => void;
}

const STAMP_STYLES: Record<
  CityRegionId,
  { ring: string; fill: string; text: string; short: string; motif: string }
> = {
  chennai_marina: {
    ring: 'border-emerald-400',
    fill: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    short: 'Sector I',
    motif: '⚡',
  },
  madurai_temple: {
    ring: 'border-rose-400',
    fill: 'bg-rose-950/80',
    text: 'text-rose-300',
    short: 'Sector II',
    motif: '✦',
  },
  kanyakumari: {
    ring: 'border-cyan-400',
    fill: 'bg-cyan-950/80',
    text: 'text-cyan-300',
    short: 'Sector III',
    motif: '◈',
  },
  jaipur: {
    ring: 'border-fuchsia-400',
    fill: 'bg-fuchsia-950/80',
    text: 'text-fuchsia-300',
    short: 'Sector IV',
    motif: '❖',
  },
  delhi: {
    ring: 'border-amber-400',
    fill: 'bg-amber-950/80',
    text: 'text-amber-300',
    short: 'Sector V',
    motif: '★',
  },
};

export const AdventureLogModal: React.FC<AdventureLogModalProps> = ({
  save,
  initialCity = 'all',
  onClose,
  onJumpToCity,
}) => {
  const [cityFilter, setCityFilter] = useState<CityRegionId | 'all'>(initialCity);

  const summary = useMemo(
    () => getAdventureLogSummary(save.unlockedLevel, save.levels),
    [save.unlockedLevel, save.levels]
  );

  const visibleEntries = useMemo(() => {
    return cityFilter === 'all'
      ? ADVENTURE_LOG_ENTRIES
      : ADVENTURE_LOG_ENTRIES.filter((e) => e.regionId === cityFilter);
  }, [cityFilter]);

  const progressPct = Math.round((summary.unlockedCount / Math.max(1, summary.totalCount)) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Avengers Mission Dossier"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden rounded-3xl bg-[#0B121E] text-slate-100 shadow-2xl border border-emerald-500/45"
      >
        <div className="bg-gradient-to-r from-[#071915] via-[#0B2D24] to-[#0F172A] px-5 py-4 text-white shrink-0 border-b border-emerald-500/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:block shrink-0">
                <ChotuMascot mood="cheer" outfit={save.equippedOutfit} size="sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Super Crush: Doomsday · Classified Intel</span>
                </div>
                <h2 className="mt-0.5 text-xl sm:text-2xl font-black tracking-tight text-white">
                  Avengers Mission Dossier
                </h2>
                <div className="mt-0.5 text-xs text-slate-300 tabular-nums">
                  {summary.unlockedCount} of {summary.totalCount} Field Logs Decrypted · {progressPct}% Complete
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close Mission Dossier"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Sector Filter Bar */}
        <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setCityFilter('all')}
              className={`min-h-[36px] rounded-xl px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                cityFilter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              All Sectors ({summary.unlockedCount}/{summary.totalCount})
            </button>
            {REGIONS.map((reg) => {
              const cid = reg.id as CityRegionId;
              const cityEntries = ADVENTURE_LOG_ENTRIES.filter((e) => e.regionId === cid);
              const cityUnlocked = cityEntries.filter((e) =>
                isAdventureEntryUnlocked(e, save.unlockedLevel, save.levels)
              ).length;
              return (
                <button
                  key={cid}
                  onClick={() => setCityFilter(cid)}
                  className={`min-h-[36px] rounded-xl px-3 text-xs font-bold transition-colors whitespace-nowrap tabular-nums ${
                    cityFilter === cid
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {STAMP_STYLES[cid].short} ({cityUnlocked}/{cityEntries.length})
                </button>
              );
            })}
          </div>
        </div>

        {/* Decrypted Field Logs Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {visibleEntries.map((entry, idx) => {
            const unlocked = isAdventureEntryUnlocked(entry, save.unlockedLevel, save.levels);
            const stamp = STAMP_STYLES[entry.regionId];
            const movieAct = getMovieActForRegion(entry.regionId);
            const regInfo = REGIONS.find((r) => r.id === entry.regionId);
            const cityStars = regInfo
              ? Array.from({ length: 12 }, (_, k) => regInfo.levelRange[0] + k).reduce(
                  (acc, lvlId) => acc + (save.levels[lvlId]?.stars ?? 0),
                  0
                )
              : 0;

            return (
              <motion.article
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.28) }}
                className={`relative overflow-hidden rounded-2xl border transition-colors ${
                  unlocked
                    ? 'border-slate-700 bg-slate-900/95 shadow-sm'
                    : 'border-dashed border-slate-800 bg-slate-950/60'
                }`}
              >
                {unlocked && (
                  <div className="relative h-28 w-full overflow-hidden bg-slate-950">
                    <img
                      src={movieAct.posterUrl}
                      alt={`${movieAct.actLabel}: ${movieAct.movieTitle}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#0B121E] via-black/35 to-transparent"
                    />
                    <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between gap-2 text-[11px] font-bold text-emerald-300">
                      <span>{movieAct.actLabel} · {movieAct.codename}</span>
                      <span>{movieAct.squadStageLabel}</span>
                    </div>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <span className={stamp.text}>{entry.cityLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{entry.milestoneLabel}</span>
                        {unlocked && entry.orderInCity === 4 && cityStars === 36 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              36/36 Gold Seal
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="mt-1 text-base sm:text-lg font-black text-white leading-snug">
                        {unlocked ? entry.headline : 'Classified S.H.I.E.L.D. Transmission'}
                      </h3>
                    </div>

                    <div
                      aria-hidden="true"
                      className={`shrink-0 flex flex-col items-center justify-center h-14 w-14 rounded-xl border-2 border-dashed font-mono ${
                        unlocked
                          ? `${stamp.ring} ${stamp.fill} ${stamp.text} rotate-3`
                          : 'border-slate-700 bg-slate-900 text-slate-500'
                      }`}
                    >
                      {unlocked ? (
                        <>
                          <span className="text-base leading-none">{stamp.motif}</span>
                          <span className="mt-1 text-[9px] font-bold tracking-tight">{entry.stampCode}</span>
                        </>
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {unlocked ? (
                    <>
                      <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
                        {entry.snippet}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-start gap-1.5 text-xs italic text-emerald-300/90">
                          <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-400" />
                          <span>“{entry.chotuMarginNote}”</span>
                        </div>

                        {onJumpToCity && (
                          <button
                            onClick={() => {
                              onJumpToCity(entry.regionId);
                              onClose();
                            }}
                            className="flex min-h-[34px] items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-slate-700 border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Deploy to {stamp.short}</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{entry.unlockRequirementText} to decrypt this field log.</span>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
