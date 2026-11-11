import { jsonOrEmpty, sendJson } from "./api";
import { els } from "./dom";
import { afterBookmarkCreated, postToInbox, renderInboxSaved } from "./router";
import { onSuccess } from "./screens";
import { session } from "./session";

/*
 * The manual add form (the fallback when the fill-context can't be fetched or the tab has no URL):
 * "Add to Inbox" queues the URL for review; "Add as Bookmark" skips the Inbox (autofill + defaults +
 * image capture applied server-side, same as approving an Inbox item).
 */

function resetAdd(): void {
  els.addBtn.disabled = false;
  els.addBtn.textContent = "Add to Inbox";
  els.addBookmarkBtn.disabled = false;
  els.addBookmarkBtn.textContent = "Add as Bookmark";
}

function addError(message: string): void {
  resetAdd();
  els.formError.textContent = message;
}

/** The URL to add, or null (with an inline error) when blank. */
function readUrl(): string | null {
  const url = els.bmUrl.value.trim();
  els.formError.textContent = "";
  if (!url) els.formError.textContent = "Please enter a URL.";
  return url || null;
}

function setBusy(active: HTMLButtonElement): void {
  els.addBtn.disabled = true;
  els.addBookmarkBtn.disabled = true;
  active.textContent = "Adding…";
}

async function handleAddResponse(res: Response, onCreated: (id: string | undefined) => Promise<void> | void): Promise<void> {
  if (res.status === 201) {
    const data = await jsonOrEmpty<{ id: string }>(res);
    await onCreated(data.id);
  }
  else if (res.status === 409) {
    onSuccess("Already saved.", true);
  }
  else if (res.status === 400) {
    addError("That doesn't look like a valid URL.");
  }
  else {
    addError(`Error saving (${res.status}).`);
  }
}

async function submitToInbox(): Promise<void> {
  const url = readUrl();
  if (!url) return;
  setBusy(els.addBtn);
  try {
    const res = await postToInbox(url);
    await handleAddResponse(res, id => renderInboxSaved(id, url, "Queued in Inbox."));
  }
  catch {
    addError("Could not reach the eeSimple server.");
  }
}

async function submitBookmark(): Promise<void> {
  const url = readUrl();
  if (!url) return;
  setBusy(els.addBookmarkBtn);
  try {
    const res = await sendJson("POST", "/api/bookmarks/quick-add", {
      url,
      title: session.pageTitle || url,
    });
    // Flow into fill mode when the site has rules — same as Move to Bookmarks.
    await handleAddResponse(res, id => afterBookmarkCreated(id, url));
  }
  catch {
    addError("Could not reach the eeSimple server.");
  }
}

export function wireAddForm(): void {
  els.addBtn.addEventListener("click", () => void submitToInbox());
  els.addBookmarkBtn.addEventListener("click", () => void submitBookmark());
  els.bmUrl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") void submitToInbox();
  });
}
