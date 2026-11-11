import type { ApplyState, ValueEntry, ValuePatchKey } from "./rowTypes";
import type { Bookmark } from "@eesimple/types";

/**
 * Seed a per-property value map from the bookmark's existing entries (once per Apply) so writing one
 * property's value doesn't wipe its siblings — the PATCH replaces the whole array.
 */
export function seedValueMap<K extends ValuePatchKey>(state: ApplyState, key: K, bookmark: Bookmark): Map<string, ValueEntry<K>> {
  const values = state.values as Partial<Record<K, Map<string, ValueEntry<K>>>>;
  let map = values[key];
  if (!map) {
    map = new Map();
    for (const entry of bookmark[key] as ValueEntry<K>[]) {
      map.set(entry.propertyId, {
        ...entry,
      });
    }
    values[key] = map;
  }
  return map;
}

/** The bookmark's stored entry for one property in a value array, if any. */
export function storedValue<K extends ValuePatchKey>(bookmark: Bookmark, key: K, propertyId: string): ValueEntry<K> | undefined {
  return (bookmark[key] as ValueEntry<K>[]).find(entry => entry.propertyId === propertyId);
}
