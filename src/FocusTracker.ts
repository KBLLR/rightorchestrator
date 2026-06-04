let lastActiveElement: HTMLElement | null = null;

export function getLastActiveElement(): HTMLElement | null {
  return lastActiveElement;
}

export function setLastActiveElement(el: HTMLElement | null): void {
  lastActiveElement = el;
}

export function setupFocusTracker(ignoredIds: string[] = []): void {
  const track = (el: any) => {
    if (!el) return;
    const isEditable = el.tagName === "INPUT" ||
                       el.tagName === "TEXTAREA" ||
                       el.contentEditable === "true" ||
                       el.getAttribute?.("contenteditable") === "true" ||
                       el.getAttribute?.("contenteditable") === "plaintext-only";
    if (isEditable) {
      if (ignoredIds.includes(el.id)) return;
      lastActiveElement = el;
    }
  };

  document.addEventListener("focusin", (e: FocusEvent) => {
    const target = e.composedPath()[0] || e.target;
    track(target);
  });
  
  document.addEventListener("click", (e: MouseEvent) => {
    const target = e.composedPath()[0] || e.target;
    track(target);
  });
}
