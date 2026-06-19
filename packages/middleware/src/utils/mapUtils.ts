/**
 * Group a flat list of rows into a `Map<string, string[]>` by extracting a key and a value from
 * each row. Useful for collapsing join-table query results into entity → values maps.
 */
export function buildStringMap<T>(
  rows: T[],
  getKey: (row: T) => string,
  getValue: (row: T) => string,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const key = getKey(row);
    const existing = map.get(key) ?? [];
    existing.push(getValue(row));
    map.set(key, existing);
  }
  return map;
}
