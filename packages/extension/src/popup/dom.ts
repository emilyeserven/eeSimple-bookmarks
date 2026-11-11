/*
 * Typed handles on popup.html's elements. Every id is asserted to exist at load, so a renamed id in
 * the HTML fails loudly on open rather than as a null deref deep in a handler.
 */

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`popup.html is missing #${id}`);
  return el as T;
}

const input = (id: string) => byId<HTMLInputElement>(id);
const button = (id: string) => byId<HTMLButtonElement>(id);
const textarea = (id: string) => byId<HTMLTextAreaElement>(id);
const select = (id: string) => byId<HTMLSelectElement>(id);

export const els = {
  // Setup (first run, or host access missing)
  setup: byId("setup"),
  setupNote: byId("setupNote"),
  serverUrl: input("serverUrl"),
  saveBtn: button("saveBtn"),
  status: byId("status"),
  // Manual add form
  form: byId("form"),
  bmUrl: input("bmUrl"),
  addBtn: button("addBtn"),
  addBookmarkBtn: button("addBookmarkBtn"),
  formError: byId("formError"),
  // Success
  success: byId("success"),
  successMsg: byId("successMsg"),
  viewInboxBtn: button("viewInboxBtn"),
  captureSuccessBtn: button("captureSuccessBtn"),
  captureSuccessStatus: byId("captureSuccessStatus"),
  deleteSuccessBtn: button("deleteSuccessBtn"),
  deleteSuccessStatus: byId("deleteSuccessStatus"),
  // Inbox auto-saved
  inboxSaved: byId("inboxSaved"),
  inboxSavedMsg: byId("inboxSavedMsg"),
  moveToBookmarksBtn: button("moveToBookmarksBtn"),
  inboxSavedViewBtn: button("inboxSavedViewBtn"),
  findSelectorInboxBtn: button("findSelectorInboxBtn"),
  findSelectorInboxStatus: byId("findSelectorInboxStatus"),
  inboxUndoBtn: button("inboxUndoBtn"),
  inboxSavedError: byId("inboxSavedError"),
  // Already saved
  savedState: byId("savedState"),
  savedDescription: textarea("savedDescription"),
  saveDescriptionBtn: button("saveDescriptionBtn"),
  saveDescriptionStatus: byId("saveDescriptionStatus"),
  savedOpenBtn: button("savedOpenBtn"),
  findSelectorSavedBtn: button("findSelectorSavedBtn"),
  findSelectorSavedStatus: byId("findSelectorSavedStatus"),
  captureSavedBtn: button("captureSavedBtn"),
  captureSavedStatus: byId("captureSavedStatus"),
  deleteSavedBtn: button("deleteSavedBtn"),
  deleteSavedStatus: byId("deleteSavedStatus"),
  // Fill: reading the page
  fillFilling: byId("fillFilling"),
  fillFillingTitle: byId("fillFillingTitle"),
  // Fill: review
  fillReview: byId("fillReview"),
  fillReviewTitle: byId("fillReviewTitle"),
  fillError: byId("fillError"),
  fillRows: byId("fillRows"),
  fillApplyBtn: button("fillApplyBtn"),
  fillReviewOpenBtn: button("fillReviewOpenBtn"),
  reviewDescription: textarea("reviewDescription"),
  saveReviewDescriptionBtn: button("saveReviewDescriptionBtn"),
  saveReviewDescriptionStatus: byId("saveReviewDescriptionStatus"),
  findSelectorReviewBtn: button("findSelectorReviewBtn"),
  findSelectorReviewStatus: byId("findSelectorReviewStatus"),
  captureReviewBtn: button("captureReviewBtn"),
  captureReviewStatus: byId("captureReviewStatus"),
  // Fill: applied
  fillApplied: byId("fillApplied"),
  fillAppliedMsg: byId("fillAppliedMsg"),
  fillAppliedOpenBtn: button("fillAppliedOpenBtn"),
  appliedDescription: textarea("appliedDescription"),
  saveAppliedDescriptionBtn: button("saveAppliedDescriptionBtn"),
  saveAppliedDescriptionStatus: byId("saveAppliedDescriptionStatus"),
  captureAppliedBtn: button("captureAppliedBtn"),
  captureAppliedStatus: byId("captureAppliedStatus"),
  deleteAppliedBtn: button("deleteAppliedBtn"),
  deleteAppliedStatus: byId("deleteAppliedStatus"),
  // Selector prefill (finishing a "Find a selector" pick)
  selectorPrefill: byId("selectorPrefill"),
  prefillSummary: byId("prefillSummary"),
  prefillLabel: input("prefillLabel"),
  prefillTarget: select("prefillTarget"),
  prefillEntryType: select("prefillEntryType"),
  prefillCreateBtn: button("prefillCreateBtn"),
  prefillDiscardBtn: button("prefillDiscardBtn"),
  prefillError: byId("prefillError"),
  // Auto-close countdown bar
  progress: byId("progress"),
  progressBar: byId("progressBar"),
};

const SCREENS = {
  setup: els.setup,
  form: els.form,
  success: els.success,
  inboxSaved: els.inboxSaved,
  saved: els.savedState,
  filling: els.fillFilling,
  review: els.fillReview,
  applied: els.fillApplied,
  selectorPrefill: els.selectorPrefill,
};

export type Screen = keyof typeof SCREENS;

/** Show one screen, hide the rest. */
export function show(screen: Screen): void {
  for (const [key, el] of Object.entries(SCREENS)) el.classList.toggle("hidden", key !== screen);
}
