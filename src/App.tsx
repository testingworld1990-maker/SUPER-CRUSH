import { useCallback, useEffect, useState } from 'react';
import levelsData from './game/levels.json';
import { DOOMSDAY_LOGO_URL } from './game/superheroes';
import { ACHIEVEMENTS, FESTIVAL_EVENTS, FESTIVAL_PASS_TIERS, MASCOT_OUTFITS, THEMES } from './game/themes';
import {
  BoosterType,
  GameSettings,
  LevelConfig,
  MascotOutfit,
  SaveState,
  ScreenId,
  SweetType,
  ThemeId,
} from './game/types';
import { getT } from './i18n/translations';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { AdService } from './services/adService';
import { soundService } from './services/soundService';
import {
  buildBlitzLevel,
  buildDailyChallengeLevel,
  buildKadhaiRushLevel,
  buildRelaxLevel,
  createReplacementBounty,
  getTodayKey,
  hasUnlimitedLives,
  isAdFree,
  loadSaveFromIDB,
  loadSaveSync,
  persistSave,
  resetAllSaveData,
  syncLivesFromClock,
} from './services/storageService';
import { AdModalOverlay } from './components/AdOverlay';
import { AdventureLogModal } from './components/AdventureLogModal';
import { ChotuMascot } from './components/ChotuMascot';
import { CollectionModal } from './components/CollectionModal';
import { DailyRewardModal } from './components/DailyRewardModal';
import { GameScreen } from './components/GameScreen';
import { LevelEditor } from './components/LevelEditor';
import { LevelMap } from './components/LevelMap';
import { MainMenu } from './components/MainMenu';
import { OfflineToast } from './components/PWAInstallButton';
import { ConsentModal, SettingsModal } from './components/SettingsAndPrivacyModal';
import { ShopAndPassModal } from './components/ShopAndPassModal';

const CAMPAIGN_LEVELS = levelsData.levels as LevelConfig[];
const FESTIVAL_LEVELS = levelsData.festivalLevels as LevelConfig[];

