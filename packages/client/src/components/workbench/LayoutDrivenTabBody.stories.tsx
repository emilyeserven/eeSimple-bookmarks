import type { EntityWorkbench, WorkbenchField, WorkbenchMode } from "./types";
import type { EntityLayout } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { LayoutDrivenTabBody } from "./LayoutDrivenTabBody";
import { navLinkClass } from "../TabbedShell";

import { cn } from "@/lib/utils";
import { modeVisibleTabs } from "@/lib/workbenchLayout";

/**
 * Storybook harness proving the layout-driven renderer (#1159) works from a **fake registry** — no
 * real entity opts in yet (that's #1161+). One `fields` registry + one `EntityLayout` drives both
 * modes; the mode picks each field's `view`/`edit` renderer, so an edit-only field ("Display") shows
 * only in edit and a view-only field ("Hierarchy") only in view. Rearranging the layout (adding a tab,
 * moving a field, adding a titled/empty section) re-lays-out the same registry with no code change.
 */

interface Demo {
  id: string;
  hasOptions?: boolean;
}

const demo: Demo = {
  id: "demo-1",
  hasOptions: true,
};

function FieldBox({
  label, mode,
}: { label: string;
  mode: WorkbenchMode; }) {
  return (
    <div className="rounded-md border bg-card p-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="ml-2 text-muted-foreground">({mode})</span>
    </div>
  );
}

const fields = {
  name: {
    key: "name",
    label: "Name",
    view: () => (
      <FieldBox
        label="Name"
        mode="view"
      />
    ),
    edit: () => (
      <FieldBox
        label="Name"
        mode="edit"
      />
    ),
  },
  description: {
    key: "description",
    label: "Description",
    view: () => (
      <FieldBox
        label="Description"
        mode="view"
      />
    ),
    edit: () => (
      <FieldBox
        label="Description"
        mode="edit"
      />
    ),
  },
  display: {
    key: "display",
    label: "Display",
    edit: () => (
      <FieldBox
        label="Display"
        mode="edit"
      />
    ), // edit-only
  },
  hierarchy: {
    key: "hierarchy",
    label: "Hierarchy",
    view: () => (
      <FieldBox
        label="Hierarchy"
        mode="view"
      />
    ), // view-only
  },
  options: {
    key: "options",
    label: "Options",
    view: () => (
      <FieldBox
        label="Options"
        mode="view"
      />
    ),
    edit: () => (
      <FieldBox
        label="Options"
        mode="edit"
      />
    ),
    showIf: (e: Demo) => e.hasOptions === true,
  },
} satisfies Record<string, WorkbenchField<Demo>>;

// Today's default: one untitled section per tab (renders like the current per-tab bodies).
const defaultLayout: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: "General",
      sections: [{
        key: "main",
        fields: ["name", "description"],
      }],
    },
    {
      key: "display",
      label: "Display",
      sections: [{
        key: "s",
        fields: ["display"],
      }],
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      sections: [{
        key: "s",
        fields: ["hierarchy"],
      }],
    },
    {
      key: "options",
      label: "Options",
      sections: [{
        key: "s",
        fields: ["options"],
      }],
    },
  ],
};

// A user rearrangement: a NEW "Details" tab, `description` MOVED off General into a titled section
// beside `options`, a titled General section, and an all-empty section (hidden at render).
const rearrangedLayout: EntityLayout = {
  tabs: [
    {
      key: "general",
      label: "General",
      sections: [{
        key: "main",
        title: "Identity",
        fields: ["name"],
      }],
    },
    {
      key: "details",
      label: "Details",
      sections: [
        {
          key: "about",
          title: "About",
          fields: ["description", "options"],
        },
        {
          key: "empty",
          title: "Empty (hidden at render)",
          fields: [],
        },
      ],
    },
    {
      key: "display",
      label: "Display",
      sections: [{
        key: "s",
        fields: ["display"],
      }],
    },
    {
      key: "hierarchy",
      label: "Hierarchy",
      sections: [{
        key: "s",
        fields: ["hierarchy"],
      }],
    },
  ],
};

interface PreviewProps {
  layout: EntityLayout;
  mode: WorkbenchMode;
}

/** A router-free stand-in for the real rail: `modeVisibleTabs` + `LayoutDrivenTabBody`. */
function LayoutPreview({
  layout, mode,
}: PreviewProps) {
  const tabs = modeVisibleTabs(layout, fields, mode, demo);
  const [active, setActive] = useState(tabs[0]?.key);
  const activeKey = tabs.find(tab => tab.key === active)?.key ?? tabs[0]?.key;
  const workbench = {
    fields,
  } as unknown as EntityWorkbench<Demo>;

  return (
    <div
      className="
        flex max-w-3xl flex-col gap-6
        md:flex-row
      "
    >
      <nav
        className="
          flex flex-row gap-1 overflow-x-auto border-b pb-1
          md:w-40 md:flex-col md:border-b-0 md:pb-0
        "
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              navLinkClass,
              `
                text-left
                md:w-full
              `,
              tab.key === activeKey && "bg-accent text-accent-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1">
        {activeKey
          ? (
            <LayoutDrivenTabBody
              workbench={workbench}
              layout={layout}
              tabKey={activeKey}
              mode={mode}
              entity={demo}
            />
          )
          : null}
      </div>
    </div>
  );
}

const meta = {
  title: "Workbench/LayoutDrivenTabBody",
  component: LayoutPreview,
  args: {
    layout: defaultLayout,
    mode: "view",
  },
} satisfies Meta<typeof LayoutPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Default layout, view mode: General (Name + Description), Hierarchy, Options. No Display (edit-only). */
export const DefaultView: Story = {};

/** Default layout, edit mode: General, Display, Options. No Hierarchy (view-only). */
export const DefaultEdit: Story = {
  args: {
    mode: "edit",
  },
};

/** Rearranged layout, view mode: `description` now lives on the new Details tab beside Options. */
export const RearrangedView: Story = {
  args: {
    layout: rearrangedLayout,
  },
};

/** Rearranged layout, edit mode: same tree, edit renderers — Display reappears, Hierarchy drops. */
export const RearrangedEdit: Story = {
  args: {
    layout: rearrangedLayout,
    mode: "edit",
  },
};
