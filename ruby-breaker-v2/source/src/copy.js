// UI copy + language switching — see root CLAUDE.md §6.4.
//
// Default is English. `?lang=ms` switches the whole game to Bahasa Melayu.
// Any unrecognized `lang` value falls back to English. The choice is NOT
// persisted across visits — the URL is the source of truth so links shared
// between players carry the intended language.
//
// The canonical keys (start, timeUp, gameOver, audioOn, audioOff,
// claimScore) MUST stay aligned with every other JDP game. Game-specific
// keys live alongside.
const LANG = new URLSearchParams(location.search).get('lang') === 'ms' ? 'ms' : 'en';

export const COPY = {
  en: {
    // --- canonical (§6.4) ----------------------------------------------
    start:      'START GAME',
    timeUp:     "TIME'S UP!",
    gameOver:   'GAME OVER',
    audioOn:    'AUDIO ON',
    audioOff:   'AUDIO OFF',
    claimScore: 'CLAIM SCORE',
    // --- StartScene -----------------------------------------------------
    howToPlay:  'HOW TO PLAY',
    best:       'BEST',
    howRows: [
      ['GOAL',   'Collect 500 rubies'],
      ['TIMER',  '3 minutes only!'],
      ['MOVE',   'Mouse / touch'],
      ['LAUNCH', 'Click / tap'],
      ['RUBY',   'Catch falling gems'],
      ['MISS',   'Ruby hits ground = lost'],
      ['BRICKS', 'New wave when cleared'],
    ],
    tapToClose: 'TAP TO CLOSE',
    // --- GameScene ------------------------------------------------------
    paused:     'PAUSED',
    pauseSub:   'Exit now and claim your rubies, or keep playing?',
    resumeBtn:  'CONTINUE',
    endRunBtn:  'EXIT & CLAIM',
    lifeLeft:   (n) => `${n} LIFE LEFT!\nTAP TO LAUNCH`,
    // --- GameOverScene --------------------------------------------------
    victory:        'VICTORY!',
    levelReached:   (n) => `ROUND  ${n}`,
    rubiesCollected:'RUBIES COLLECTED',
    newBest:        'NEW BEST!',
  },
  ms: {
    // --- canonical (§6.4) ----------------------------------------------
    start:      'MULA MAIN',
    timeUp:     'MASA TAMAT!',
    gameOver:   'PERMAINAN TAMAT',
    audioOn:    'AUDIO ON',
    audioOff:   'AUDIO OFF',
    claimScore: 'TUNTUT SKOR',
    // --- StartScene -----------------------------------------------------
    howToPlay:  'CARA MAIN',
    best:       'TERBAIK',
    howRows: [
      ['MATLAMAT', 'Kutip 500 delima'],
      ['MASA',     '3 minit sahaja!'],
      ['GERAK',    'Tetikus / sentuh'],
      ['LANCAR',   'Klik / ketuk'],
      ['DELIMA',   'Tangkap delima jatuh'],
      ['TERLEPAS', 'Delima kena lantai = hilang'],
      ['BATA',     'Gelombang baharu bila habis'],
    ],
    tapToClose: 'KETUK UNTUK TUTUP',
    // --- GameScene ------------------------------------------------------
    paused:     'DIJEDA',
    pauseSub:   'Keluar dan tuntut delima anda, atau teruskan main?',
    resumeBtn:  'SAMBUNG',
    endRunBtn:  'KELUAR & TUNTUT',
    lifeLeft:   (n) => `${n} NYAWA LAGI!\nKETUK UNTUK LANCAR`,
    // --- GameOverScene --------------------------------------------------
    victory:        'KEMENANGAN!',
    levelReached:   (n) => `PUSINGAN  ${n}`,
    rubiesCollected:'DELIMA DIKUTIP',
    newBest:        'REKOD BAHARU!',
  },
}[LANG];
