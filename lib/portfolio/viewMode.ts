export const PORTFOLIO_MODE_STORAGE_KEY = "portfolio:view-mode";
export const PORTFOLIO_MODE_EVENT = "portfolio:view-mode-change";

export type PortfolioViewMode = "explore" | "focus";

export type PortfolioModeEventDetail = {
  mode: PortfolioViewMode;
};

export function readPortfolioViewMode(): PortfolioViewMode {
  try {
    return window.localStorage.getItem(PORTFOLIO_MODE_STORAGE_KEY) === "focus"
      ? "focus"
      : "explore";
  } catch {
    return "explore";
  }
}

export function applyPortfolioViewMode(mode: PortfolioViewMode): void {
  document.documentElement.dataset.portfolioMode = mode;
  try {
    window.localStorage.setItem(PORTFOLIO_MODE_STORAGE_KEY, mode);
  } catch {
    // A privacy-restricted browser can still use the mode for this visit.
  }

  window.dispatchEvent(
    new CustomEvent<PortfolioModeEventDetail>(PORTFOLIO_MODE_EVENT, {
      detail: { mode },
    }),
  );
}
