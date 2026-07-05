import React from "react";

const QUERY = '(prefers-reduced-motion: no-preference)';

/**
 * Always starts `true` (assume reduced motion) on both the server AND the
 * client's very first render, then corrects to the real preference inside
 * an effect once mounted.
 *
 * The previous version resolved `!window.matchMedia(QUERY).matches`
 * synchronously as the initial state whenever `window` existed — which
 * meant the client's first render (before hydration finishes reconciling)
 * already reflected the real, often-different-from-the-server preference.
 * Any consumer that used this value to affect rendered output (a style,
 * a class, whether an element mounts at all) would then disagree with the
 * server-rendered HTML and fail hydration for the surrounding subtree —
 * in a couple of cases here, for the whole page, since React discards and
 * client-re-renders the entire root once hydration fails anywhere in it.
 * Deferring the real check to an effect (which only ever runs after mount,
 * i.e. after hydration has already succeeded) removes that class of bug
 * for every consumer of this hook, not just the ones already fixed to
 * work around it individually.
 */
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(true);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);
    setPrefersReducedMotion(!mediaQueryList.matches);

    const listener = (event) => {
      setPrefersReducedMotion(!event.matches);
    };
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      mediaQueryList.addListener(listener);
    }
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, []);

  return prefersReducedMotion;
}
export default usePrefersReducedMotion;
