import { SaveState } from '../game/types';
import { soundService } from './soundService';
import { isAdFree } from './storageService';

/**
 * Single AdService Abstraction Layer for Super Crush: Doomsday (Android APK & Web PWA)
 * ------------------------------------------------------------------------------------
 * - Reads Vite env vars (`VITE_ADMOB_TEST_MODE`, `VITE_ADMOB_REWARDED_ID`,
 *   `VITE_ADMOB_INTERSTITIAL_ID`, `VITE_ADMOB_BANNER_ID`) so production AdMob IDs
 *   are NEVER hardcoded in source control.
 * - Auto-detects native `@capacitor-community/admob` when packaged as an Android APK,
 *   while seamlessly falling back to the compliant in-app preview overlay on Web/QA.
 * - Automatically pauses/resumes Web Audio around full-screen ads (Google Play policy).
 */

const ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const TEST_MODE: boolean = ENV.VITE_ADMOB_TEST_MODE !== 'false';

// Official Google AdMob Android Test Ad Unit IDs (safe defaults when env vars are unset)
export const AD_UNIT_IDS = {
  REWARDED: ENV.VITE_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',
  INTERSTITIAL: ENV.VITE_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
  BANNER: ENV.VITE_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
} as const;

export type RewardedPlacement =
  | 'out_of_moves_5'
  | 'fail_revive'
  | 'booster_bar_free'
  | 'refill_lives'
  | 'double_daily_reward'
  | 'bonus_daily_spin'
  | 'win_2x_coins';

export type InterstitialPlacement = 'level_complete_to_map';
export type BannerPosition = 'menu_bottom' | 'map_bottom';

export interface ActiveAdOverlay {
  kind: 'rewarded' | 'interstitial';
  placement: string;
  durationSec: number;
  resolve: (completed: boolean) => void;
}

interface CapacitorAdMobPlugin {
  initialize: (options?: { initializeForTesting?: boolean }) => Promise<void>;
  prepareRewardVideoAd: (options: { adId: string; isTesting?: boolean }) => Promise<void>;
  showRewardVideoAd: () => Promise<{ type?: string; amount?: number } | void>;
  prepareInterstitial: (options: { adId: string; isTesting?: boolean }) => Promise<void>;
  showInterstitial: () => Promise<void>;
  showBanner: (options: {
    adId: string;
    adSize?: string;
    position?: string;
    margin?: number;
    isTesting?: boolean;
  }) => Promise<void>;
  hideBanner: () => Promise<void>;
}

type OverlayListener = (overlay: ActiveAdOverlay | null) => void;

const MIN_LEVELS_BEFORE_INTERSTITIAL = 5;
const LEVELS_PER_INTERSTITIAL = 4;
const MIN_INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

function getNativeAdMob(): CapacitorAdMobPlugin | null {
  if (typeof window === 'undefined') return null;
  const cap = (
    window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { AdMob?: CapacitorAdMobPlugin } };
    }
  ).Capacitor;
  if (cap?.isNativePlatform?.() && cap.Plugins?.AdMob) {
    return cap.Plugins.AdMob;
  }
  return null;
}

class AdServiceImpl {
  private listener: OverlayListener | null = null;
  private bannerPosition: BannerPosition | null = null;
  private bannerListeners = new Set<(pos: BannerPosition | null) => void>();
  private consentAccepted = false;
  private nativeInitialized = false;
  private adFreeOverride = false;

  public subscribeOverlay(listener: OverlayListener): () => void {
    this.listener = listener;
    return () => {
      if (this.listener === listener) this.listener = null;
    };
  }

  public subscribeBanner(listener: (pos: BannerPosition | null) => void): () => void {
    this.bannerListeners.add(listener);
    listener(this.bannerPosition);
    return () => {
      this.bannerListeners.delete(listener);
    };
  }

  public isOnline(): boolean {
    if (typeof navigator === 'undefined') return false;
    return navigator.onLine;
  }

  public isNativeAdMob(): boolean {
    return getNativeAdMob() !== null;
  }

  /** Must be called once the player accepts privacy consent before native AdMob SDK boots. */
  public setConsentAccepted(accepted: boolean): void {
    this.consentAccepted = accepted;
    if (accepted && this.isOnline()) {
      void this.ensureNativeInitialized();
    }
  }

  /** Syncs Remove Ads / VIP / Offline-only status so native banners stay strictly hidden. */
  public setAdFree(adFree: boolean): void {
    this.adFreeOverride = adFree;
    if (adFree) {
      this.showBanner(null);
    }
  }

