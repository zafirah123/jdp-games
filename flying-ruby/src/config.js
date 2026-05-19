// Design tokens and gameplay constants for Flying Ruby.
// Color palette is sourced from the Pandai Design System 1.5 (Figma):
// https://www.figma.com/design/Y0DLhf2MGdGwG0jyjN7EbQ/Pandai-Design-System-1.5--WIP---BACKUP-?node-id=1390-161

export const PALETTE = {
  navy:       0x020d26,
  royalBlue:  0x1535a8,
  darkRed:    0xa21520,
  ruby:       0xb81c26,
  yellow:     0xfdd83d,
  orange:     0xffb800,
  white:      0xffffff,
};

export const PALETTE_CSS = {
  navy:       '#020d26',
  royalBlue:  '#1535a8',
  darkRed:    '#a21520',
  ruby:       '#b81c26',
  yellow:     '#fdd83d',
  orange:     '#ffb800',
  white:      '#ffffff',
};

export const GAME = {
  width:  480,
  height: 854,

  // 3 minute round timer
  roundDurationMs: 3 * 60 * 1000,

  // gameplay tuning (used later by GameScene)
  gravity:          1200,
  flapVelocity:     -380,
  pipeSpeed:        180,
  pipeSpawnEveryMs: 1500,
  rubySpawnEveryMs: 2200,
  rubyValue:        1,
};

export const FONTS = {
  // System font stack — works without bundling a font file
  ui:    '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
};
