# Super Crush: Doomsday — Avengers Match-3 Puzzle (APK & PWA)

An offline-first superhero match-3 puzzle game featuring **5 playable Avengers with unique Ultimate Powers**, the **6-Stone Infinity Gauntlet & SNAP!**, **60 cinematic story missions across 5 Movie Acts**, **Live Boss Counterattacks & Stun**, **60-Second Infinity Blitz**, **3D Helicarrier Holo-Deck 4-way Gravity Shift**, **Stark Arc Forge**, and **Mission Architect**.

---

## Building the Android APK / Google Play AAB

This project includes a pre-configured `capacitor.config.json`, adaptive maskable icons (`public/pwa-maskable-512x512.png`), Android lifecycle audio pause/resume, hardware Back button handling, and an auto-bridged `AdService` + `IAPService`.

### Option A: Native Android APK with Capacitor + Google AdMob (Recommended for Play Store)

1. **Create `.env.production`** (do NOT commit live IDs to Git):
   ```bash
   VITE_ADMOB_TEST_MODE="false"
   VITE_ADMOB_REWARDED_ID="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
   VITE_ADMOB_INTERSTITIAL_ID="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
   VITE_ADMOB_BANNER_ID="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
   VITE_IAP_TEST_MODE="false"
   ```

2. **Build the production bundle & add Android**:
   ```bash
   npm run build
   npm install @capacitor/core @capacitor/cli @capacitor-community/admob
   npx cap add android
   npx cap sync android
   ```

3. **Set your AdMob App ID** in `android/app/src/main/AndroidManifest.xml` inside `<application>`:
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ" />
   ```

4. **Generate Android Adaptive Launcher Icons** from `public/pwa-512x512.png` and `public/pwa-maskable-512x512.png`:
   - In Android Studio: **File → New → Image Asset → Launcher Icons (Adaptive & Legacy)**
   - Foreground layer: `public/pwa-maskable-512x512.png`
   - Background color: `#070B12`

5. **Build Signed APK / Play Store AAB**:
   ```bash
   npx cap open android
   ```
   In Android Studio: **Build → Generate Signed Bundle / APK** → choose **Android App Bundle (.aab)** for Google Play or **APK** for direct install.

> `src/services/adService.ts` automatically detects `window.Capacitor.Plugins.AdMob`, enforces first-launch consent, pauses Web Audio during ads, hides banners during gameplay and for Ad-Free/VIP users, and caps interstitials (≥5 completed levels, max 1 per 4 wins, ≥3 min cooldown, never after a loss).

---

### Option B: Fast APK via PWABuilder / Bubblewrap (Trusted Web Activity)

1. Deploy your `npm run build` output over HTTPS.
2. Open [PWABuilder](https://www.pwabuilder.com/) (or run `npx @bubblewrap/cli init --manifest https://YOUR_DOMAIN/manifest.webmanifest`).
3. Download the signed Android APK / AAB and upload `.well-known/assetlinks.json` to your domain to verify fullscreen TWA mode without a browser address bar.

---

## Pre-Publish Checklist (Verified)
- **Icons**: `icon.svg`, `favicon-32x32.png`, `apple-touch-icon.png` (180×180), `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png` (safe-zone padded), `og-banner.jpg` (1200×630).
- **Offline Support**: Workbox precache + CacheFirst runtime cache for all hero posters and emblem assets; IndexedDB + localStorage dual persistence.
- **Android APK UX**: Hardware/gesture Back button closes modals and steps back cleanly; Web Audio suspends automatically when minimized or during ads; text selection disabled on game board; notch/gesture-bar safe-area insets applied.
- **Monetization & Compliance**: First-launch consent gate, Privacy Policy with AdMob/Play Billing disclosure, Restore Purchases button, frequency-capped interstitials, optional rewarded ads, zero ads during active puzzles.
