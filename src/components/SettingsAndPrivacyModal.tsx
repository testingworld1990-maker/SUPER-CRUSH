import React, { useState } from 'react';
import { DOOMSDAY_LOGO_URL } from '../game/superheroes';
import { THEMES } from '../game/themes';
import { GameSettings, GridSize, Language, SaveState, ThemeId } from '../game/types';
import { getT } from '../i18n/translations';
import { IAPService } from '../services/iapService';
import { PWAInstallButton } from './PWAInstallButton';
import { Eye, Globe, Music, RotateCcw, Shield, Trash2, Vibrate, Volume2, X } from 'lucide-react';

interface SettingsModalProps {
  save: SaveState;
  onClose: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onUpdatePlayerName: (name: string) => void;
  onRestorePurchases: (skus: string[]) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  save,
  onClose,
  onUpdateSettings,
  onUpdatePlayerName,
  onRestorePurchases,
  onResetProgress,
}) => {
  const t = getT(save.settings.language);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [restoreNote, setRestoreNote] = useState<string | null>(null);

  if (showPrivacy) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-3xl bg-[#0B121E] text-slate-100 p-6 shadow-2xl border border-emerald-500/45">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-black text-white">{t.privacyTitle}</h2>
            <button
              onClick={() => setShowPrivacy(false)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-slate-800 text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-300">
            <p>
              <strong className="text-emerald-300">Offline-First Storage:</strong> Super Crush: Doomsday stores your mission progress, stars, credits, custom missions,
              and preferences locally on your device using IndexedDB and localStorage. No account login is required.
            </p>
            <p>
              <strong className="text-emerald-300">Advertising &amp; Google AdMob:</strong> Ads only load when your device is
              online and consent has been accepted. Banner ads appear only on the Command HQ and Saga Map (never during active
              puzzles), interstitial ads are frequency-capped, and rewarded video ads are 100% optional and user-initiated.
              When enabled, Google AdMob may process device advertising identifiers in accordance with Google&apos;s Privacy Policy.
            </p>
            <p>
              <strong className="text-emerald-300">In-App Purchases:</strong> Optional upgrades (such as Remove All Ads or the
              Doomsday Pass) are processed securely through Google Play Billing. Super Crush: Doomsday never stores payment card
              information.
            </p>
            <p>
              <strong className="text-emerald-300">Family &amp; Player Safety:</strong> Super Crush: Doomsday does not collect
              personal contact details, precise location, contacts, or camera/microphone data.
            </p>
            <p>
              <strong className="text-emerald-300">Data Control:</strong> You can erase all locally stored game data at any time
              from Settings → Reset Local Save Data.
            </p>
          </div>
          <button
            onClick={() => setShowPrivacy(false)}
            className="mt-5 min-h-[44px] w-full rounded-xl bg-emerald-500 text-sm font-black text-slate-950 hover:bg-emerald-400"
          >
            Close Policy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-3xl bg-[#0B121E] text-slate-100 p-5 sm:p-6 shadow-2xl border border-emerald-500/45">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white">{t.settings}</h2>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onUpdateSettings({ sound: !save.settings.sound })}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-bold ${
                save.settings.sound
                  ? 'bg-emerald-950/65 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" /> Sound FX
              </span>
              <span>{save.settings.sound ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ music: !save.settings.music })}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-bold ${
                save.settings.music
                  ? 'bg-emerald-950/65 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Music className="w-4 h-4" /> Hero Synth
              </span>
              <span>{save.settings.music ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ vibration: !save.settings.vibration })}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-bold ${
                save.settings.vibration
                  ? 'bg-emerald-950/65 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Vibrate className="w-4 h-4" /> Haptics
              </span>
              <span>{save.settings.vibration ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ colorBlindMode: !save.settings.colorBlindMode })}
              className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 text-xs font-bold ${
                save.settings.colorBlindMode
                  ? 'bg-emerald-950/65 border-emerald-500/60 text-emerald-200'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> Color-Blind
              </span>
              <span>{save.settings.colorBlindMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 mb-1.5">
              <Globe className="w-3.5 h-3.5" /> Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'en', label: 'English' },
                  { id: 'ta', label: 'தமிழ்' },
                  { id: 'hi', label: 'हिन्दी' },
                ] as Array<{ id: Language; label: string }>
              ).map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => onUpdateSettings({ language: lang.id })}
                  className={`min-h-[40px] rounded-xl border text-xs font-bold ${
                    save.settings.language === lang.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-1.5">Active Theme</label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(THEMES) as ThemeId[]).map((tid) => {
                const owned = save.unlockedThemes.includes(tid);
                return (
                  <button
                    key={tid}
                    disabled={!owned}
                    onClick={() => onUpdateSettings({ theme: tid })}
                    className={`min-h-[36px] rounded-lg px-3 text-xs font-bold border ${
                      save.settings.theme === tid
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : owned
                        ? 'bg-slate-900 text-slate-200 border-slate-700'
                        : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {THEMES[tid].name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-1.5">Sim Training Grid Size</label>
            <div className="grid grid-cols-3 gap-2">
              {([7, 8, 9] as GridSize[]).map((sz) => (
                <button
                  key={sz}
                  onClick={() => onUpdateSettings({ relaxGridSize: sz })}
                  className={`min-h-[38px] rounded-xl border text-xs font-bold ${
                    save.settings.relaxGridSize === sz
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-200 border-slate-700'
                  }`}
                >
                  {sz} × {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-1">Agent Callsign</label>
            <input
              value={save.playerName}
              maxLength={18}
              onChange={(e) => onUpdatePlayerName(e.target.value)}
              className="w-full min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3">
            <PWAInstallButton label={t.installApp} compact />
            <button
              onClick={async () => {
                const res = await IAPService.restorePurchases();
                if (res.restoredSkus.length > 0) onRestorePurchases(res.restoredSkus);
                setRestoreNote(res.message);
                window.setTimeout(() => setRestoreNote(null), 3000);
              }}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> Restore Purchases
            </button>
            <button
              onClick={() => setShowPrivacy(true)}
              className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
            >
              <Shield className="w-4 h-4 text-emerald-400" /> {t.privacyTitle}
            </button>
          </div>
          {restoreNote && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/70 px-3 py-2 text-xs font-semibold text-emerald-200">
              {restoreNote}
            </div>
          )}

          <div className="border-t border-slate-800 pt-3">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-rose-950/60 border border-rose-500/35 text-xs font-bold text-rose-300 hover:bg-rose-900/60"
              >
                <Trash2 className="w-4 h-4" /> Reset Local Save Data
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="flex-1 min-h-[40px] rounded-xl bg-rose-600 text-xs font-bold text-white"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 min-h-[40px] rounded-xl bg-slate-800 text-xs font-bold text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
            <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
              Super Crush: Doomsday · Version 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/** First-Launch Consent & Privacy Gate featuring the Doomsday Logo Crest */
export const ConsentModal: React.FC<{
  language: Language;
  onAccept: (offlineOnly: boolean) => void;
}> = ({ language, onAccept }) => {
  const t = getT(language);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-[#0B121E] text-slate-100 p-6 shadow-2xl border border-emerald-500/50 text-center">
        <div className="mx-auto mb-3 w-48 aspect-video overflow-hidden rounded-2xl border border-emerald-400/60 shadow-[0_0_28px_rgba(16,185,129,0.35)] bg-slate-950">
          <img
            src={DOOMSDAY_LOGO_URL}
            alt="Super Crush Doomsday Logo"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="text-[10px] font-black tracking-[0.28em] text-emerald-400 uppercase">
          Avengers Match-3 Edition
        </div>
        <h2 className="mt-1 text-2xl font-black text-white">{t.consentTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Super Crush: Doomsday works <strong className="text-emerald-300">100% offline</strong> with local saves on your device. When online, optional
          rewarded ads help earn free tactical boosters and extra turns. By continuing, you agree to our local storage &amp;
          privacy practices.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <button
            onClick={() => onAccept(false)}
            className="min-h-[48px] w-full rounded-xl bg-emerald-500 text-sm font-black text-slate-950 hover:bg-emerald-400 shadow-md"
          >
            {t.consentAccept}
          </button>
          <button
            onClick={() => onAccept(true)}
            className="min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800"
          >
            {t.consentOfflineOnly}
          </button>
        </div>
      </div>
    </div>
  );
};
