import React, { useEffect, useState } from 'react';
import { ActiveAdOverlay, AD_UNIT_IDS, AdService, BannerPosition, TEST_MODE } from '../services/adService';
import { Play, ShieldCheck, X } from 'lucide-react';

/**
 * Full-screen Ad Overlay managed strictly by AdService.
 * Used in Web/QA preview when native Capacitor AdMob is not attached.
 * Rewarded ads grant the reward ONLY when the countdown completes cleanly.
 */
export const AdModalOverlay: React.FC = () => {
  const [overlay, setOverlay] = useState<ActiveAdOverlay | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    return AdService.subscribeOverlay((next) => {
      setOverlay(next);
      if (next) setSecondsLeft(next.durationSec);
    });
  }, []);

  useEffect(() => {
    if (!overlay || secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [overlay, secondsLeft]);

  if (!overlay) return null;

  const isComplete = secondsLeft === 0;
  const unitId = overlay.kind === 'rewarded' ? AD_UNIT_IDS.REWARDED : AD_UNIT_IDS.INTERSTITIAL;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={TEST_MODE ? 'Sponsored Test Ad Preview' : 'Sponsored Content'}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[#0B111D] text-slate-100 shadow-2xl border border-emerald-500/40">
        <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>{TEST_MODE ? 'Ad Preview (Test Mode)' : 'Sponsored'}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{overlay.kind}</span>
          </div>
          {isComplete ? (
            <button
              onClick={() => overlay.resolve(true)}
              className="flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              Claim &amp; Close
            </button>
          ) : (
            <button
              onClick={() => overlay.resolve(false)}
              className="flex min-h-[36px] items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
              title="Closing early forfeits reward"
            >
              <X className="w-3.5 h-3.5" />
              Skip ({secondsLeft}s)
            </button>
          )}
        </div>

        <div className="p-6 text-center bg-gradient-to-b from-slate-900 to-[#070B12]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Play className="w-8 h-8 fill-current" />
          </div>
          <h3 className="text-lg font-bold text-white">
            {overlay.kind === 'rewarded' ? 'Super Crush Supply Drop Video' : 'Avenger Tactical Intermission'}
          </h3>
          <p className="mt-1.5 text-sm text-slate-300">
            {isComplete
              ? 'Transmission completed! Tap Claim & Close to receive your reward.'
              : `Please wait ${secondsLeft}s to finish watching...`}
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${((overlay.durationSec - secondsLeft) / overlay.durationSec) * 100}%` }}
            />
          </div>
          {TEST_MODE && (
            <p className="mt-4 truncate font-mono text-[11px] text-slate-500">
              Placement: {overlay.placement} · Unit: {unitId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Non-intrusive Banner Ad Slot — rendered ONLY on Main Menu & Level Map when online and not Ad-Free.
 * Automatically yields to native Android AdMob banner inside packaged Capacitor APKs to avoid duplicate banners.
 * Never rendered during gameplay.
 */
export const AdBannerSlot: React.FC<{
  allowedPosition: BannerPosition;
  isAdFree: boolean;
  isOnline: boolean;
  onRemoveAdsClick: () => void;
}> = ({ allowedPosition, isAdFree, isOnline, onRemoveAdsClick }) => {
  const [activePos, setActivePos] = useState<BannerPosition | null>(null);

  useEffect(() => {
    return AdService.subscribeBanner(setActivePos);
  }, []);

  // When native Capacitor AdMob renders the real bottom banner, reserve clean safe-area spacer only
  if (isAdFree || !isOnline || activePos !== allowedPosition) return null;
  if (AdService.isNativeAdMob()) {
    return <div className="h-[56px] w-full pb-safe" aria-hidden="true" />;
  }
  if (!TEST_MODE) return null;

  return (
    <div className="mx-auto mt-3 pb-safe w-full max-w-xl">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 shadow-sm">
        <div className="min-w-0 truncate">
          <span className="font-semibold text-emerald-400">Sponsored</span>
          <span className="mx-1.5 text-slate-600">·</span>
          <span className="text-slate-300">Stark Industries Tactical Gear</span>
        </div>
        <button
          onClick={onRemoveAdsClick}
          className="shrink-0 whitespace-nowrap rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-2.5 py-1.5 font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
        >
          Remove Ads
        </button>
      </div>
    </div>
  );
};
