import type { ExtensionFillContext } from "@eesimple/types";

import { session } from "./session";

/*
 * Thin fetch helpers against the configured eeSimple server. Paths start with `/api/…`.
 */

function url(path: string): string {
  return `${session.serverUrl}${path}`;
}

/** Send a JSON body with `method`. */
export function sendJson(method: "POST" | "PATCH" | "PUT", path: string, body: unknown): Promise<Response> {
  return fetch(url(path), {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export function apiGet(path: string): Promise<Response> {
  return fetch(url(path));
}

export function apiDelete(path: string): Promise<Response> {
  return fetch(url(path), {
    method: "DELETE",
  });
}

/** POST a multipart form (an image upload). */
export function postForm(path: string, form: FormData): Promise<Response> {
  return fetch(url(path), {
    method: "POST",
    body: form,
  });
}

/** Parse a JSON body, `{}` when it isn't JSON. */
export async function jsonOrEmpty<T extends object>(res: Response): Promise<Partial<T>> {
  try {
    const body: unknown = await res.json();
    return body && typeof body === "object" ? body as Partial<T> : {};
  }
  catch {
    return {};
  }
}

/** `GET /api/extension/fill-context` for a page URL; throws on a network or HTTP failure. */
export async function fetchFillContext(pageUrl: string): Promise<ExtensionFillContext> {
  const res = await apiGet(`/api/extension/fill-context?url=${encodeURIComponent(pageUrl)}`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  return await res.json() as ExtensionFillContext;
}
