# Reachability

Generate candidates from the player's vertical and horizontal movement
envelope (max fall speed, bounce velocity, horizontal acceleration/drag,
limited air control).

Verify before accepting a candidate:

- vertical intercept time
- horizontal reachable interval at that time
- platform width
- camera-safe location (not immediately off the top of a shrinking safe
  zone)
- mobile viewport width
- no blocked route (a candidate that would require passing through an
  already-placed platform)
- a recovery/generous platform follows a difficult sequence

Reject candidates that fail any check and regenerate deterministically
from the seed (do not fall back to unrestricted random coordinates).
