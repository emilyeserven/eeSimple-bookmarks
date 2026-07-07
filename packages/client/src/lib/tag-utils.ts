import type { TagNode } from "@eesimple/types";

/** Strip children so a TagPicker shows only root ("parent") tags. */
export function rootOnly(tree: TagNode[]): TagNode[] {
  return tree.map(node => ({
    ...node,
    children: [],
  }));
}

/** Add or remove `id` from `ids`, returning a new array. */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
}

/** Ids present in `next` but not `prev`, and ids present in `prev` but not `next`. */
export function diffIds(prev: string[], next: string[]): { added: string[];
  removed: string[]; } {
  return {
    added: next.filter(id => !prev.includes(id)),
    removed: prev.filter(id => !next.includes(id)),
  };
}
