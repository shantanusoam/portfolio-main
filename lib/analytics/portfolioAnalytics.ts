export const PORTFOLIO_EVENTS = {
  articleCompleted: "Article Completed",
  readingModeChanged: "Reading Mode Changed",
  fishVisibilityChanged: "Fish Visibility Changed",
  fishFollowChanged: "Fish Follow Changed",
  preySchoolReleased: "Prey School Released",
  octopodFall: "Octopod Fall",
  octopodMilestone: "Octopod Milestone",
  octopodJumpModeChanged: "Octopod Jump Mode Changed",
} as const;

export type PortfolioAnalyticsValue = string | number | boolean | null;
export type PortfolioAnalyticsData = Record<string, PortfolioAnalyticsValue>;

type PortfolioAnalyticsWindow = typeof globalThis & {
  va?: (...params: unknown[]) => void;
  vaq?: unknown[][];
};

function getAnalyticsWindow(): PortfolioAnalyticsWindow {
  return window as unknown as PortfolioAnalyticsWindow;
}

export function ensurePortfolioAnalyticsQueue(): void {
  if (typeof window === "undefined") return;
  const analyticsWindow = getAnalyticsWindow();
  if (analyticsWindow.va) return;
  analyticsWindow.va = (...params: unknown[]) => {
    analyticsWindow.vaq ??= [];
    analyticsWindow.vaq.push(params);
  };
}

/**
 * Sends deliberately low-cardinality product signals only. Callers must not
 * include names, email addresses, free-form text, precise pointer positions,
 * or stable visitor identifiers.
 */
export function trackPortfolioEvent(
  name: (typeof PORTFOLIO_EVENTS)[keyof typeof PORTFOLIO_EVENTS],
  data?: PortfolioAnalyticsData,
): void {
  if (typeof window === "undefined") return;
  ensurePortfolioAnalyticsQueue();
  getAnalyticsWindow().va?.("event", data ? { name, data } : { name });
}

export function trackPortfolioPageView(route: string): void {
  if (typeof window === "undefined") return;
  ensurePortfolioAnalyticsQueue();
  getAnalyticsWindow().va?.("pageview", { route, path: route });
}
