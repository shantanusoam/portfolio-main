# Input safety

- never launch from ordinary page scroll
- never launch while clicking navigation
- use an explicit gate or control (a visible "Drop to play" /
  "Play Strumrise" button satisfies this; a secret gesture alone does not)
- release pointer capture correctly
- prevent page scroll only inside active game interaction, not globally
- restore page input on exit
- handle Escape
- handle lost focus (window blur mid-game should pause, not desync)
