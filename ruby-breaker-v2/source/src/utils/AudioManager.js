// Procedural audio via Web Audio API – no files needed

let ctx = null;
let bgmScheduler = null;
let bgmRunning = false;
let masterGain = null;
let bgmGain = null;          // BGM-only sub-bus, so stopBGM can kill in-flight notes without affecting other audio (e.g. pacman-die on game-over)
let muted = false;
let gameoverBuffer = null;
let gameoverSource = null;   // active BufferSource (so it can be stopped explicitly)

// Decode the game-over jingle into the shared AudioContext so it routes
// through masterGain (and therefore respects the mute toggle). We use MP3
// instead of AAC/.m4a here because AAC decode through Web Audio's
// decodeAudioData proved unreliable across browsers in this project (see
// ruby-breaker-v2/CLAUDE.md). MP3 decodes everywhere.
async function loadGameoverSound() {
  if (gameoverBuffer) return;
  try {
    const c = getCtx();
    const res = await fetch(`pacman-die.mp3?v=${Date.now()}`);
    const arr = await res.arrayBuffer();
    gameoverBuffer = await c.decodeAudioData(arr);
  } catch { /* fall back to the synthesized jingle */ }
}

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
    bgmGain = ctx.createGain();
    bgmGain.gain.value = 1;
    bgmGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function makeOsc(type, freq, gainVal, duration, destination) {
  const c = getCtx();
  const g = c.createGain();
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gainVal, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  o.connect(g);
  g.connect(destination || masterGain);
  o.start(c.currentTime);
  o.stop(c.currentTime + duration);
  return { osc: o, gain: g };
}

function makeNoise(gainVal, duration, filterFreq = 800) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const flt = c.createBiquadFilter();
  flt.type = 'bandpass';
  flt.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gainVal, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(flt);
  flt.connect(g);
  g.connect(masterGain);
  src.start();
  return src;
}

const SFX = {
  paddle() {
    const c = getCtx();
    const { osc, gain } = makeOsc('sine', 520, 0.25, 0.12);
    osc.frequency.exponentialRampToValueAtTime(260, c.currentTime + 0.12);
  },

  hit() {
    const c = getCtx();
    const { osc } = makeOsc('square', 880, 0.18, 0.08);
    osc.frequency.exponentialRampToValueAtTime(440, c.currentTime + 0.08);
  },

  break() {
    makeNoise(0.35, 0.18, 600);
    const c = getCtx();
    const { osc } = makeOsc('sawtooth', 340, 0.2, 0.15);
    osc.frequency.exponentialRampToValueAtTime(80, c.currentTime + 0.15);
  },

  powerup() {
    const c = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.2, c.currentTime + i * 0.1);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.15);
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(g2);
      g2.connect(masterGain);
      o.start(c.currentTime + i * 0.1);
      o.stop(c.currentTime + i * 0.1 + 0.15);
    });
  },

  life() {
    const c = getCtx();
    const notes = [880, 660, 440, 330];
    notes.forEach((f, i) => {
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.22, c.currentTime + i * 0.12);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.12 + 0.2);
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(g2);
      g2.connect(masterGain);
      o.start(c.currentTime + i * 0.12);
      o.stop(c.currentTime + i * 0.12 + 0.2);
    });
  },

  gameover() {
    const c = getCtx();
    // play the uploaded clip ONCE if it has decoded; otherwise fall back to the synth jingle
    if (gameoverBuffer) {
      // stop any previous game-over clip before starting a new one (e.g. retry → game over again)
      if (gameoverSource) { try { gameoverSource.stop(); } catch (e) { /* already stopped */ } gameoverSource = null; }
      const src = c.createBufferSource();
      src.buffer = gameoverBuffer;
      src.connect(masterGain);
      src.start();
      gameoverSource = src;
      return;
    }
    const notes = [440, 370, 330, 220];
    notes.forEach((f, i) => {
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.25, c.currentTime + i * 0.18);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.18 + 0.3);
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(g2);
      g2.connect(masterGain);
      o.start(c.currentTime + i * 0.18);
      o.stop(c.currentTime + i * 0.18 + 0.3);
    });
  },

  win() {
    const c = getCtx();
    const notes = [523, 659, 784, 1047, 1175, 1047, 784, 1047];
    notes.forEach((f, i) => {
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.22, c.currentTime + i * 0.1);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.1 + 0.18);
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(g2);
      g2.connect(masterGain);
      o.start(c.currentTime + i * 0.1);
      o.stop(c.currentTime + i * 0.1 + 0.18);
    });
  },

  launch() {
    const c = getCtx();
    const { osc } = makeOsc('sine', 220, 0.18, 0.22);
    osc.frequency.exponentialRampToValueAtTime(660, c.currentTime + 0.22);
  },

  laser() {
    const c = getCtx();
    const { osc } = makeOsc('sawtooth', 1200, 0.18, 0.12);
    osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.12);
  },

  // wall/world-boundary bounce
  wall() {
    const c = getCtx();
    const { osc } = makeOsc('square', 300, 0.1, 0.07);
    osc.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.07);
  },

  // combo milestone (x2, x3, x4)
  combo() {
    const c = getCtx();
    const notes = [784, 988, 1175];
    notes.forEach((f, i) => {
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.18, c.currentTime + i * 0.07);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.07 + 0.1);
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(g2);
      g2.connect(masterGain);
      o.start(c.currentTime + i * 0.07);
      o.stop(c.currentTime + i * 0.07 + 0.1);
    });
  },

  // 1-minute warning beep
  timeWarning() {
    const c = getCtx();
    const { osc } = makeOsc('square', 880, 0.22, 0.15);
    osc.frequency.exponentialRampToValueAtTime(440, c.currentTime + 0.15);
  },

  // 30-second urgent tick
  timeCritical() {
    makeOsc('square', 1100, 0.25, 0.08);
  },

  // shield activate
  shieldOn() {
    const c = getCtx();
    const notes = [330, 440, 550];
    notes.forEach((f, i) => {
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.18, c.currentTime + i * 0.06);
      g2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.06 + 0.1);
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g2);
      g2.connect(masterGain);
      o.start(c.currentTime + i * 0.06);
      o.stop(c.currentTime + i * 0.06 + 0.1);
    });
  },

  click() {
    makeOsc('sine', 740, 0.15, 0.06);
  },

  shield() {
    const c = getCtx();
    makeOsc('square', 200, 0.2, 0.15);
  },
};

