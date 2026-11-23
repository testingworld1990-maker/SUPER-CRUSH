import React, { useState } from 'react';
import { FESTIVAL_PASS_TIERS, MASCOT_OUTFITS, THEMES } from '../game/themes';
import { MascotOutfit, SaveState, ThemeId } from '../game/types';
import { IAPService } from '../services/iapService';
import { isVipActive } from '../services/storageService';
import { soundService } from '../services/soundService';
import { ChotuMascot } from './ChotuMascot';
import { Check, Coins, Crown, Heart, Palette, RotateCcw, ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';

interface ShopAndPassModalProps {
  save: SaveState;
  onClose: () => void;
  onPurchaseMockIAP: (sku: string) => void;
  onRestorePurchases: (skus: string[]) => void;
  onBuyOrEquipTheme: (themeId: ThemeId) => void;
  onBuyOrEquipOutfit: (outfit: MascotOutfit) => void;
  onClaimPassTier: (tier: number, isPremium: boolean) => void;
}

export const ShopAndPassModal: React.FC<ShopAndPassModalProps> = ({
  save,
  onClose,
  onPurchaseMockIAP,
  onRestorePurchases,
  onBuyOrEquipTheme,
  onBuyOrEquipOutfit,
  onClaimPassTier,
}) => {
  const [tab, setTab] = useState<'shop' | 'pass' | 'cosmetics'>('shop');
  const [toast, setToast] = useState<string | null>(null);
  const [busySku, setBusySku] = useState<string | null>(null);
  const vip = isVipActive(save);

  const notify = (msg: string) => {
    soundService.playCoin();
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  const buySku = async (sku: string) => {
    if (busySku) return;
    setBusySku(sku);
    try {
      const result = await IAPService.purchaseSku(sku);
      if (result.ok) {
        onPurchaseMockIAP(sku);
        notify(result.message);
      } else {
        setToast(result.message);
        window.setTimeout(() => setToast(null), 2600);
      }
    } finally {
      setBusySku(null);
    }
  };

  const handleRestore = async () => {
    const res = await IAPService.restorePurchases();
    if (res.restoredSkus.length > 0) {
      onRestorePurchases(res.restoredSkus);
    }
    notify(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#0B121E] text-slate-100 p-5 sm:p-6 shadow-2xl border border-emerald-500/45">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">Avenger Armory &amp; Doomsday Pass</h2>
            <p className="text-xs text-slate-400">
              Balance:{' '}
              <strong className="tabular-nums text-emerald-300">{save.coins} Credits</strong>
              {IAPService.isSandbox() && (
                <span className="ml-2 text-[11px] text-slate-500">· Preview Billing</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestore}
              className="flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 text-[11px] font-bold text-slate-200 hover:bg-slate-800"
              title="Restore Google Play Purchases"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Restore
            </button>
            <button
              onClick={onClose}
              aria-label="Close Armory"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {toast && (
          <div className="mt-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 px-3.5 py-2 text-xs font-bold text-emerald-200">
            {toast}
          </div>
        )}

        <div className="mt-4 flex gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setTab('shop')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              tab === 'shop' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Supply Packs
          </button>
          <button
            onClick={() => setTab('pass')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              tab === 'pass' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Doomsday Pass
          </button>
          <button
            onClick={() => setTab('cosmetics')}
            className={`flex-1 min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              tab === 'cosmetics' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-300'
            }`}
          >
            <Palette className="w-4 h-4" /> Themes & Armor
          </button>
        </div>

        {tab === 'shop' && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" /> One-Time Upgrade
                </div>
                <h3 className="mt-1 text-base font-extrabold text-white">Remove All Ads</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Permanently removes banner & interstitial ads while keeping optional rewarded drops available.
                </p>
              </div>
              <button
                disabled={save.removeAds || busySku !== null}
                onClick={() => buySku('remove_ads')}
                className="mt-3 min-h-[42px] w-full rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 disabled:bg-slate-700"
              >
                {save.removeAds ? 'Owned ✓' : 'Unlock · $2.99'}
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-amber-500/35 bg-amber-950/20 p-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Crown className="w-4 h-4" /> Avenger VIP Clearance
                </div>
                <h3 className="mt-1 text-base font-extrabold text-white">VIP Monthly Pass</h3>
                <p className="mt-1 text-xs text-slate-300">
                  No ads, +500 bonus credits, exclusive Endgame Sovereign armor &amp; 24h Unlimited Energy!
                </p>
              </div>
              <button
                disabled={vip || busySku !== null}
                onClick={() => buySku('vip_monthly')}
                className="mt-3 min-h-[42px] w-full rounded-xl bg-amber-500 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:bg-emerald-600 disabled:text-white"
              >
                {vip ? 'VIP Active ✓' : 'Subscribe · $4.99/mo'}
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <div>
                <h3 className="text-base font-extrabold text-white">Avenger Starter Kit</h3>
                <p className="mt-1 text-xs text-slate-400">
                  3x Mjolnir Strike, 3x Quantum Shuffle, 3x +5 Turns, 2x Infinity Orb + Full Energy + 400 Credits.
                </p>
              </div>
              <button
                disabled={busySku !== null}
                onClick={() => buySku('starter_pack')}
                className="mt-3 min-h-[42px] w-full rounded-xl bg-cyan-500 text-xs font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                Unlock · $1.99
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Coins className="w-4 h-4" /> Stark Credit Vault
                </div>
                <h3 className="mt-1 text-base font-extrabold text-white">Credit Bundles</h3>
                <p className="mt-1 text-xs text-slate-400">Stock up for tactical boosters, extra turns, themes &amp; armor suits.</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busySku !== null}
                  onClick={() => buySku('coins_500')}
                  className="flex-1 min-h-[40px] rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  +500 ($0.99)
                </button>
                <button
                  disabled={busySku !== null}
                  onClick={() => buySku('coins_2000')}
                  className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  +2,000 ($2.99)
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/35 bg-rose-950/25 p-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <Heart className="w-4 h-4 fill-rose-500" /> Unlimited Energy
                </div>
                <div className="text-sm font-extrabold text-white">Deploy non-stop without waiting for refills</div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busySku !== null}
                  onClick={() => buySku('unlimited_24h')}
                  className="min-h-[40px] rounded-xl bg-rose-600 px-3.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  24 Hours ($0.99)
                </button>
                <button
                  disabled={busySku !== null}
                  onClick={() => buySku('unlimited_7d')}
                  className="min-h-[40px] rounded-xl bg-rose-700 px-3.5 text-xs font-bold text-white hover:bg-rose-600 disabled:opacity-60"
                >
                  7 Days ($3.49)
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'pass' && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 p-4 text-white border border-emerald-400/40">
              <div>
                <div className="text-xs font-semibold text-emerald-200">Seasonal Doomsday Battle Pass</div>
                <div className="text-lg font-black tabular-nums">Pass XP: {save.festivalPassXp} / 1000</div>
              </div>
              {!save.premiumFestivalPass ? (
                <button
                  disabled={busySku !== null}
                  onClick={() => buySku('festival_pass')}
                  className="min-h-[42px] rounded-xl bg-white px-4 text-xs font-extrabold text-slate-950 hover:bg-emerald-50 shadow disabled:opacity-60"
                >
                  Unlock Premium Track · $3.99
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-200">Premium Track Active ✓</span>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {FESTIVAL_PASS_TIERS.map((tier) => {
                const unlocked = save.festivalPassXp >= tier.xpRequired;
                const freeClaimed = save.festivalPassFreeClaimed.includes(tier.tier);
                const premClaimed = save.festivalPassPremiumClaimed.includes(tier.tier);
                return (
                  <div
                    key={tier.tier}
                    className="grid grid-cols-[64px_1fr_1fr] items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/75 p-3 text-xs"
                  >
                    <div className="font-black text-white tabular-nums">
                      Tier {tier.tier}
                      <div className="text-[10px] font-medium text-emerald-400">{tier.xpRequired} XP</div>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-950/80 p-2 border border-slate-800">
                      <span className="font-bold text-slate-200 truncate">{tier.freeLabel}</span>
                      <button
                        disabled={!unlocked || freeClaimed}
                        onClick={() => {
                          onClaimPassTier(tier.tier, false);
                          notify(`Claimed Free Tier ${tier.tier}!`);
                        }}
                        className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white disabled:bg-slate-800 disabled:text-slate-500"
                      >
                        {freeClaimed ? 'Done' : unlocked ? 'Claim' : 'Locked'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-950/35 p-2 border border-amber-500/35">
                      <span className="font-bold text-amber-200 truncate">{tier.premiumLabel}</span>
                      <button
                        disabled={!unlocked || !save.premiumFestivalPass || premClaimed}
                        onClick={() => {
                          onClaimPassTier(tier.tier, true);
                          notify(`Claimed Premium Tier ${tier.tier}!`);
                        }}
                        className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-black text-slate-950 disabled:bg-slate-800 disabled:text-slate-500"
                      >
                        {premClaimed ? 'Done' : !save.premiumFestivalPass ? 'VIP' : unlocked ? 'Claim' : 'Locked'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'cosmetics' && (
          <div className="mt-4 flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-extrabold text-white mb-2">Multiverse Board Themes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(THEMES).map((th) => {
                  const owned = save.unlockedThemes.includes(th.id);
                  const active = save.settings.theme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => {
                        onBuyOrEquipTheme(th.id);
                        soundService.playTap();
                      }}
                      className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all ${
                        active
                          ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-400/50'
                          : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                      }`}
                    >
                      <div className={`h-8 w-full rounded-lg bg-gradient-to-r ${th.bannerGradient}`} />
                      <div className="mt-2 text-xs font-extrabold text-white">{th.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {active ? 'Equipped ✓' : owned ? 'Tap to Equip' : `${th.priceCoins} Credits`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-white mb-2">Commander Nova Armor Suits</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {MASCOT_OUTFITS.map((out) => {
                  const owned = save.unlockedOutfits.includes(out.id);
                  const active = save.equippedOutfit === out.id;
                  return (
                    <button
                      key={out.id}
                      onClick={() => {
                        onBuyOrEquipOutfit(out.id);
                        soundService.playTap();
                      }}
                      className={`flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
                        active
                          ? 'border-emerald-400 bg-emerald-950/60 ring-2 ring-emerald-400/50'
                          : 'border-slate-800 bg-slate-900/90 hover:border-slate-600'
                      }`}
                    >
                      <ChotuMascot mood="cheer" outfit={out.id} size="sm" />
                      <div className="mt-2 text-xs font-extrabold text-white">{out.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        {active ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Equipped
                          </>
                        ) : owned ? (
                          'Equip'
                        ) : (
                          `${out.priceCoins} Credits`
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