export default function App() {
  const isOnline = useOnlineStatus();
  const [save, setSave] = useState<SaveState>(() => loadSaveSync());
  const [screen, setScreen] = useState<ScreenId>('splash');
  const [activeLevel, setActiveLevel] = useState<LevelConfig>(CAMPAIGN_LEVELS[0]);
  const [justCompletedLevelId, setJustCompletedLevelId] = useState<number | null>(null);

  // Modals
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCollection, setShowCollection] = useState<'stickers' | 'achievements' | 'daily' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdventureLog, setShowAdventureLog] = useState(false);

  const t = getT(save.settings.language);

  // Hydrate from IndexedDB on boot (async upgrade over localStorage sync state)
  useEffect(() => {
    loadSaveFromIDB().then((idbSave) => {
      if (idbSave && idbSave.unlockedLevel >= save.unlockedLevel) {
        setSave(idbSave);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configure sound service whenever settings change
  useEffect(() => {
    soundService.configure({
      sound: save.settings.sound,
      music: save.settings.music,
      vibration: save.settings.vibration,
    });
  }, [save.settings.sound, save.settings.music, save.settings.vibration]);

  // Keep AdService consent & Ad-Free/VIP entitlement strictly synchronized for Android APK AdMob
  useEffect(() => {
    AdService.setConsentAccepted(save.consentAccepted);
    AdService.setAdFree(isAdFree(save));
  }, [save.consentAccepted, save.removeAds, save.vipUntil]);

  // Android hardware / gesture Back button support:
  // Closes open modals first, then steps back Game -> Map -> Main Menu instead of exiting the APK.
  const hasOverlayOpen =
    showDailyReward || showShop || showCollection !== null || showSettings || showAdventureLog;

  useEffect(() => {
    if (screen === 'splash') return;
    const isSubView = hasOverlayOpen || screen !== 'menu';
    if (isSubView) {
      window.history.pushState({ superCrushView: true }, '');
    }
  }, [screen, hasOverlayOpen]);

  useEffect(() => {
    const onPopState = () => {
      if (showSettings) {
        setShowSettings(false);
        return;
      }
      if (showShop) {
        setShowShop(false);
        return;
      }
      if (showCollection !== null) {
        setShowCollection(null);
        return;
      }
      if (showDailyReward) {
        setShowDailyReward(false);
        return;
      }
      if (showAdventureLog) {
        setShowAdventureLog(false);
        return;
      }
      if (screen === 'game') {
        setScreen('map');
        return;
      }
      if (screen === 'map' || screen === 'editor') {
        setScreen('menu');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [screen, showSettings, showShop, showCollection, showDailyReward, showAdventureLog]);

  // Periodically check clock-based life refills
  useEffect(() => {
    const id = window.setInterval(() => {
      setSave((prev) => {
        const synced = syncLivesFromClock(prev);
        if (synced !== prev) persistSave(synced);
        return synced;
      });
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  // Auto-advance splash after 1.4s
  useEffect(() => {
    if (screen !== 'splash') return;
    const timer = window.setTimeout(() => setScreen('menu'), 1400);
    return () => clearTimeout(timer);
  }, [screen]);

  const updateSave = useCallback((updater: (prev: SaveState) => SaveState) => {
    setSave((prev) => {
      const next = syncLivesFromClock(updater(prev));
      persistSave(next);
      return next;
    });
  }, []);

  const startLevel = (level: LevelConfig) => {
    const synced = syncLivesFromClock(save);
    const needsHeart =
      !level.isRelax && !level.isCustom && !level.isKadhaiRush && !level.isBlitz && !hasUnlimitedLives(synced);
    if (needsHeart && synced.lives <= 0) {
      soundService.playInvalid();
      setScreen('map');
      return;
    }
    soundService.playTap();
    setActiveLevel(level);
    setScreen('game');
  };

  const handleQuickPlay = () => {
    const nextLvl = CAMPAIGN_LEVELS.find((l) => l.id === save.unlockedLevel) ?? CAMPAIGN_LEVELS[0];
    startLevel(nextLvl);
  };

  const handleConsumeBooster = useCallback(
    (booster: BoosterType): boolean => {
      let ok = false;
      updateSave((prev) => {
        if (prev.boosters[booster] <= 0) return prev;
        ok = true;
        return {
          ...prev,
          boosters: { ...prev.boosters, [booster]: prev.boosters[booster] - 1 },
        };
      });
      return ok;
    },
    [updateSave]
  );

  const handleGrantBooster = useCallback(
    (booster: BoosterType, amount = 1) => {
      updateSave((prev) => ({
        ...prev,
        boosters: { ...prev.boosters, [booster]: prev.boosters[booster] + amount },
      }));
    },
    [updateSave]
  );

  const handleSpendCoins = useCallback(
    (amount: number): boolean => {
      if (save.coins < amount) return false;
      updateSave((prev) => ({ ...prev, coins: Math.max(0, prev.coins - amount) }));
      return true;
    },
    [save.coins, updateSave]
  );

  const handleLevelComplete = useCallback(
    (payload: {
      level: LevelConfig;
      score: number;
      stars: number;
      coinsEarned: number;
      matchesMade: number;
      specialsCreated: number;
      bestCombo: number;
      bossDefeated: boolean;
      collectedSweets: Record<SweetType, number>;
    }) => {
      updateSave((prev) => {
        const nextLevels = { ...prev.levels };
        let nextUnlocked = prev.unlockedLevel;
        const nextFestival = { ...prev.festivalCompleted };

        if (!payload.level.isDaily && !payload.level.isRelax && !payload.level.isCustom && payload.level.id <= 60) {
          const existing = nextLevels[payload.level.id];
          nextLevels[payload.level.id] = {
            stars: Math.max(existing?.stars ?? 0, payload.stars),
            bestScore: Math.max(existing?.bestScore ?? 0, payload.score),
            completed: true,
          };
          if (payload.level.id >= nextUnlocked && payload.level.id < 60) {
            nextUnlocked = payload.level.id + 1;
          }
        }

        if (payload.level.festivalTag) {
          nextFestival[String(payload.level.id)] = Math.max(
            nextFestival[String(payload.level.id)] ?? 0,
            payload.stars
          );
        }

        const nextStats = {
          ...prev.stats,
          totalMatches: prev.stats.totalMatches + payload.matchesMade,
          totalSpecials: prev.stats.totalSpecials + payload.specialsCreated,
          totalBossesDefeated: prev.stats.totalBossesDefeated + (payload.bossDefeated ? 1 : 0),
          totalLevelsWon: prev.stats.totalLevelsWon + 1,
          bestCombo: Math.max(prev.stats.bestCombo, payload.bestCombo),
          dailyChallengesWon: prev.stats.dailyChallengesWon + (payload.level.isDaily ? 1 : 0),
        };

        // Increment Win Streak on campaign / daily wins
        const countsForStreak =
          !payload.level.isRelax && !payload.level.isCustom && !payload.level.isKadhaiRush && !payload.level.isBlitz;
        const nextWinStreak = countsForStreak ? (prev.winStreak ?? 0) + 1 : prev.winStreak ?? 0;
        const nextBestWinStreak = Math.max(prev.bestWinStreak ?? 0, nextWinStreak);

        // Advance active Quick Bounties
        const nextBounties = (prev.bounties ?? []).map((b) => {
          let add = 0;
          if (b.kind === 'matches') add = payload.matchesMade;
          else if (b.kind === 'specials') add = payload.specialsCreated;
          else if (b.kind === 'wins') add = 1;
          else if (b.kind === 'collect_relic' && b.sweet) add = payload.collectedSweets[b.sweet] ?? 0;
          else if (b.kind === 'combo') {
            return { ...b, progress: Math.min(b.target, Math.max(b.progress, payload.bestCombo)) };
          }
          return { ...b, progress: Math.min(b.target, b.progress + add) };
        });

        // Evaluate Stickers Unlocked
        const stickers = new Set(prev.stickersUnlocked);
        const totalStars = Object.values(nextLevels).reduce((s, p) => s + p.stars, 0);
        if (payload.level.id >= 1 && !payload.level.isCustom) stickers.add('st_laddu');
        if (payload.level.id >= 3 && !payload.level.isCustom) stickers.add('st_jalebi');
        if (payload.level.id >= 5 && !payload.level.isCustom) stickers.add('st_jamun');
        if (nextStats.totalSpecials >= 5) stickers.add('st_rasgulla');
        if (nextStats.bestCombo >= 4) stickers.add('st_barfi');
        if (totalStars >= 15) stickers.add('st_mysore');
        if (totalStars >= 50) stickers.add('st_master');
        if (payload.level.id === 12) stickers.add('st_chennai');
        if (payload.level.id === 24) stickers.add('st_madurai');
        if (payload.level.id === 36) stickers.add('st_kanya');
        if (payload.level.id === 48) stickers.add('st_jaipur');
        if (payload.level.id === 60) stickers.add('st_delhi');
        if (payload.level.isDaily) stickers.add('st_daily');
        if (payload.level.festivalTag) {
          const ev = FESTIVAL_EVENTS.find((e) => e.id === payload.level.festivalTag);
          if (ev) stickers.add(ev.rewardStickerId);
        }

        // Evaluate Achievements
        const achUnlocked = new Set(prev.achievementsUnlocked);
        const evalStats = { ...nextStats, totalStars };
        for (const a of ACHIEVEMENTS) {
          if (a.check(evalStats)) achUnlocked.add(a.id);
        }

        // Daily Challenge Leaderboard update
        const today = getTodayKey();
        let nextDaily = prev.dailyChallenge;
        if (payload.level.isDaily) {
          const filtered = prev.dailyChallenge.leaderboard.filter((e) => !e.isPlayer);
          const bestToday = Math.max(
            prev.dailyChallenge.lastCompletedDate === today ? prev.dailyChallenge.bestTodayScore : 0,
            payload.score
          );
          filtered.push({
            id: 'player_me',
            name: prev.playerName || 'You',
            score: bestToday,
            date: today,
            isPlayer: true,
            city: 'Helicarrier',
          });
          nextDaily = {
            lastCompletedDate: today,
            bestTodayScore: bestToday,
            leaderboard: filtered,
          };
        }

        return {
          ...prev,
          unlockedLevel: nextUnlocked,
          levels: nextLevels,
          festivalCompleted: nextFestival,
          coins: prev.coins + payload.coinsEarned,
          festivalPassXp: Math.min(1000, prev.festivalPassXp + 45 + payload.stars * 20),
          stickersUnlocked: Array.from(stickers),
          achievementsUnlocked: Array.from(achUnlocked),
          winStreak: nextWinStreak,
          bestWinStreak: nextBestWinStreak,
          bounties: nextBounties,
          stats: nextStats,
          dailyChallenge: nextDaily,
          ads: {
            ...prev.ads,
            totalCompletedLevels: prev.ads.totalCompletedLevels + 1,
            completedSinceInterstitial: prev.ads.completedSinceInterstitial + 1,
          },
        };
      });
    },
    [updateSave]
  );

  const handleClaimBounty = useCallback(
    (bountyId: string) => {
      soundService.playCoin();
      updateSave((prev) => {
        const target = prev.bounties.find((b) => b.id === bountyId);
        if (!target || target.progress < target.target) return prev;
        const otherTitles = prev.bounties.filter((b) => b.id !== bountyId).map((b) => b.title);
        const replacement = createReplacementBounty(
          [...otherTitles, target.title],
          prev.stats.totalLevelsWon + prev.coins + prev.bounties.length
        );
        return {
          ...prev,
          coins: prev.coins + (target.rewardCoins ?? 0),
          boosters: target.rewardBooster
            ? {
                ...prev.boosters,
                [target.rewardBooster]: prev.boosters[target.rewardBooster] + 1,
              }
            : prev.boosters,
          bounties: prev.bounties.map((b) => (b.id === bountyId ? replacement : b)),
        };
      });
    },
    [updateSave]
  );

  const handleLevelFail = useCallback(
    (level: LevelConfig, score: number) => {
      updateSave((prev) => {
        if (level.isRelax) {
          return {
            ...prev,
            stats: { ...prev.stats, relaxHighScore: Math.max(prev.stats.relaxHighScore, score) },
          };
        }
        const resetsStreak = !level.isCustom && !level.isKadhaiRush && !level.isBlitz;
        if (level.isCustom || level.isKadhaiRush || level.isBlitz || hasUnlimitedLives(prev)) {
          return resetsStreak ? { ...prev, winStreak: 0 } : prev;
        }
        const nextLives = Math.max(0, prev.lives - 1);
        return {
          ...prev,
          winStreak: 0,
          lives: nextLives,
          lastLifeLostAt: prev.lastLifeLostAt ?? Date.now(),
        };
      });
    },
    [updateSave]
  );

  const handleRecordBlitzScore = useCallback(
    (score: number, creditsEarned: number, matchesMade: number, specialsCreated: number, bestCombo: number) => {
      updateSave((prev) => {
        const nextBounties = (prev.bounties ?? []).map((b) => {
          let add = 0;
          if (b.kind === 'matches') add = matchesMade;
          else if (b.kind === 'specials') add = specialsCreated;
          else if (b.kind === 'combo') {
            return { ...b, progress: Math.min(b.target, Math.max(b.progress, bestCombo)) };
          }
          return { ...b, progress: Math.min(b.target, b.progress + add) };
        });
        return {
          ...prev,
          coins: prev.coins + creditsEarned,
          festivalPassXp: Math.min(1000, prev.festivalPassXp + 35),
          bounties: nextBounties,
          stats: {
            ...prev.stats,
            blitzHighScore: Math.max(prev.stats.blitzHighScore ?? 0, score),
            totalMatches: prev.stats.totalMatches + matchesMade,
            totalSpecials: prev.stats.totalSpecials + specialsCreated,
            bestCombo: Math.max(prev.stats.bestCombo, bestCombo),
          },
        };
      });
    },
    [updateSave]
  );

  /**
   * Strict Interstitial Ad transition rule:
   * Only on transition from a COMPLETED level to the map, never mid-level,
   * never right after failure, never in first 5 levels, max 1 per 4 levels, min 3 min apart.
   */
  const handleExitGameToMap = async (afterWin: boolean) => {
    if (afterWin && AdService.canShowInterstitial(save)) {
      await AdService.showInterstitial('level_complete_to_map');
      updateSave((prev) => ({
        ...prev,
        ads: {
          ...prev.ads,
          completedSinceInterstitial: 0,
          lastInterstitialAt: Date.now(),
        },
      }));
    }
    if (afterWin && !activeLevel.isDaily && !activeLevel.isRelax && !activeLevel.isCustom && activeLevel.id <= 60) {
      setJustCompletedLevelId(activeLevel.id);
    } else {
      setJustCompletedLevelId(null);
    }
    setScreen('map');
  };

  const handleNextLevel = (currentLevelId: number) => {
    const next = CAMPAIGN_LEVELS.find((l) => l.id === currentLevelId + 1);
    if (next) {
      startLevel(next);
    } else {
      setScreen('map');
    }
  };

  const handleRefillLivesAd = async () => {
    const ok = await AdService.showRewarded('refill_lives');
    if (ok) {
      updateSave((prev) => ({
        ...prev,
        lives: prev.maxLives,
        lastLifeLostAt: null,
      }));
      soundService.playWin();
    }
  };

  // Mock / Stub In-App Purchases (ready for Google Play Billing)
  const handlePurchaseMockIAP = (sku: string) => {
    const now = Date.now();
    updateSave((prev) => {
      if (sku === 'remove_ads') {
        return { ...prev, removeAds: true };
      }
      if (sku === 'vip_monthly') {
        return {
          ...prev,
          vipUntil: now + 30 * 24 * 60 * 60 * 1000,
          unlimitedLivesUntil: now + 24 * 60 * 60 * 1000,
          coins: prev.coins + 500,
          unlockedOutfits: Array.from(new Set([...prev.unlockedOutfits, 'royal_turban'])),
          equippedOutfit: 'royal_turban',
        };
      }
      if (sku === 'starter_pack') {
        return {
          ...prev,
          coins: prev.coins + 400,
          lives: prev.maxLives,
          lastLifeLostAt: null,
          boosters: {
            hammer: prev.boosters.hammer + 3,
            shuffle: prev.boosters.shuffle + 3,
            extra_moves: prev.boosters.extra_moves + 3,
            color_bomb: prev.boosters.color_bomb + 2,
          },
        };
      }
      if (sku === 'coins_500') return { ...prev, coins: prev.coins + 500 };
      if (sku === 'coins_2000') return { ...prev, coins: prev.coins + 2000 };
      if (sku === 'unlimited_24h') {
        return { ...prev, lives: prev.maxLives, lastLifeLostAt: null, unlimitedLivesUntil: now + 24 * 60 * 60 * 1000 };
      }
      if (sku === 'unlimited_7d') {
        return { ...prev, lives: prev.maxLives, lastLifeLostAt: null, unlimitedLivesUntil: now + 7 * 24 * 60 * 60 * 1000 };
      }
      if (sku === 'festival_pass') {
        return { ...prev, premiumFestivalPass: true };
      }
      return prev;
    });
  };

  const handleRestorePurchases = (skus: string[]) => {
    const now = Date.now();
    updateSave((prev) => {
      let next = { ...prev };
      if (skus.includes('remove_ads')) {
        next = { ...next, removeAds: true };
      }
      if (skus.includes('festival_pass')) {
        next = { ...next, premiumFestivalPass: true };
      }
      if (skus.includes('vip_monthly')) {
        next = {
          ...next,
          vipUntil: Math.max(next.vipUntil ?? 0, now + 30 * 24 * 60 * 60 * 1000),
          unlockedOutfits: Array.from(new Set([...next.unlockedOutfits, 'royal_turban'])),
        };
      }
      return next;
    });
  };

  const handleBuyOrEquipTheme = (themeId: ThemeId) => {
    const th = THEMES[themeId];
    updateSave((prev) => {
      if (prev.unlockedThemes.includes(themeId)) {
        return { ...prev, settings: { ...prev.settings, theme: themeId } };
      }
      if (prev.coins < th.priceCoins) return prev;
      return {
        ...prev,
        coins: prev.coins - th.priceCoins,
        unlockedThemes: [...prev.unlockedThemes, themeId],
        settings: { ...prev.settings, theme: themeId },
      };
    });
  };

  const handleBuyOrEquipOutfit = (outfit: MascotOutfit) => {
    const info = MASCOT_OUTFITS.find((o) => o.id === outfit);
    if (!info) return;
    updateSave((prev) => {
      if (prev.unlockedOutfits.includes(outfit)) {
        return { ...prev, equippedOutfit: outfit };
      }
      if (prev.coins < info.priceCoins) return prev;
      return {
        ...prev,
        coins: prev.coins - info.priceCoins,
        unlockedOutfits: [...prev.unlockedOutfits, outfit],
        equippedOutfit: outfit,
      };
    });
  };

  const handleClaimPassTier = (tierNum: number, isPremium: boolean) => {
    const tier = FESTIVAL_PASS_TIERS.find((x) => x.tier === tierNum);
    if (!tier) return;
    updateSave((prev) => {
      if (prev.festivalPassXp < tier.xpRequired) return prev;
      if (isPremium) {
        if (!prev.premiumFestivalPass || prev.festivalPassPremiumClaimed.includes(tierNum)) return prev;
        const r = tier.premiumReward;
        return {
          ...prev,
          coins: prev.coins + (r.coins ?? 0),
          boosters: r.booster
            ? { ...prev.boosters, [r.booster]: prev.boosters[r.booster] + (r.amount ?? 1) }
            : prev.boosters,
          unlockedOutfits: r.outfit
            ? Array.from(new Set([...prev.unlockedOutfits, r.outfit]))
            : prev.unlockedOutfits,
          festivalPassPremiumClaimed: [...prev.festivalPassPremiumClaimed, tierNum],
        };
      } else {
        if (prev.festivalPassFreeClaimed.includes(tierNum)) return prev;
        const r = tier.freeReward;
        return {
          ...prev,
          coins: prev.coins + (r.coins ?? 0),
          boosters: r.booster
            ? { ...prev.boosters, [r.booster]: prev.boosters[r.booster] + (r.amount ?? 1) }
            : prev.boosters,
          festivalPassFreeClaimed: [...prev.festivalPassFreeClaimed, tierNum],
        };
      }
    });
  };

  const handleUpdateSettings = (patch: Partial<GameSettings>) => {
    updateSave((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  };

  return (
    <>
      {/* Cinematic Doomsday Splash Screen */}
      {screen === 'splash' && (
        <div
          onClick={() => setScreen('menu')}
          className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#04070D] via-[#091815] to-[#050A14] p-6 cursor-pointer select-none"
        >
          <div className="relative w-64 sm:w-80 aspect-video overflow-hidden rounded-3xl border-2 border-emerald-400/60 shadow-[0_0_50px_rgba(16,185,129,0.45)] bg-slate-950">
            <img
              src={DOOMSDAY_LOGO_URL}
              alt="Super Crush: Doomsday Emblem"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#04070D]/80 via-transparent to-transparent"
            />
          </div>
          <div className="mt-5 text-xs font-extrabold tracking-[0.35em] text-emerald-400 uppercase">
            Avengers Saga Edition
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_24px_rgba(16,185,129,0.5)]">
            SUPER CRUSH
          </h1>
          <div className="mt-0.5 font-display text-lg sm:text-xl font-black tracking-[0.28em] text-emerald-400">
            DOOMSDAY
          </div>
          <p className="mt-2.5 text-sm font-medium text-slate-300 text-center max-w-xs">
            {t.tagline}
          </p>
          <div className="mt-4">
            <ChotuMascot mood="cheer" outfit={save.equippedOutfit} size="sm" />
          </div>
        </div>
      )}

      {/* Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          save={save}
          isOnline={isOnline}
          onQuickPlay={handleQuickPlay}
          onOpenMap={() => setScreen('map')}
          onStartRelax={() => startLevel(buildRelaxLevel(save.settings.relaxGridSize))}
          onOpenDailyChallenge={() => setShowCollection('daily')}
          onOpenDailyReward={() => setShowDailyReward(true)}
          onOpenShop={() => setShowShop(true)}
          onOpenCollection={() => setShowCollection('stickers')}
          onOpenEditor={() => setScreen('editor')}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAdventureLog={() => {
            soundService.playTap();
            setShowAdventureLog(true);
          }}
          onStartKadhaiRush={() => {
            handleUpdateSettings({ viewMode: 'thali_3d' });
            startLevel(buildKadhaiRushLevel());
          }}
          onStartBlitz={() => {
            startLevel(buildBlitzLevel());
          }}
          onSelectHero={(heroId) => {
            updateSave((prev) => ({ ...prev, activeHeroId: heroId }));
          }}
          onClaimBounty={handleClaimBounty}
        />
      )}

      {/* Winding Indian Cities Story Board Map */}
      {screen === 'map' && (
        <LevelMap
          levels={CAMPAIGN_LEVELS}
          festivalLevels={FESTIVAL_LEVELS}
          save={save}
          isOnline={isOnline}
          justCompletedLevelId={justCompletedLevelId}
          onClearJustCompleted={() => setJustCompletedLevelId(null)}
          onBackToMenu={() => setScreen('menu')}
          onStartLevel={startLevel}
          onOpenShop={() => setShowShop(true)}
          onRefillLivesAd={handleRefillLivesAd}
          onBonusCoins={(amt) => updateSave((prev) => ({ ...prev, coins: prev.coins + amt }))}
        />
      )}

      {/* Match-3 Gameplay Screen */}
      {screen === 'game' && (
        <GameScreen
          level={activeLevel}
          save={save}
          isOnline={isOnline}
          onConsumeBooster={handleConsumeBooster}
          onGrantBooster={handleGrantBooster}
          onSpendCoins={handleSpendCoins}
          onLevelComplete={handleLevelComplete}
          onLevelFail={handleLevelFail}
          onExitToMap={handleExitGameToMap}
          onNextLevel={handleNextLevel}
          onToggleSetting={(key) => handleUpdateSettings({ [key]: !save.settings[key] })}
          onSetViewMode={(mode) => handleUpdateSettings({ viewMode: mode })}
          onBonusCoins={(amt) => updateSave((prev) => ({ ...prev, coins: prev.coins + amt }))}
          onRecordKadhaiOrders={(orders) =>
            updateSave((prev) => ({
              ...prev,
              stats: {
                ...prev.stats,
                kadhaiOrdersBest: Math.max(prev.stats.kadhaiOrdersBest ?? 0, orders),
              },
            }))
          }
          onRecordBlitzScore={handleRecordBlitzScore}
          onSelectHero={(heroId) => updateSave((prev) => ({ ...prev, activeHeroId: heroId }))}
        />
      )}

      {/* Level Editor */}
      {screen === 'editor' && (
        <LevelEditor
          customLevels={save.customLevels}
          onBack={() => setScreen('menu')}
          onPlaytest={(lvl) => startLevel(lvl)}
          onSaveCustomLevel={(lvl) =>
            updateSave((prev) => ({
              ...prev,
              customLevels: [lvl, ...prev.customLevels.filter((x) => x.id !== lvl.id)],
            }))
          }
          onDeleteCustomLevel={(id) =>
            updateSave((prev) => ({
              ...prev,
              customLevels: prev.customLevels.filter((x) => x.id !== id),
            }))
          }
        />
      )}

      {/* Daily Spin Wheel & 7-Day Login Calendar */}
      {showDailyReward && (
        <DailyRewardModal
          save={save}
          isOnline={isOnline}
          onClose={() => setShowDailyReward(false)}
          onClaimCalendarDay={(coins, booster) => {
            const today = getTodayKey();
            updateSave((prev) => ({
              ...prev,
              coins: prev.coins + coins,
              boosters: booster
                ? { ...prev.boosters, [booster]: prev.boosters[booster] + 1 }
                : prev.boosters,
              dailyLogin: {
                streak: (prev.dailyLogin.streak + 1) % 7,
                lastClaimDate: today,
                doubledToday: false,
              },
            }));
          }}
          onDoubleCalendarReward={(extraCoins) => {
            updateSave((prev) => ({
              ...prev,
              coins: prev.coins + extraCoins,
              dailyLogin: { ...prev.dailyLogin, doubledToday: true },
            }));
          }}
          onSpinReward={(reward, isBonus) => {
            const today = getTodayKey();
            updateSave((prev) => ({
              ...prev,
              coins: prev.coins + (reward.coins ?? 0),
              boosters: reward.booster
                ? {
                    ...prev.boosters,
                    [reward.booster]: prev.boosters[reward.booster] + (reward.amount ?? 1),
                  }
                : prev.boosters,
              dailySpin: {
                lastSpinDate: isBonus ? prev.dailySpin.lastSpinDate : today,
                bonusSpinUsedDate: isBonus ? today : prev.dailySpin.bonusSpinUsedDate,
              },
            }));
          }}
        />
      )}

      {/* Avenger Armory, Google Play Billing, Doomsday Pass & Cosmetics */}
      {showShop && (
        <ShopAndPassModal
          save={save}
          onClose={() => setShowShop(false)}
          onPurchaseMockIAP={handlePurchaseMockIAP}
          onRestorePurchases={handleRestorePurchases}
          onBuyOrEquipTheme={handleBuyOrEquipTheme}
          onBuyOrEquipOutfit={handleBuyOrEquipOutfit}
          onClaimPassTier={handleClaimPassTier}
        />
      )}

      {/* Stickers, Achievements & Daily Challenge Leaderboard */}
      {showCollection && (
        <CollectionModal
          save={save}
          isOnline={isOnline}
          initialTab={showCollection}
          onClose={() => setShowCollection(null)}
          onClaimAchievement={(id, rewardCoins) => {
            soundService.playCoin();
            updateSave((prev) => ({
              ...prev,
              coins: prev.coins + rewardCoins,
              achievementsClaimed: Array.from(new Set([...prev.achievementsClaimed, id])),
            }));
          }}
          onStartDailyChallenge={() => {
            setShowCollection(null);
            startLevel(buildDailyChallengeLevel());
          }}
        />
      )}

      {/* Settings & Privacy Policy */}
      {showSettings && (
        <SettingsModal
          save={save}
          onClose={() => setShowSettings(false)}
          onUpdateSettings={handleUpdateSettings}
          onUpdatePlayerName={(playerName) => updateSave((prev) => ({ ...prev, playerName }))}
          onRestorePurchases={handleRestorePurchases}
          onResetProgress={() => {
            const fresh = resetAllSaveData();
            setSave(fresh);
            setShowSettings(false);
            setScreen('menu');
          }}
        />
      )}

      {/* Chotu's Adventure Log Modal (Accessible from Main Menu) */}
      {showAdventureLog && (
        <AdventureLogModal
          save={save}
          onClose={() => setShowAdventureLog(false)}
          onJumpToCity={(cid) => {
            setShowAdventureLog(false);
            setScreen('map');
            window.setTimeout(() => {
              const el = document.getElementById(`region-card-${cid}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
          }}
        />
      )}

      {/* First-Launch Consent Screen */}
      {!save.consentAccepted && screen !== 'splash' && (
        <ConsentModal
          language={save.settings.language}
          onAccept={(offlineOnly) => {
            soundService.playTap();
            updateSave((prev) => ({
              ...prev,
              consentAccepted: true,
              removeAds: offlineOnly ? true : prev.removeAds,
            }));
          }}
        />
      )}

      {/* Global Ad Overlay & Offline Indicator */}
      <AdModalOverlay />
      <OfflineToast text={t.offlineReady} />
    </>
  );
}
