import type { Item } from "@app/types";

/**
 * Shared test factories. Construct full shared entity objects in tests, stories, and MSW mocks with
 * these (override only the fields a test cares about) — never re-list every field in an inline
 * literal, which silently drifts when the shared type changes. When you add a field to a shared
 * type, update its factory's defaults; a new shared entity gets a factory here in the same change.
 */
export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    name: "Example item",
    slug: "example-item",
    description: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
