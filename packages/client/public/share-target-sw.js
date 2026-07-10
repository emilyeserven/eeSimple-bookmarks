/*
 * Share-target service-worker handler.
 *
 * Imported into the Workbox-generated service worker via `workbox.importScripts` (see
 * vite.config.ts). It claims the Android share-sheet POST so a shared link is saved — either queued
 * to the Inbox or added directly as a bookmark — and confirmed with a notification, so the app UI
 * never has to open.
 *
 * The "Shared links skip the Inbox" automation setting decides the default: when on, the share is
 * added directly as a bookmark (`/api/bookmarks/quick-add`); when off (default), it's queued to the
 * Inbox (`/api/bookmarks/inbox`) and the confirmation page offers a one-tap "Add as bookmark now"
 * button that promotes the just-queued item via the normal approve flow.
 *
 * The PWA manifest registers `/quick-add` (POST, multipart/form-data) as the share target. This
 * listener intercepts only that POST; the bookmarklet's GET `/quick-add?url=…` falls through to the
 * normal SPA navigation and the React route. Registered first (importScripts runs before Workbox
 * wires its own routing), so it wins the event for the share POST and ignores everything else.
 *
 * The URL/title normalization mirrors `src/lib/shareTarget.ts` (`parseSharedInput`); keep the two in
 * sync. It is duplicated here because this file runs in the SW scope and can't import app modules.
 */
/* global clients */

const SHARE_PATH = "/quick-add";
const INBOX_API = "/api/bookmarks/inbox";
const QUICK_ADD_API = "/api/bookmarks/quick-add";
const AUTOMATION_API = "/api/app-settings/automation";
const INBOX_PATH = "/inbox";
const NOTIFICATION_ICON = "/pwa-192x192.png";

const URL_RE = /https?:\/\/[^\s]+/i;

/** Trim a value and drop it if blank — mirrors `clean()` in shareTarget.ts. */
function clean(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Collapse the shared {url,title,text} into {url,title} — mirrors `parseSharedInput`. */
function parseShare(input) {
  const explicitUrl = clean(input.url);
  const title = clean(input.title);
  const text = clean(input.text);

  const fromText = text ? (URL_RE.exec(text) || [])[0] : undefined;
  const url = explicitUrl || fromText;

  if (title) return {
    url,
    title,
  };
  const leftover = text && fromText ? clean(text.replace(fromText, "")) : text;
  return {
    url,
    title: leftover,
  };
}

/** Read the multipart share payload from the request form data. */
async function readSharedInput(request) {
  const form = await request.formData();
  const get = (key) => {
    const v = form.get(key);
    return typeof v === "string" ? v : undefined;
  };
  return parseShare({
    url: get("url"),
    title: get("title"),
    text: get("text"),
  });
}

/** Read the "shared links skip the Inbox" setting; default false on any error. */
async function shareBypassInbox() {
  try {
    const res = await fetch(AUTOMATION_API);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data && data.shareBypassInbox);
  }
  catch {
    return false;
  }
}

/** POST the link to the Inbox API. Returns the outcome + the created item id (for promotion). */
async function saveToInbox(url, title) {
  try {
    const res = await fetch(INBOX_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title: title || url,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        outcome: "saved",
        itemId: data && data.id,
      };
    }
    if (res.status === 409) return {
      outcome: "duplicate",
    };
    return {
      outcome: "error",
    };
  }
  catch {
    return {
      outcome: "error",
    };
  }
}

/** POST the link to the direct-add API (bypass the Inbox). Returns the outcome + new bookmark id. */
async function addAsBookmark(url, title) {
  try {
    const res = await fetch(QUICK_ADD_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title: title || url,
      }),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        outcome: "added",
        bookmarkId: data && data.id,
      };
    }
    if (res.status === 409) return {
      outcome: "duplicate",
    };
    return {
      outcome: "error",
    };
  }
  catch {
    return {
      outcome: "error",
    };
  }
}

const OUTCOME_TEXT = {
  "saved": {
    title: "Saved to Inbox",
    body: "Review it whenever you like.",
  },
  "added": {
    title: "Added as bookmark",
    body: "Open it to edit.",
  },
  "duplicate": {
    title: "Already saved",
    body: "This link is already saved.",
  },
  "error": {
    title: "Couldn’t save",
    body: "Open the app to try again.",
  },
  "no-url": {
    title: "No link found",
    body: "The share didn’t include a URL.",
  },
};

