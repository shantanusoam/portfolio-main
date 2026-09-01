export const SOUNDROOM_OPEN_EVENT = "portfolio:soundroom-open";

export type SoundroomOpenView = "mini" | "room" | "local" | "queue" | "tune";

export interface SoundroomOpenDetail {
  view?: SoundroomOpenView;
}

export function openSoundroom(view: SoundroomOpenView = "room"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SoundroomOpenDetail>(SOUNDROOM_OPEN_EVENT, {
      detail: { view },
    }),
  );
}

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='textbox']",
    ),
  );
}
