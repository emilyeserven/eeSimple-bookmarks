import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Row } from "@tanstack/react-table";

import { LocationNameCell, LocationPlaceTypeCell } from "./locationCells";
import { makeLocation } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

/** A minimal `Row<LocationNode>` stub — these cells only read `depth`, `original`, and the
 * expand helpers used by `TreeExpandToggle`. */
function makeRow(node: LocationNode, depth = 0): Row<LocationNode> {
  return {
    original: node,
    depth,
    getCanExpand: () => node.children.length > 0,
    getIsExpanded: () => false,
    getToggleExpandedHandler: () => () => {},
  } as unknown as Row<LocationNode>;
}

function makeNode(overrides: Partial<LocationNode> = {}): LocationNode {
  return {
    ...makeLocation(),
    children: [],
    ...overrides,
  };
}

const meta = {
  title: "Components/Tables/LocationCells",
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Name: Story = {
  render: () => (
    <LocationNameCell
      row={makeRow(makeNode({
        id: "loc-sf",
        name: "San Francisco",
        slug: "san-francisco",
      }))}
    />
  ),
};

export const NestedWithChildren: Story = {
  render: () => (
    <LocationNameCell
      row={makeRow(
        makeNode({
          id: "loc-ca",
          name: "California",
          slug: "california",
          children: [makeNode({
            id: "loc-sf",
            name: "San Francisco",
            slug: "san-francisco",
          })],
        }),
        1,
      )}
    />
  ),
};

export const PlaceType: Story = {
  render: () => (
    <div className="space-y-1">
      <LocationPlaceTypeCell
        row={makeRow(makeNode({
          placeType: "city",
        }))}
      />
      <LocationPlaceTypeCell row={makeRow(makeNode())} />
    </div>
  ),
};
