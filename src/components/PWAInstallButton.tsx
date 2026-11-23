import React, { useState } from 'react';
import { Download, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ label?: string; compact?: boolean }> = ({
  label = 'Install App',
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        <Download className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-slate-900/90 text-emerald-300 font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{label}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-[#0C1322] p-6 shadow-2xl border border-emerald-500/40 text-slate-100">
              <h3 className="text-lg font-bold text-white">Install Super Crush: Doomsday on iOS</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                1. Tap the <strong>Share</strong> icon in Safari&apos;s toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
                3. Launch anytime — works 100% offline!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineToast: React.FC<{ text: string }> = ({ text }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-xl bg-[#0B1220]/95 px-3.5 py-2 text-xs font-medium text-emerald-100 shadow-lg border border-emerald-500/40"
    >
      <WifiOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>{text}</span>
    </div>
  );
};
