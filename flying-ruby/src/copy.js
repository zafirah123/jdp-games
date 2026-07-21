// Resolves UI copy based on the URL `lang` parameter - see CLAUDE.md section 6.4.
//
// Default is English. `?lang=ms` switches the whole game to Bahasa Melayu.
// Any unrecognized `lang` value falls back to English. The choice is *not*
// persisted across visits - the URL is the source of truth so links shared
// between players carry the intended language.
//
// The five canonical keys (start, timeUp, gameOver, audioOn, audioOff) MUST
// stay aligned across every JDP game. Game-specific keys live alongside.
const LANG = new URLSearchParams(location.search).get('lang') === 'ms' ? 'ms' : 'en';

export const COPY = {
  en: {
    // --- canonical (section 6.4) ---------------------------------------
    start:      'START GAME',
    timeUp:     "TIME'S UP!",
    gameOver:   'GAME OVER',
    audioOn:    'AUDIO ON',
    audioOff:   'AUDIO OFF',
    claimScore: 'CLAIM SCORE',
    retry:      'RETRY',
    claimUnavailable: 'CALLBACK UNAVAILABLE',
    claimPreparing:   'Preparing claim...',
    claimOpening:     'Claiming score...',
    claimRetryHint:   'If nothing happens, please try again.',
    claimSubmitting:  'Sending your score...',
    claimFailed:      'Unable to open the score claim. Please try again.',
    // --- StartScene -----------------------------------------------------
    tagline:  'Tap to fly - Collect rubies - Beat 3:00',
    // --- GameScene ------------------------------------------------------
    tapToFly:    'TAP TO FLY',
    tapSub:      'avoid obstacles - grab rubies',
    hudTime:     'TIME',
    magnetLabel: 'MAGNET!',
    rushLabel:   'POWER RUSH!',
    paused:      'PAUSED',
    pauseSub:    'End the run now and submit your score?',
    resumeBtn:   'RESUME',
    // --- GameOverScene --------------------------------------------------
    fullRoundDone: 'Your full 3:00 is up - nice flying!',
    timeLeft:      (mmss) => `${mmss} left of your 3:00`,
    rubiesCollected: 'RUBIES COLLECTED',
    best:    'BEST',
    newBest: 'NEW BEST!',
    timeFlown: (mmss) => `Time flown: ${mmss}`,
    continueBtn: 'CONTINUE',
    endRunBtn:   'END RUN',
  },
  ms: {
    // --- canonical (section 6.4) ---------------------------------------
    start:      'MULA MAIN',
    timeUp:     'MASA TAMAT!',
    gameOver:   'PERMAINAN TAMAT',
    audioOn:    'AUDIO ON',
    audioOff:   'AUDIO OFF',
    claimScore: 'TUNTUT SKOR',
    retry:      'RETRY',
    claimUnavailable: 'PANGGIL BALIK TIADA',
    claimPreparing:   'Sedang menyediakan tuntutan...',
    claimOpening:     'Sedang tuntut skor...',
    claimRetryHint:   'Jika tiada apa berlaku, sila cuba lagi.',
    claimSubmitting:  'Menghantar skor anda...',
    claimFailed:      'Tidak dapat membuka tuntutan skor. Sila cuba lagi.',
    // --- StartScene -----------------------------------------------------
    tagline:  'Ketuk untuk terbang - Kutip delima - Tewaskan 3:00',
    // --- GameScene ------------------------------------------------------
    tapToFly:    'KETUK UNTUK TERBANG',
    tapSub:      'elak halangan - kutip delima',
    hudTime:     'MASA',
    magnetLabel: 'MAGNET!',
    rushLabel:   'KUASA RUSH!',
    paused:      'DIJEDA',
    pauseSub:    'Tamatkan pusingan dan hantar skor anda?',
    resumeBtn:   'SAMBUNG',
    // --- GameOverScene --------------------------------------------------
    fullRoundDone: 'Masa 3:00 anda habis - terbangan yang hebat!',
    timeLeft:      (mmss) => `${mmss} berbaki daripada 3:00 anda`,
    rubiesCollected: 'DELIMA DIKUTIP',
    best:    'TERBAIK',
    newBest: 'REKOD BAHARU!',
    timeFlown: (mmss) => `Masa terbang: ${mmss}`,
    continueBtn: 'TERUSKAN',
    endRunBtn:   'TAMATKAN PUSINGAN',
  },
}[LANG];
