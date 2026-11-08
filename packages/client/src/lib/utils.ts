import type { ClassValue } from "clsx";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A unique id string, safe on insecure origins.
 *
 * `crypto.randomUUID()` is only defined in secure contexts (HTTPS or `localhost`), so on a plain
 * HTTP origin (e.g. a self-hosted box reached by hostname) it is `undefined` and throws. Prefer it
 * when available, otherwise build a UUID from `crypto.getRandomValues` (available on insecure
 * origins too), and fall back to a timestamp + random string when no `crypto` exists at all.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto.getRandomValues === "function") {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
