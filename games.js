// status values:
//   'pending'          — default starting state
//   'approved-dev'     — promoted to "Approved — For Development" list
//   'approved-design'  — promoted to "Approved — For Design" list
// Developers request a move to either approved list once their game has
// progressed far enough; see CLAUDE.md §7 for the publishing flow.
//
// `author` is the GitHub username of the game's original developer.
// Required for every new game.
window.GAMES = [
  { name: '2048', path: './2048/', status: 'pending', author: 'akmalakhpah' },
  { name: 'Bubble Shooter', path: './bubble-shooter/', status: 'pending', author: 'Koplo3' },
  { name: 'Flying Ruby', path: './flying-ruby/', status: 'approved-design', author: 'pandaipixel' },
  { name: 'Liquid Sort', path: './liquid-sort/liquid-sort.html', status: 'pending', author: 'zafirah123' },
  { name: 'Puzzle', path: './puzzle/puzzle.html', status: 'pending', author: 'iklil' },
  { name: 'Ruby Breaker', path: './ruby-breaker-v2/', status: 'pending', author: 'pandaipixel' },
  { name: 'Ruby Rhythm', path: './ruby-rhythm/', status: 'pending', author: 'Koplo3' },
  { name: 'Susun', path: './susun/', status: 'pending', author: 'akmalakhpah' },
  { name: 'Tap Tap Match', path: './tap-tap-match/', status: 'pending', author: 'akmalakhpah' },
  { name: 'Tetra Blocks', path: './tetra-blocks/tetra-blocks.html', status: 'pending', author: 'zafirah123' },
  { name: 'Tic Tac Toe', path: './tic-tac-toe/tic-tack-toe.html', status: 'pending', author: 'iklil' },
  { name: 'Wordscapes', path: './wordscapes/', status: 'pending', author: 'Koplo3' },
];