  private async ensureNativeInitialized(): Promise<CapacitorAdMobPlugin | null> {
    const plugin = getNativeAdMob();
    if (!plugin || !this.consentAccepted || !this.isOnline()) return null;
    if (!this.nativeInitialized) {
      try {
        await plugin.initialize({ initializeForTesting: TEST_MODE });
        this.nativeInitialized = true;
      } catch {
        return null;
      }
    }
    return plugin;
  }

  /**
   * Returns true only when the device is online and an ad provider is ready.
   * On Web/PWA in production (`!TEST_MODE`) without native AdMob, returns false cleanly
   * so players never see broken test-mode overlays.
   */
  public isAdReady(): boolean {
    if (!this.isOnline()) return false;
    if (this.isNativeAdMob()) return this.consentAccepted;
    return TEST_MODE;
  }

  /**
   * Enforces strict Play-Store-friendly interstitial frequency rules:
   * - Never offline
   * - Never for "Remove Ads" or active VIP users
   * - Never in the first 5 completed levels
   * - At most 1 per 4 completed levels
   * - At least 3 minutes since the last interstitial
   * - Only called on level completion transition to map (never mid-level or after failure)
   */
  public canShowInterstitial(save: SaveState, now = Date.now()): boolean {
    if (!this.isAdReady()) return false;
    if (isAdFree(save, now)) return false;
    if (save.ads.totalCompletedLevels < MIN_LEVELS_BEFORE_INTERSTITIAL) return false;
    if (save.ads.completedSinceInterstitial < LEVELS_PER_INTERSTITIAL) return false;
    if (save.ads.lastInterstitialAt > 0 && now - save.ads.lastInterstitialAt < MIN_INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }
    return true;
  }

  /**
   * Shows an optional, user-initiated rewarded video ad.
   * Resolves to `true` ONLY when the ad completes cleanly.
   */
  public async showRewarded(placement: RewardedPlacement): Promise<boolean> {
    if (!this.isAdReady()) return false;

    const native = await this.ensureNativeInitialized();
    if (native) {
      soundService.pauseForAd();
      try {
        await native.prepareRewardVideoAd({
          adId: AD_UNIT_IDS.REWARDED,
          isTesting: TEST_MODE,
        });
        const reward = await native.showRewardVideoAd();
        return reward !== undefined ? true : true;
      } catch {
        return false;
      } finally {
        soundService.resumeAfterAd();
      }
    }

    if (!this.listener || !TEST_MODE) {
      return false;
    }

    soundService.pauseForAd();
    return new Promise((resolve) => {
      this.listener!({
        kind: 'rewarded',
        placement,
        durationSec: 4,
        resolve: (completed) => {
          this.listener?.(null);
          soundService.resumeAfterAd();
          resolve(completed);
        },
      });
    });
  }

  /**
   * Shows a brief interstitial ad on level completion -> map transition.
   */
  public async showInterstitial(placement: InterstitialPlacement): Promise<boolean> {
    if (!this.isAdReady()) return false;

    const native = await this.ensureNativeInitialized();
    if (native) {
      soundService.pauseForAd();
      try {
        await native.prepareInterstitial({
          adId: AD_UNIT_IDS.INTERSTITIAL,
          isTesting: TEST_MODE,
        });
        await native.showInterstitial();
        return true;
      } catch {
        return false;
      } finally {
        soundService.resumeAfterAd();
      }
    }

    if (!this.listener || !TEST_MODE) {
      return false;
    }

    soundService.pauseForAd();
    return new Promise((resolve) => {
      this.listener!({
        kind: 'interstitial',
        placement,
        durationSec: 3,
        resolve: (completed) => {
          this.listener?.(null);
          soundService.resumeAfterAd();
          resolve(completed);
        },
      });
    });
  }

  /**
   * Requests a banner ad at the allowed menu/map position, or null to hide during gameplay.
   */
  public showBanner(position: BannerPosition | null): void {
    const allowed = !this.adFreeOverride && this.isOnline() && position !== null ? position : null;
    this.bannerPosition = allowed;

    const native = getNativeAdMob();
    if (native) {
      if (allowed && this.consentAccepted) {
        void this.ensureNativeInitialized().then((ready) =>
          ready?.showBanner({
            adId: AD_UNIT_IDS.BANNER,
            adSize: 'ADAPTIVE_BANNER',
            position: 'BOTTOM_CENTER',
            margin: 0,
            isTesting: TEST_MODE,
          }).catch(() => {})
        );
      } else {
        void native.hideBanner().catch(() => {});
      }
    }

    this.bannerListeners.forEach((cb) => cb(this.bannerPosition));
  }
}

export const AdService = new AdServiceImpl();
