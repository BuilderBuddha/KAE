/** Reset scroll position when switching workspaces or remounting a section. */
export function resetWorkspaceScroll(root?: HTMLElement | null): void {
  if (root instanceof HTMLElement) {
    root.scrollTop = 0;
    root.scrollLeft = 0;
  }

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const selectors = '.kayd-chat-panel__display, .workspace, .workspace__body, .vigsy-unified';
  document.querySelectorAll(selectors).forEach((el) => {
    if (el instanceof HTMLElement) {
      el.scrollTop = 0;
    }
  });
}
