import type { Bookmark } from "@eesimple/types";

import {
  DESCRIPTION_EDITORS,
  wireCaptureButton,
  wireDeleteButton,
  wireDescriptionEditor,
} from "./bookmarkActions";
import { cancelCountdown, startCountdown } from "./countdown";
import { els, show } from "./dom";
import { wireFindSelectorButton } from "./findSelector";
import { openBookmark, openServerPage } from "./session";

/* The simple result screens: already saved, success, and the Inbox-saved lander's static parts. */

/** "Already saved" — the page is a bookmark and the site has no fill rules for it. */
export function renderSaved(bookmark: Bookmark | undefined): void {
  els.savedOpenBtn.onclick = () => openBookmark(bookmark?.id);
  wireDescriptionEditor(DESCRIPTION_EDITORS.saved, bookmark);
  wireFindSelectorButton(els.findSelectorSavedBtn, els.findSelectorSavedStatus);
  wireCaptureButton(els.captureSavedBtn, els.captureSavedStatus, bookmark?.id);
  wireDeleteButton(els.deleteSavedBtn, els.deleteSavedStatus, bookmark?.id);
  show("saved");
}

export function openInbox(): void {
  cancelCountdown();
  openServerPage("/inbox");
}

/** Success after an Inbox-only save (no bookmark to screenshot or delete). */
export function onSuccess(message: string, hideViewInbox = false): void {
  els.successMsg.textContent = message;
  els.viewInboxBtn.classList.toggle("hidden", hideViewInbox);
  els.viewInboxBtn.textContent = "View Inbox";
  els.viewInboxBtn.onclick = openInbox;
  wireCaptureButton(els.captureSuccessBtn, els.captureSuccessStatus, null);
  wireDeleteButton(els.deleteSuccessBtn, els.deleteSuccessStatus, null);
  show("success");
  startCountdown();
}

/** Success after a bookmark was created: the action button opens the new bookmark. */
export function onBookmarkSuccess(message: string, bookmarkId: string | undefined): void {
  els.successMsg.textContent = message;
  els.viewInboxBtn.classList.remove("hidden");
  els.viewInboxBtn.textContent = "Open Bookmark";
  els.viewInboxBtn.onclick = () => {
    cancelCountdown();
    openBookmark(bookmarkId);
  };
  wireCaptureButton(els.captureSuccessBtn, els.captureSuccessStatus, bookmarkId);
  wireDeleteButton(els.deleteSuccessBtn, els.deleteSuccessStatus, bookmarkId);
  show("success");
  startCountdown();
}
