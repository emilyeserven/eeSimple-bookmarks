import type { ComboboxOption } from "./Combobox";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { MultiCombobox } from "./MultiCombobox";

const MEDIA_OPTIONS: ComboboxOption[] = [
  {
    value: "video",
    label: "Video",
    depth: 0,
  },
  {
    value: "short-video",
    label: "Short video",
    depth: 1,
  },
  {
    value: "livestream",
    label: "Livestream",
    depth: 1,
  },
  {
    value: "audio",
    label: "Audio",
    depth: 0,
  },
  {
    value: "podcast",
    label: "Podcast",
    depth: 1,
  },
  {
    value: "audiobook",
    label: "Audiobook",
    depth: 1,
  },
  {
    value: "text",
    label: "Text",
    depth: 0,
  },
  {
    value: "article",
    label: "Article",
    depth: 1,
  },
  {
    value: "book",
    label: "Book",
    depth: 1,
  },
];

function Controlled({
  initial = [],
}: { initial?: string[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <div className="w-72">
      <MultiCombobox
        options={MEDIA_OPTIONS}
        values={values}
        onValuesChange={setValues}
        placeholder="Select media types…"
        searchPlaceholder="Search media types…"
        aria-label="Media types"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Selected:
        {" "}
        {values.length > 0 ? values.join(", ") : "(none)"}
      </p>
    </div>
  );
}

const meta = {
  title: "Components/MultiCombobox",
  component: MultiCombobox,
} satisfies Meta<typeof MultiCombobox>;

export default meta;

type Story = StoryObj;

/** Empty selection — no items checked. */
export const Empty: Story = {
  render: () => <Controlled />,
};

/** Pre-selected items. */
export const WithSelections: Story = {
  render: () => <Controlled initial={["video", "article"]} />,
};

/** With a "Create new" pinned action at the bottom of the dropdown. */
export const WithCreateOption: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <div className="w-72">
        <MultiCombobox
          options={MEDIA_OPTIONS}
          values={values}
          onValuesChange={setValues}
          placeholder="Select or create…"
          aria-label="Media types"
          createOption={{
            label: "Create new media type…",
            onSelect: () => alert("Create new!"),
          }}
        />
      </div>
    );
  },
};

/** No options available — shows the empty state message. */
export const NoOptions: Story = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <div className="w-72">
        <MultiCombobox
          options={[]}
          values={values}
          onValuesChange={setValues}
          placeholder="Select…"
          emptyText="No items found."
          aria-label="Tags"
        />
      </div>
    );
  },
};
