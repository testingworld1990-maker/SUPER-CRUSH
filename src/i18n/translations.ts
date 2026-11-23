import { Language } from '../game/types';

export interface TranslationStrings {
  appTitle: string;
  tagline: string;
  playCampaign: string;
  continueLevel: string;
  relaxMode: string;
  dailyChallenge: string;
  festivalEvents: string;
  dailyRewards: string;
  shopAndPass: string;
  stickerAlbum: string;
  levelEditor: string;
  settings: string;
  installApp: string;
  moves: string;
  score: string;
  time: string;
  undo: string;
  pause: string;
  resume: string;
  restart: string;
  exitToMap: string;
  levelComplete: string;
  outOfMoves: string;
  levelFailed: string;
  nextLevel: string;
  tryAgain: string;
  watchAd5Moves: string;
  watchAdRevive: string;
  watchAd2xCoins: string;
  watchAdFreeBooster: string;
  watchAdRefillLives: string;
  watchAdDoubleReward: string;
  watchAdBonusSpin: string;
  noMovesShuffling: string;
  sugarRush: string;
  offlineReady: string;
  praise: [string, string, string, string];
  goals: {
    score: string;
    jelly: string;
    collect: string;
    cherry: string;
    boss: string;
  };
  tutorial: {
    swapTitle: string;
    swapBody: string;
    specialTitle: string;
    specialBody: string;
    jellyTitle: string;
    jellyBody: string;
    gotIt: string;
  };
  chotuQuotes: {
    idle: string;
    cheer: string;
    gasp: string;
    dance: string;
    sad: string;
    boss: string;
  };
  privacyTitle: string;
  consentTitle: string;
  consentAccept: string;
  consentOfflineOnly: string;
}

