import type { EntityName, MediaTypeNode } from "@eesimple/types";

import { isValidElement } from "react";

import { describe, expect, it } from "vitest";

import { mediaTypeNodesToOptions } from "./comboboxOptions";

import { makeMediaType } from "@/test-utils/factories";

/** A minimal language-labelled name for media-type fixtures. */
function nm(value: string): EntityName {
  return {
    id: value,
    language: {
      id: value,
      name: value,
      slug: value,
      isoCode: null,
    },
    value,
    isPrimary: false,
    sortOrder: 0,
  };
}

function makeNode(overrides: Partial<MediaTypeNode> = {}): MediaTypeNode {
  return {
    ...makeMediaType(overrides),
    children: overrides.children ?? [],
  };
}

describe("mediaTypeNodesToOptions", () => {
  it("maps id → value, name → label, and preserves nested children recursively", () => {
    const nodes = [
      makeNode({
        id: "video",
        name: "Video",
        children: [
          makeNode({
            id: "film",
            name: "Film",
            parentId: "video",
          }),
        ],
      }),
    ];

    const options = mediaTypeNodesToOptions(nodes);
    expect(options).toHaveLength(1);
    expect(options[0]?.value).toBe("video");
    expect(options[0]?.label).toBe("Video");
    expect(options[0]?.children).toEqual([
      expect.objectContaining({
        value: "film",
        label: "Film",
      }),
    ]);
  });

  it("carries language-labelled names as searchAlias (undefined when absent)", () => {
    const [withNames, withoutNames] = mediaTypeNodesToOptions([
      makeNode({
        id: "a",
        name: "映画",
        names: [nm("Eiga")],
      }),
      makeNode({
        id: "b",
        name: "Book",
      }),
    ]);
    expect(withNames?.searchAlias).toBe("Eiga");
    expect(withoutNames?.searchAlias).toBeUndefined();
  });

  it("attaches an icon element to each option", () => {
    const [option] = mediaTypeNodesToOptions([makeNode({
      id: "a",
      name: "A",
    })]);
    expect(isValidElement(option?.icon)).toBe(true);
  });
});
