/** Return a new Set with `id` added if absent or removed if present — the immutable toggle idiom. */
export function toggleInSet<T>(set: ReadonlySet<T>, id: T): Set<T> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
