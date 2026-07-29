import type { LayoutFieldMeta } from "./LayoutBoard";
import type { EntityLayout } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { Calendar, FileText, Hash, Image, Link, Tag, Type } from "lucide-react";

import { LayoutBoard } from "./LayoutBoard";
import { makeEntityLayout, makeLayoutSection, makeLayoutTab } from "../test-utils/factories";

/** A fake field registry — the caller-supplied `{ key, label, icon }` metadata the board renders. */
const FAKE_FIELDS: LayoutFieldMeta[] = [
  {
    key: "title",
    label: "Title",
    icon: Type,
  },
  {
    key: "url",
    label: "URL",
    icon: Link,
  },
  {
    key: "description",
    label: "Description",
    icon: FileText,
  },
  {
    key: "tags",
    label: "Tags",
    icon: Tag,
  },
  {
    key: "created",
    label: "Created",
    icon: Calendar,
  },
  {
    key: "priority",
    label: "Priority",
    icon: Hash,
  },
  {
    key: "image",
    label: "Image",
    icon: Image,
  },
];

/** A two-tab layout with fields split across sections and two fields left in the tray. */
function twoTabLayout(): EntityLayout {
  return makeEntityLayout({
    tabs: [
      makeLayoutTab({
        key: "general",
        label: "General",
        icon: "FileText",
        sections: [
          makeLayoutSection({
            key: "main",
            title: "Main",
            fields: ["title", "url", "description"],
          }),
          makeLayoutSection({
            key: "meta",
            title: "Metadata",
            fields: ["tags"],
          }),
        ],
      }),
      makeLayoutTab({
        key: "advanced",
        label: "Advanced",
        sections: [makeLayoutSection({
          key: "misc",
          fields: ["priority"],
        })],
      }),
    ],
  });
}

/** A single tab / single section — everything else sits in the tray. */
function emptyLayout(): EntityLayout {
  return makeEntityLayout({
    tabs: [makeLayoutTab({
      key: "general",
      label: "General",
      sections: [makeLayoutSection({
        key: "main",
        fields: [],
      })],
    })],
  });
}

/** A single tab + single non-empty section: both delete buttons are guarded (disabled). */
function guardRailLayout(): EntityLayout {
  return makeEntityLayout({
    tabs: [makeLayoutTab({
      key: "general",
      label: "General",
      sections: [makeLayoutSection({
        key: "main",
        title: "Main",
        fields: ["title", "url"],
      })],
    })],
  });
}

const meta = {
  title: "Components/LayoutBoard",
  component: LayoutBoard,
  parameters: {
    layout: "padded",
  },
  args: {
    fields: FAKE_FIELDS,
    idPrefix: "story",
    value: twoTabLayout(),
    onChange: () => {},
  },
  decorators: [Story => (
    <div className="max-w-2xl">
      <Story />
    </div>
  )],
} satisfies Meta<typeof LayoutBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A controlled wrapper so drags/renames stick (the board is a controlled `value`/`onChange`). */
function Controlled({
  initial,
}: { initial: EntityLayout }) {
  const [value, setValue] = useState<EntityLayout>(initial);
  return (
    <LayoutBoard
      value={value}
      onChange={setValue}
      fields={FAKE_FIELDS}
      idPrefix="story"
    />
  );
}

/** Two tabs, fields split across sections, two fields (Created, Image) left unplaced in the tray. */
export const Default: Story = {
  render: () => <Controlled initial={twoTabLayout()} />,
};

/** One tab / one empty section — every field starts in the "Unplaced" tray. */
export const Empty: Story = {
  render: () => <Controlled initial={emptyLayout()} />,
};

/** Single tab + single non-empty section: delete-tab and delete-section are both disabled (guards). */
export const GuardRails: Story = {
  render: () => <Controlled initial={guardRailLayout()} />,
};

/** Fields spread across both tabs — drag one from General into Advanced, or use "Move to…". */
export const CrossTab: Story = {
  render: () => (
    <Controlled
      initial={makeEntityLayout({
        tabs: [
          makeLayoutTab({
            key: "general",
            label: "General",
            sections: [makeLayoutSection({
              key: "main",
              title: "Main",
              fields: ["title", "url", "description", "tags"],
            })],
          }),
          makeLayoutTab({
            key: "advanced",
            label: "Advanced",
            sections: [
              makeLayoutSection({
                key: "dates",
                title: "Dates",
                fields: ["created"],
              }),
              makeLayoutSection({
                key: "misc",
                title: "Misc",
                fields: ["priority", "image"],
              }),
            ],
          }),
        ],
      })}
    />
  ),
};