export const TRANSLATIONS: Record<Language, TranslationStrings> = {
  en: {
    appTitle: 'Super Crush',
    tagline: 'Assemble the Avengers across 60 Doomsday missions',
    playCampaign: 'Movie Saga Map',
    continueLevel: 'Deploy Mission',
    relaxMode: 'Sim Training',
    dailyChallenge: 'Daily Avenger Op',
    festivalEvents: 'Multiverse Ops',
    dailyRewards: 'Daily Supply Spin',
    shopAndPass: 'Armory & Doomsday Pass',
    stickerAlbum: 'Avenger Vault & Badges',
    levelEditor: 'Mission Architect',
    settings: 'Settings',
    installApp: 'Install App',
    moves: 'Turns',
    score: 'Power',
    time: 'Timer',
    undo: 'Rewind',
    pause: 'Pause',
    resume: 'Resume',
    restart: 'Retry',
    exitToMap: 'Saga Map',
    levelComplete: 'Avengers Victory!',
    outOfMoves: 'Out of Turns!',
    levelFailed: 'Mission Interrupted!',
    nextLevel: 'Next Mission',
    tryAgain: 'Redeploy',
    watchAd5Moves: 'Watch Ad for +5 Turns',
    watchAdRevive: 'Watch Ad to Revive',
    watchAd2xCoins: 'Watch Ad for 2x Credits',
    watchAdFreeBooster: 'Free Tech (Ad)',
    watchAdRefillLives: 'Watch Ad to Recharge Energy',
    watchAdDoubleReward: 'Watch Ad for 2x Supply',
    watchAdBonusSpin: 'Watch Ad for Bonus Spin',
    noMovesShuffling: 'No moves — Quantum shuffling grid!',
    sugarRush: 'Doomsday Surge!',
    offlineReady: 'Offline Mode — Helicarrier systems online',
    praise: ['Avengers Smash!', 'Cosmic Surge!', 'Doomsday Breaker!', 'Legendary!'],
    goals: {
      score: 'Power',
      jelly: 'Clear Doom Shield',
      collect: 'Charge',
      cherry: 'Drop Tesseracts',
      boss: 'Defeat Villain',
    },
    tutorial: {
      swapTitle: 'Welcome to Super Crush: Doomsday!',
      swapBody: 'Swipe, drag, or tap two adjacent Avenger Relics to swap them and align 3 or more matching cores.',
      specialTitle: 'Forge Avenger Super-Weapons!',
      specialBody: 'Match 4 for a Repulsor Beam, match 5 in a line for an Infinity Singularity Orb, or make an L/T shape for a Quantum Nova. Combine two specials for a cinematic mega blast!',
      jellyTitle: 'Shatter Doomsday Energy Shields!',
      jellyBody: 'Match relics on top of glowing emerald Doom Shield tiles to clear them. Double-layer shields take two strikes to shatter.',
      gotIt: 'Avengers Assemble!',
    },
    chotuQuotes: {
      idle: 'Arc Reactors online — awaiting your command!',
      cheer: 'Avengers Smash! Massive energy cascade!',
      gasp: 'Alert! Only a few tactical turns remaining!',
      dance: 'Mission accomplished! Earth’s Mightiest Hero!',
      sad: 'Regroup, Avenger — we will break through next run!',
      boss: 'Unleash super-combos to shatter the Villain’s armor!',
    },
    privacyTitle: 'Privacy Policy',
    consentTitle: 'Welcome to Super Crush: Doomsday',
    consentAccept: 'Accept & Assemble',
    consentOfflineOnly: 'Play Offline (No Ads)',
  },
  ta: {
    appTitle: 'சூப்பர் கிரஷ்',
    tagline: '60 டூம்ஸ்டே பணிகளில் அவெஞ்சர்ஸ் அணியை ஒன்றுதிரட்டுங்கள்',
    playCampaign: 'திரைப்பட வரைபடம்',
    continueLevel: 'பணி தொடங்கு',
    relaxMode: 'பயிற்சி பயன்முறை',
    dailyChallenge: 'தினசரி அவெஞ்சர் பணி',
    festivalEvents: 'மல்டிவர்ஸ் பணிகள்',
    dailyRewards: 'தினசரி விநியோக சக்கரம்',
    shopAndPass: 'ஆயுதக் கிடங்கு & பாஸ்',
    stickerAlbum: 'அவெஞ்சர் பதக்கங்கள்',
    levelEditor: 'பணி உருவாக்கி',
    settings: 'அமைப்புகள்',
    installApp: 'நிறுவு',
    moves: 'நகர்வுகள்',
    score: 'சக்தி',
    time: 'நேரம்',
    undo: 'மீளமை',
    pause: 'இடைநிறுத்து',
    resume: 'தொடர்',
    restart: 'மீண்டும்',
    exitToMap: 'வரைபடம்',
    levelComplete: 'அவெஞ்சர்ஸ் வெற்றி!',
    outOfMoves: 'நகர்வுகள் முடிந்தன!',
    levelFailed: 'பணி தடைபட்டது!',
    nextLevel: 'அடுத்த பணி',
    tryAgain: 'மீண்டும் முயல்',
    watchAd5Moves: 'விளம்பரம் பார்த்து +5 நகர்வுகள்',
    watchAdRevive: 'விளம்பரம் பார்த்து தொடரவும்',
    watchAd2xCoins: 'விளம்பரம் பார்த்து 2x கிரெடிட்',
    watchAdFreeBooster: 'இலவச கருவி (விளம்பரம்)',
    watchAdRefillLives: 'சக்தி நிரப்ப விளம்பரம்',
    watchAdDoubleReward: '2x பரிசுக்கு விளம்பரம்',
    watchAdBonusSpin: 'கூடுதல் சுழலுக்கு விளம்பரம்',
    noMovesShuffling: 'நகர்வுகள் இல்லை — குவாண்டம் கலப்பு!',
    sugarRush: 'டூம்ஸ்டே வேகம்!',
    offlineReady: 'ஆஃப்லைன் — முழு அமைப்பும் தயார்',
    praise: ['அவெஞ்சர்ஸ் ஸ்மாஷ்!', 'சூப்பர் சக்தி!', 'டூம்ஸ்டே உடைப்பு!', 'லெஜண்டரி!'],
    goals: {
      score: 'சக்தி',
      jelly: 'கவசம் உடை',
      collect: 'சேகரி',
      cherry: 'டெசராக்ட் இறக்கு',
      boss: 'வில்லனை வீழ்த்து',
    },
    tutorial: {
      swapTitle: 'சூப்பர் கிரஷ்: டூம்ஸ்டேக்கு வரவேற்கிறோம்!',
      swapBody: 'அருகிலுள்ள இரண்டு அவெஞ்சர் சக்திகளை மாற்றி 3 அல்லது அதற்கு மேற்பட்ட ஒரே சின்னங்களை இணைக்கவும்.',
      specialTitle: 'சூப்பர் ஆயுதங்களை உருவாக்குங்கள்!',
      specialBody: '4 இணைத்தால் ரிபல்சர் கதிர், 5 இணைத்தால் இன்பினிட்டி கோளம், L/T வடிவில் குவாண்டம் நோவா கிடைக்கும்!',
      jellyTitle: 'டூம் கவசங்களை உடையுங்கள்!',
      jellyBody: 'பச்சை நிற டூம் கவசங்களின் மேல் சக்திகளை இணைத்து அவற்றை நீக்கவும்.',
      gotIt: 'அவெஞ்சர்ஸ் ஒன்றுகூடு!',
    },
    chotuQuotes: {
      idle: 'ஆர்க் ரியாக்டர் தயார் — உங்கள் கட்டளைக்குக் காத்திருக்கிறேன்!',
      cheer: 'அபாரம்! பிரம்மாண்ட சக்தித் தாக்குதல்!',
      gasp: 'எச்சரிக்கை! சில நகர்வுகளே உள்ளன!',
      dance: 'வெற்றி! பூமியின் மாபெரும் ஹீரோ!',
      sad: 'கவலை வேண்டாம், மீண்டும் தாக்குவோம்!',
      boss: 'வில்லனின் கவசத்தை உடைக்க பெரிய காம்போ செய்!',
    },
    privacyTitle: 'தனியுரிமைக் கொள்கை',
    consentTitle: 'சூப்பர் கிரஷ்: டூம்ஸ்டே',
    consentAccept: 'ஏற்று தொடங்கு',
    consentOfflineOnly: 'ஆஃப்லைன் விளையாட்டு',
  },
  hi: {
    appTitle: 'सुपर क्रश',
    tagline: '60 डूम्सडे मिशनों में एवेंजर्स टीम को एकजुट करें',
    playCampaign: 'मूवी सागा मैप',
    continueLevel: 'मिशन शुरू करें',
    relaxMode: 'ट्रेनिंग मोड',
    dailyChallenge: 'दैनिक एवेंजर मिशन',
    festivalEvents: 'मल्टीवर्स मिशन',
    dailyRewards: 'दैनिक सप्लाई व्हील',
    shopAndPass: 'आर्मरी और डूम्सडे पास',
    stickerAlbum: 'एवेंजर बैज और तिजोरी',
    levelEditor: 'मिशन एडिटर',
    settings: 'सेटिंग्स',
    installApp: 'ऐप इंस्टॉल करें',
    moves: 'चालें',
    score: 'पावर',
    time: 'समय',
    undo: 'वापस',
    pause: 'रोकें',
    resume: 'जारी रखें',
    restart: 'फिर से',
    exitToMap: 'सागा मैप',
    levelComplete: 'एवेंजर्स की जीत!',
    outOfMoves: 'चालें समाप्त!',
    levelFailed: 'मिशन अधूरा रहा!',
    nextLevel: 'अगला मिशन',
    tryAgain: 'फिर तैनात हों',
    watchAd5Moves: 'विज्ञापन देखें +5 चालें पाएं',
    watchAdRevive: 'पुनर्जीवित होने के लिए विज्ञापन देखें',
    watchAd2xCoins: '2x क्रेडिट के लिए विज्ञापन देखें',
    watchAdFreeBooster: 'मुफ़्त टेक (विज्ञापन)',
    watchAdRefillLives: 'ऊर्जा भरने के लिए विज्ञापन देखें',
    watchAdDoubleReward: '2x इनाम के लिए विज्ञापन देखें',
    watchAdBonusSpin: 'बोनस स्पिन के लिए विज्ञापन देखें',
    noMovesShuffling: 'कोई चाल नहीं — क्वांटम शफल सक्रिय!',
    sugarRush: 'डूम्सडे सर्ज!',
    offlineReady: 'ऑफ़लाइन मोड — हेलिकैरियर सिस्टम तैयार',
    praise: ['एवेंजर्स स्मैश!', 'कॉस्मिक सर्ज!', 'डूम्सडे ब्रेकर!', 'लेजेंडरी!'],
    goals: {
      score: 'पावर',
      jelly: 'डूम शील्ड तोड़ें',
      collect: 'चार्ज करें',
      cherry: 'टेसेरैक्ट गिराएं',
      boss: 'विलेन हराएं',
    },
    tutorial: {
      swapTitle: 'सुपर क्रश: डूम्सडे में स्वागत है!',
      swapBody: '3 या अधिक समान एवेंजर रिलिक्स को मिलाने के लिए पास की दो टाइलों को स्वैप या टैप करें।',
      specialTitle: 'सुपर-हथियार बनाएं!',
      specialBody: '4 मिलाने पर रिपल्सर बीम, 5 मिलाने पर इन्फिनिटी ऑर्ब, और L/T आकार पर क्वांटम नोवा बनता है!',
      jellyTitle: 'डूम एनर्जी शील्ड तोड़ें!',
      jellyBody: 'हरी डूम शील्ड टाइलों के ऊपर मैच करके उन्हें नष्ट करें। दोहरी शील्ड को दो प्रहार चाहिए।',
      gotIt: 'एवेंजर्स असेंबल!',
    },
    chotuQuotes: {
      idle: 'आर्क रिएक्टर ऑनलाइन — आपके आदेश का इंतज़ार है!',
      cheer: 'एवेंजर्स स्मैश! शानदार एनर्जी कॉम्बो!',
      gasp: 'सावधान! केवल कुछ ही चालें बची हैं!',
      dance: 'मिशन पूरा! पृथ्वी के सबसे महान हीरो!',
      sad: 'हिम्मत न हारें, अगली बार जीत पक्की है!',
      boss: 'विलेन का कवच तोड़ने के लिए बड़े कॉम्बो बनाएं!',
    },
    privacyTitle: 'गोपनीयता नीति',
    consentTitle: 'सुपर क्रश: डूम्सडे में स्वागत है',
    consentAccept: 'स्वीकार करें और शुरू करें',
    consentOfflineOnly: 'ऑफ़लाइन खेलें',
  },
};

export function getT(lang: Language): TranslationStrings {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}
