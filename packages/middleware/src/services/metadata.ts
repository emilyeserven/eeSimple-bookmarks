/**
 * Server-side metadata fetching. The browser can't read arbitrary cross-origin
 * pages (CORS), so the title lookup for a bookmark URL has to happen here.
 */

const FETCH_TIMEOUT_MS = 5000;
/** Cap the body we read so a huge response can't exhaust memory. */
const MAX_BYTES = 512 * 1024;

export type FetchTitleResult
  = | { kind: "ok";
    title: string; }
    | { kind: "timeout" }
    | { kind: "http_error";
      status: number; }
      | { kind: "no_body" }
      | { kind: "no_title" }
      | { kind: "network_error" };

const NAMED_ENTITIES: Record<string, string> = {
  "amp": "&",
  "lt": "<",
  "gt": ">",
  "quot": "\"",
  "apos": "'",
  "#39": "'",
};

/** Decode the small set of HTML entities that commonly appear inside <title>. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const lower = entity.toLowerCase();
    if (lower.startsWith("#x")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (lower.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[lower] ?? match;
  });
}

/** Pull the <title> text out of an HTML document, or null when absent. */
export function extractTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!match) return null;
  const title = decodeEntities(match[1]).replace(/\s+/g, " ").trim();
  return title.length > 0 ? title : null;
}

/**
 * Fetch `url` and return a typed result describing why the title could not be
 * obtained, or the title itself. Guarded by a timeout and a body cap.
 */
export async function fetchPageTitle(url: string): Promise<FetchTitleResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "eeSimple-bookmarks/0.1 (+title-fetch)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return {
      kind: "http_error",
      status: res.status,
    };
    if (!res.body) return {
      kind: "no_body",
    };

    // Read incrementally so we can stop once we have enough bytes for the title.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let html = "";
    let received = 0;
    for (;;) {
      const {
        done, value,
      } = await reader.read();
      if (done) break;
      received += value.byteLength;
      html += decoder.decode(value, {
        stream: true,
      });
      if (/<\/title>/i.test(html) || received >= MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const title = extractTitle(html);
    if (title === null) return {
      kind: "no_title",
    };
    return {
      kind: "ok",
      title,
    };
  }
  catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        kind: "timeout",
      };
    }
    return {
      kind: "network_error",
    };
  }
  finally {
    clearTimeout(timeout);
  }
}
