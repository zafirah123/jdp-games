// status values:
//   'pending'          — default starting state
//   'approved-dev'     — promoted to "Approved — For Development" list
//   'approved-design'  — promoted to "Approved — For Design" list
// Developers request a move to either approved list once their game has
// progressed far enough; see CLAUDE.md §7 for the publishing flow.
window.GAMES = [
  { name: 'Bubble Shooter', path: './bubble-shooter/', status: 'pending' },
  { name: 'Flying Ruby', path: './flying-ruby/', status: 'approved-design' },
  { name: 'Liquid Sort', path: './liquid-sort/liquid-sort.html', status: 'pending' },
  { name: 'Puzzle', path: './puzzle/puzzle.html', status: 'pending' },
  { name: 'Ruby Breaker', path: './ruby-breaker-v2/', status: 'pending' },
  { name: 'Ruby Rhythm', path: './ruby-rhythm/', status: 'pending' },
  { name: 'Tetra Blocks', path: './tetra-blocks/tetra-blocks.html', status: 'pending' },
  { name: 'Tic Tac Toe', path: './tic-tac-toe/tic-tack-toe.html', status: 'pending' },
  { name: 'Wordscapes', path: './wordscapes/', status: 'pending' },
];
