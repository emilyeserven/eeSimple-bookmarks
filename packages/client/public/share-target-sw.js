/*
 * Share-target service-worker handler.
 *
 * Imported into the Workbox-generated service worker via `workbox.importScripts` (see
 * vite.config.ts). It claims the Android share-sheet POST so a shared link is saved to the Inbox
 * and confirmed with a notification — the app UI never has to open.
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

/** POST the link to the Inbox API. Returns the outcome the UI/notification should reflect. */
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
    if (res.ok) return "saved";
    if (res.status === 409) return "duplicate";
    return "error";
  }
  catch {
    return "error";
  }
}

const OUTCOME_TEXT = {
  "saved": {
    title: "Saved to Inbox",
    body: "Review it whenever you like.",
  },
  "duplicate": {
    title: "Already saved",
    body: "This link is already in your Inbox.",
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
async function notify(outcome, url) {
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
      path: INBOX_PATH,
    },
  });
}

/**
 * Minimal confirmation page returned to the launched share window. When notifications are granted
 * this is barely seen (it tries to close itself); when they aren't, it's the only feedback, so it
 * stays readable with a link to the Inbox.
 */
function confirmationResponse(outcome) {
  const {
    title, body,
  } = OUTCOME_TEXT[outcome];
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
</style></head><body>
  <p style="font-weight:600">${title}</p>
  <p class="muted">${body}</p>
  <a href="${INBOX_PATH}">Open Inbox</a>
  <script>
    // If the OS opened this as a closable window, dismiss it; harmless otherwise.
    setTimeout(function () { try { window.close(); } catch (e) {} }, 1500);
  </script>
</body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/** Save the shared link, notify, and return the minimal confirmation page. */
async function handleShare(request) {
  const {
    url, title,
  } = await readSharedInput(request);
  const outcome = url ? await saveToInbox(url, title) : "no-url";
  await notify(outcome, url);
  return confirmationResponse(outcome);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "POST") return;
  const url = new URL(request.url);
  if (url.pathname !== SHARE_PATH) return;
  event.respondWith(handleShare(request));
});

// Tapping the notification focuses an open app window (or opens the Inbox).
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
