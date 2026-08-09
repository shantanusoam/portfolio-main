# Browser and viewport matrix

At minimum:

- desktop Chromium (or whichever browser is at hand)
- mobile Chromium emulation (devtools device toolbar)
- one WebKit/Safari run when available

Viewports:

- 1440x900
- 1024x768
- 768x1024
- 430x932
- 932x430
- 360x800

Scenarios:

- follow
- idle wander
- hard turn
- obstacle corner
- inspect card
- resize
- scroll
- hidden tab
- unmount and remount
- reduced motion

If browser automation is genuinely unavailable in the current environment,
add deterministic manual test instructions to `docs/mascot/PLAYTEST.md`
instead of inventing results — run the available unit and build checks, and
clearly mark automation as a documented gap, not a passed test.