// BGM: simple looping arpeggio in D minor, with a soft bass note under the
// downbeat of each bar so the loop reads as music rather than a faint blip.
const BGM_NOTES = [294, 349, 440, 523, 440, 349, 370, 294];
const BGM_BASS  = [147, 0, 0, 0, 165, 0, 0, 0]; // root / fifth on the beat
const BGM_TEMPO = 0.22; // seconds per note

function scheduleBGMNote(noteIdx, when) {
  if (!bgmRunning || muted) return;
  const c = getCtx();
  const freq = BGM_NOTES[noteIdx % BGM_NOTES.length];
  const g = c.createGain();
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  // Lead voice — clearly audible over SFX (was 0.06, ~inaudible).
  g.gain.setValueAtTime(0.16, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + BGM_TEMPO * 0.85);
  o.connect(g);
  g.connect(bgmGain);
  o.start(when);
  o.stop(when + BGM_TEMPO);

  // Bass voice — rounder sine on the bar downbeats only.
  const bass = BGM_BASS[noteIdx % BGM_BASS.length];
  if (bass) {
    const bg = c.createGain();
    const bo = c.createOscillator();
    bo.type = 'sine';
    bo.frequency.value = bass;
    bg.gain.setValueAtTime(0.14, when);
    bg.gain.exponentialRampToValueAtTime(0.001, when + BGM_TEMPO * 3.5);
    bo.connect(bg);
    bg.connect(bgmGain);
    bo.start(when);
    bo.stop(when + BGM_TEMPO * 4);
  }
}

function scheduleBGMBatch(startNote = 0) {
  if (!bgmRunning) return;
  const c = getCtx();
  // Browsers block audio until a user gesture — until the context is actually
  // running, don't queue oscillators (they'd pile up on a frozen clock and
  // blast all at once when it unlocks). Poll until it's running instead.
  if (c.state !== 'running') {
    bgmScheduler = setTimeout(() => scheduleBGMBatch(startNote), 200);
    return;
  }
  const now = c.currentTime;
  for (let i = 0; i < 16; i++) {
    scheduleBGMNote(startNote + i, now + i * BGM_TEMPO);
  }
  bgmScheduler = setTimeout(() => scheduleBGMBatch((startNote + 16) % BGM_NOTES.length), 16 * BGM_TEMPO * 1000 - 300);
}

const AudioManager = {
  init() {
    getCtx();
    loadGameoverSound();
  },

  play(sfxName) {
    if (muted) return;
    try { SFX[sfxName]?.(); } catch {}
  },

  playBGM() {
    if (bgmRunning) return;
    bgmRunning = true;
    const c = getCtx();
    bgmGain.gain.setValueAtTime(1, c.currentTime);
    scheduleBGMBatch(0);
  },

  stopBGM() {
    bgmRunning = false;
    clearTimeout(bgmScheduler);
    // Silence already-scheduled notes (the batch scheduler queues 16 at a time)
    // so the BGM tail doesn't bleed into the game-over jingle.
    if (bgmGain) bgmGain.gain.setValueAtTime(0, getCtx().currentTime);
  },

  stopGameover() {
    if (gameoverSource) {
      try { gameoverSource.stop(); } catch (e) { /* already stopped */ }
      gameoverSource = null;
    }
  },

  toggleMute() {
    muted = !muted;
    if (masterGain) masterGain.gain.value = muted ? 0 : 0.4;
    return muted;
  },

  isMuted() { return muted; },
};

export default AudioManager;
