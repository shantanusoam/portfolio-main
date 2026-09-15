export const HOME_OCTOCAT_EVENT = "portfolio:home-octocat";

export function announceHomeOctocat(active: boolean) {
  document.documentElement.toggleAttribute("data-octocat-playing", active);
  window.dispatchEvent(
    new CustomEvent(HOME_OCTOCAT_EVENT, { detail: { active } }),
  );
}
