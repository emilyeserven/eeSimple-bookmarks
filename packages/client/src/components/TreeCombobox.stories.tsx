import type { TreeComboboxOption } from "./TreeMultiCombobox";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TreeCombobox } from "./TreeCombobox";

const MEDIA_TYPE_OPTIONS: TreeComboboxOption[] = [
  {
    value: "video",
    label: "Video",
    children: [
      {
        value: "film",
        label: "Film",
      },
      {
        value: "series",
        label: "Series",
        children: [
          {
            value: "anime",
            label: "Anime",
            searchAlias: "アニメ",
          },
        ],
      },
    ],
  },
  {
    value: "audio",
    label: "Audio",
    children: [
      {
        value: "podcast",
        label: "Podcast",
      },
      {
        value: "music",
        label: "Music",
      },
    ],
  },
];

function Controlled({
  initial,
  leadingOption,
}: {
  initial?: string;
  leadingOption?: { value: string;
    label: string; };
}) {
  const [value, setValue] = useState<string | undefined>(initial);
  return (
    <div className="w-72">
      <TreeCombobox
        options={MEDIA_TYPE_OPTIONS}
        value={value}
        onValueChange={setValue}
        placeholder="No media type"
        searchPlaceholder="Search media types…"
        aria-label="Media type"
        leadingOption={leadingOption}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Selected:
        {" "}
        {value ?? "(none)"}
      </p>
    </div>
  );
}

const meta = {
  title: "Components/TreeCombobox",
  component: TreeCombobox,
} satisfies Meta<typeof TreeCombobox>;

export default meta;

/** Empty selection — a collapsible single-select tree of media types. */
export const Empty: StoryObj = {
  render: () => <Controlled />,
};

/** A pre-selected node (its ancestors auto-expand when the dropdown opens). */
export const WithSelection: StoryObj = {
  render: () => <Controlled initial="anime" />,
};

/** With a pinned leading option (e.g. autofill's "— Leave unchanged —") that survives search. */
export const WithLeadingOption: StoryObj = {
  render: () => (
    <Controlled
      initial="__none__"
      leadingOption={{
        value: "__none__",
        label: "— Leave unchanged —",
      }}
    />
  ),
};

/** With a "Create new" pinned action at the bottom of the dropdown. */
export const WithCreateOption: StoryObj = {
  render: () => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <div className="w-72">
        <TreeCombobox
          options={MEDIA_TYPE_OPTIONS}
          value={value}
          onValueChange={setValue}
          placeholder="Select or create…"
          aria-label="Media type"
          createOption={{
            label: "Create new media type…",
            onSelect: () => {},
          }}
        />
      </div>
    );
  },
};