/** Fire a notification for the outcome, if the user has granted permission. No-op otherwise. */
async function notify(outcome, url, path) {
  if (!self.registration || typeof self.Notification === "undefined") return;
  if (self.Notification.permission !== "granted") return;
  const {
    title, body,
  } = OUTCOME_TEXT[outcome];
  await self.registration.showNotification(title, {
    body: url ? `${body}\n${url}` : body,
    icon: NOTIFICATION_ICON,
    badge: NOTIFICATION_ICON,
    tag: "eesimple-share",
    data: {
      path: path || INBOX_PATH,
    },
  });
}

/**
 * Minimal confirmation page returned to the launched share window. When notifications are granted
 * this is barely seen (it tries to close itself); when they aren't, it's the only feedback, so it
 * stays readable. For an Inbox save it offers a one-tap "Add as bookmark now" button that promotes
 * the queued item via the approve endpoint; for a direct add it links to the new bookmark.
 */
function confirmationResponse(outcome, ctx) {
  const {
    title, body,
  } = OUTCOME_TEXT[outcome];
  const itemId = ctx && ctx.itemId;
  const bookmarkId = ctx && ctx.bookmarkId;
  const linkHref = bookmarkId ? `/bookmarks/${bookmarkId}` : INBOX_PATH;
  const linkText = bookmarkId ? "Open bookmark" : "Open Inbox";
  // Only the Inbox save gets an interactive promote button; keep the window open for it so the tap
  // is possible. Everything else self-closes as before.
  const showPromote = outcome === "saved" && Boolean(itemId);
  const promoteButton = showPromote
    ? "<button id=\"promote\">Add as bookmark now</button>"
    : "";
  const promoteScript = showPromote
    ? `<script>
    (function () {
      var itemId = ${JSON.stringify(itemId)};
      var btn = document.getElementById("promote");
      btn.addEventListener("click", function () {
        btn.disabled = true; btn.textContent = "Adding…";
        fetch("/api/imports/items/" + encodeURIComponent(itemId) + "/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}"
        }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
          .then(function (data) {
            document.getElementById("t").textContent = "Added as bookmark";
            document.getElementById("m").textContent = "Open it to edit.";
            var id = data && data.bookmarkId;
            var link = document.getElementById("link");
            if (id) { link.textContent = "Open bookmark"; link.setAttribute("href", "/bookmarks/" + id); }
            btn.remove();
          })
          .catch(function () { btn.disabled = false; btn.textContent = "Add as bookmark now"; });
      });
    })();
  </script>`
    : `<script>
    // If the OS opened this as a closable window, dismiss it; harmless otherwise.
    setTimeout(function () { try { window.close(); } catch (e) {} }, 1500);
  </script>`;
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; gap:.75rem;
    align-items:center; justify-content:center; font:16px/1.4 system-ui, sans-serif;
    background:#0f172a; color:#f8fafc; padding:1.5rem; text-align:center; }
  p { margin:0; }
  .muted { color:#94a3b8; font-size:.875rem; }
  a { color:#f8fafc; }
  button { font:inherit; padding:.5rem 1rem; border-radius:.5rem; border:1px solid #f8fafc;
    background:transparent; color:#f8fafc; cursor:pointer; }
  button:disabled { opacity:.6; cursor:default; }
</style></head><body>
  <p id="t" style="font-weight:600">${title}</p>
  <p id="m" class="muted">${body}</p>
  ${promoteButton}
  <a id="link" href="${linkHref}">${linkText}</a>
  ${promoteScript}
</body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/** Save the shared link (Inbox or direct, per the setting), notify, and return the confirmation. */
async function handleShare(request) {
  const {
    url, title,
  } = await readSharedInput(request);
  if (!url) {
    await notify("no-url");
    return confirmationResponse("no-url");
  }
  const bypass = await shareBypassInbox();
  const result = bypass ? await addAsBookmark(url, title) : await saveToInbox(url, title);
  const notifyPath = result.bookmarkId ? `/bookmarks/${result.bookmarkId}` : INBOX_PATH;
  await notify(result.outcome, url, notifyPath);
  return confirmationResponse(result.outcome, result);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "POST") return;
  const url = new URL(request.url);
  if (url.pathname !== SHARE_PATH) return;
  event.respondWith(handleShare(request));
});

// Tapping the notification focuses an open app window (or opens the target path).
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.path) || INBOX_PATH;
  event.waitUntil((async () => {
    const all = await clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });
    for (const client of all) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(path);
        return;
      }
    }
    if (clients.openWindow) await clients.openWindow(path);
  })());
});
