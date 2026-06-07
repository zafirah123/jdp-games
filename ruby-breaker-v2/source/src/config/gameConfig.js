export const GAME_W = 480;
export const GAME_H = 800;

export const BRICK_COLS   = 7;
export const BRICK_W      = 56;
export const BRICK_H      = 20;
export const BRICK_PAD    = 6;
export const BRICK_TOP    = 100;

// Derived: total row width = 7*56 + 6*6 = 392+36 = 428  → left margin = (480-428)/2 = 26
export const BRICK_LEFT   = Math.floor((GAME_W - (BRICK_COLS * BRICK_W + (BRICK_COLS - 1) * BRICK_PAD)) / 2);

export const PADDLE_W     = 110;
export const PADDLE_H     = 16;
export const PADDLE_Y_OFF = 70; // px above bottom

export const BALL_RADIUS  = 10;
export const BALL_BASE_SPEED = 510;       // +50%
export const BALL_MAX_SPEED  = 960;       // +50%
export const BALL_SPEED_LEVEL_INC = 38;   // +50% per level

export const LIVES        = 3;
export const POWERUP_CHANCE = 0.28; // 28% per broken brick
export const POWERUP_SPEED  = 180;
export const POWERUP_DURATION = 12000; // ms

// ─── JDP / Juara Digital Pandai brand palette ─────────────────────
export const P = {
  NAVY:    0x0d1b2e,
  BLUE:    0x1e3aad,
  BLUE_LT: 0x2a52d4,
  CRIMSON: 0x9a1224,
  D_RED:   0x8a0e1e,
  MAROON:  0x6e0e18,
  B_RED:   0xcc1222,
  GOLD:    0xffc72c,
  AMBER:   0xf5a000,
  WHITE:   0xffffff,
};

export const BRICK_COLORS = [
  { fill: P.BLUE,    shade: P.NAVY,    crack: 0x091244 }, // 1-hit – royal blue
  { fill: P.B_RED,   shade: P.CRIMSON, crack: P.MAROON  }, // 2-hit – bright red
  { fill: P.CRIMSON, shade: P.D_RED,   crack: P.MAROON  }, // 3-hit – crimson
  { fill: P.AMBER,   shade: 0xc47800,  crack: 0x8a5200  }, // 4-hit – amber
  { fill: P.GOLD,    shade: P.AMBER,   crack: 0x9a6800  }, // 5-hit – gold
];

export const POWERUP_TYPES = [
  'wide',
  'narrow',
  'multi',
  'slow',
  'fast',
  'life',
  'laser',
  'sticky',
  'fireball',
  'shield',
];

export const POWERUP_META = {
  wide:     { color: P.BLUE,    label: 'W',  timed: true,  name: 'WIDE PADDLE'  },
  narrow:   { color: P.NAVY,    label: 'N',  timed: true,  name: 'SLIM PADDLE'  },
  multi:    { color: P.GOLD,    label: '3',  timed: false, name: 'MULTI BALL'   },
  slow:     { color: P.BLUE_LT, label: 'S',  timed: true,  name: 'SLOW MOTION'  },
  fast:     { color: P.B_RED,   label: 'F',  timed: true,  name: 'SPEED RUSH'   },
  life:     { color: P.D_RED,   label: '♥',  timed: false, name: 'EXTRA LIFE'   },
  laser:    { color: P.AMBER,   label: 'L',  timed: true,  name: 'LASER MODE'   },
  sticky:   { color: P.BLUE,    label: 'M',  timed: true,  name: 'MAGNET BALL'  },
  fireball: { color: P.CRIMSON, label: '🔥', timed: true,  name: 'FIREBALL'     },
  shield:   { color: P.GOLD,    label: 'SH', timed: true,  name: 'SHIELD'       },
};
