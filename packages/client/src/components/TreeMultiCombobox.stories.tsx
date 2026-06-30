import type { TreeComboboxOption } from "./TreeMultiCombobox";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { TreeMultiCombobox } from "./TreeMultiCombobox";

const TAG_OPTIONS: TreeComboboxOption[] = [
  {
    value: "dev",
    label: "dev",
    children: [
      {
        value: "tools",
        label: "tools",
        children: [
          {
            value: "cli",
            label: "cli",
          },
        ],
      },
      {
        value: "languages",
        label: "languages",
        children: [
          {
            value: "typescript",
            label: "TypeScript",
            searchAlias: "ts",
          },
        ],
      },
    ],
  },
  {
    value: "reading",
    label: "reading",
    children: [
      {
        value: "articles",
        label: "articles",
      },
      {
        value: "books",
        label: "books",
      },
    ],
  },
];

function Controlled({
  initial = [],
}: { initial?: string[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <div className="w-72">
      <TreeMultiCombobox
        options={TAG_OPTIONS}
        values={values}
        onValuesChange={setValues}
        placeholder="Select tags…"
        searchPlaceholder="Search tags…"
        aria-label="Tags"
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
  title: "Components/TreeMultiCombobox",
  component: TreeMultiCombobox,
} satisfies Meta<typeof TreeMultiCombobox>;

export default meta;

/** Empty selection — a collapsible tree of parent/child tags. */
export const Empty: StoryObj = {
  render: () => <Controlled />,
};

/** Pre-selected nodes (their ancestors auto-expand when the dropdown opens). */
export const WithSelections: StoryObj = {
  render: () => <Controlled initial={["cli", "books"]} />,
};

/** With a "Create new" pinned action at the bottom of the dropdown. */
export const WithCreateOption: StoryObj = {
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    return (
      <div className="w-72">
        <TreeMultiCombobox
          options={TAG_OPTIONS}
          values={values}
          onValuesChange={setValues}
          placeholder="Select or create…"
          aria-label="Tags"
          createOption={{
            label: "Create new tag…",
            onSelect: () => {},
          }}
        />
      </div>
    );
  },
};
