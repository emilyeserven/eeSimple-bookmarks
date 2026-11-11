/* Value formatting / coercion for review rows. */

export function formatScalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Yes" : "No";
}

export function coerceBoolean(text: string): boolean | null {
  const t = text.trim().toLowerCase();
  if (/^(?:true|yes|y|1|on)$/.test(t)) return true;
  if (/^(?:false|no|n|0|off)$/.test(t)) return false;
  return null;
}

/** A finite number from extracted text, or null. */
export function toFiniteNumber(text: string): number | null {
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

/** A stable id for a new section entry / rule. */
export function randomId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** "1 item" / "2 items". */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
