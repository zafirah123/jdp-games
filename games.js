// status values:
//   'pending'          — default starting state
//   'approved-dev'     — promoted to "Approved — For Development" list
//   'approved-design'  — promoted to "Approved — For Design" list
// Developers request a move to either approved list once their game has
// progressed far enough; see CLAUDE.md §7 for the publishing flow.
//
// `author` is the GitHub username of the game's original developer.
// Required for every new game.
//
// Optional flags for games in `approved-dev`:
// - `staging`: true if available in staging environment
// - `production`: true if available in production environment
window.GAMES = [
  { name: '2048', path: './2048/', status: 'approved-dev', author: 'akmalakhpah', staging: true, production: true },
  { name: 'Bubble Shooter', path: './bubble-shooter/', status: 'approved-dev', author: 'Koplo3' },
  { name: 'Flying Ruby', path: './flying-ruby/', status: 'approved-dev', author: 'pandaipixel', staging: true, production: true },
  { name: 'Gem Merge', path: './gem-merge/', status: 'approved-dev', author: 'akmalakhpah', staging: true, production: true },
  { name: 'Kataku', path: './kataku/', status: 'approved-dev', author: 'akmalakhpah', staging: true, production: true },
  { name: 'Liquid Sort', path: './liquid-sort/liquid-sort.html', status: 'pending', author: 'zafirah123' },
  { name: 'Number Snap', path: './number-snap/', status: 'approved-dev', author: 'akmalakhpah', staging: true, production: true },
  { name: 'Puzzle', path: './puzzle/puzzle.html', status: 'pending', author: 'iklil' },
  { name: 'Ruby Breaker', path: './ruby-breaker-v2/', status: 'pending', author: 'pandaipixel' },
  { name: 'Ruby Rhythm', path: './ruby-rhythm/', status: 'pending', author: 'Koplo3' },
  { name: 'Ruby Rush', path: './ruby-rush/', status: 'approved-dev', author: 'pandaipixel' },
  { name: 'Susun', path: './susun/', status: 'approved-dev', author: 'akmalakhpah', staging: true, production: true },
  { name: 'Tap Tap Match', path: './tap-tap-match/', status: 'approved-dev', author: 'akmalakhpah', staging: true, production: true },
  { name: 'Tetra Blocks', path: './tetra-blocks/tetra-blocks.html', status: 'pending', author: 'zafirah123' },
  { name: 'Tic Tac Toe', path: './tic-tac-toe/tic-tack-toe.html', status: 'pending', author: 'iklil' },
  { name: 'Wordscapes', path: './wordscapes/', status: 'pending', author: 'Koplo3' },
];
