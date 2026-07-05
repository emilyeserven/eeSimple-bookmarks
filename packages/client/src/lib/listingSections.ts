import type { EntityListingConfig } from "../entities/types";

/** A rendered group of listing items — an optional heading over the items assigned to it. */
export interface ListingSectionGroup<E> {
  key: string;
  title?: string;
  items: E[];
}

/**
 * Partition an already-filtered listing into ordered, labeled groups for `ListingScaffold`.
 *
 * Each item is assigned to the FIRST section whose `match` returns true (sections should be mutually
 * exclusive & exhaustive); items matching no section are dropped. Empty groups are omitted so their
 * heading never renders. When `sections` is undefined the whole list is returned as one untitled
 * group, so the no-sections path renders exactly as an ungrouped flat list.
 */
export function partitionListingSections<E extends { id: string }>(
  items: E[],
  sections: EntityListingConfig<E>["sections"],
): ListingSectionGroup<E>[] {
  if (!sections) {
    return [{
      key: "__all__",
      items,
    }];
  }

  const buckets = sections.map(section => ({
    key: section.key,
    title: section.title,
    items: [] as E[],
  }));

  for (const item of items) {
    const index = sections.findIndex(section => section.match(item));
    if (index !== -1) {
      buckets[index].items.push(item);
    }
  }

  return buckets.filter(group => group.items.length > 0);
}
