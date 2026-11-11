import { els } from "./dom";

/* The success screens' auto-close countdown (the #progressBar animation). */

const AUTO_CLOSE_MS = 5000; // keep in sync with the #progressBar animation duration in style.css
let closeTimer: ReturnType<typeof setTimeout> | null = null;

export function startCountdown(): void {
  els.progress.classList.remove("hidden");
  // Restart the CSS animation cleanly (force a reflow before re-adding the class).
  els.progressBar.classList.remove("run");
  void els.progressBar.offsetWidth;
  els.progressBar.classList.add("run");
  closeTimer = setTimeout(() => window.close(), AUTO_CLOSE_MS);
}

export function cancelCountdown(): void {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  els.progressBar.classList.remove("run");
  els.progress.classList.add("hidden");
}
