import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LayoutDrivenTabBody } from "./LayoutDrivenTabBody";

interface Demo {
  id: string;
}

const demo: Demo = {
  id: "demo-1",
};

function field(key: string): WorkbenchField<Demo> {
  return {
    key,
    label: key,
    view: () => <div data-testid={`field-${key}`}>{key}</div>,
    edit: () => <div data-testid={`field-${key}`}>{key}</div>,
  };
}

const fields = {
  a: field("a"),
  b: field("b"),
  c: field("c"),
} satisfies Record<string, WorkbenchField<Demo>>;

const workbench = {
  fields,
} as unknown as EntityWorkbench<Demo>;

/** A layout with a 2-column "grid" section and a default full-width "solo" section. */
const layout: EntityLayout = {
  tabs: [{
    key: "general",
    label: "General",
    sections: [
      {
        key: "grid",
        columns: 2,
        fields: ["a", "b"],
      },
      {
        key: "solo",
        fields: ["c"],
      },
    ],
  }],
};

describe("LayoutDrivenTabBody column layout (#1220)", () => {
  it("renders a multi-column section as a responsive grid that stacks below md", () => {
    const {
      container,
    } = render(
      <LayoutDrivenTabBody
        workbench={workbench}
        layout={layout}
        tabKey="general"
        mode="view"
        entity={demo}
      />,
    );
    const grid = container.querySelector(".md\\:grid-cols-2");
    expect(grid).not.toBeNull();
    // Both of the grid section's fields live inside that grid container, in order.
    expect(grid?.querySelector("[data-testid='field-a']")).not.toBeNull();
    expect(grid?.querySelector("[data-testid='field-b']")).not.toBeNull();
  });

  it("keeps a default (1-column) section as the plain full-width stack", () => {
    const {
      container,
    } = render(
      <LayoutDrivenTabBody
        workbench={workbench}
        layout={layout}
        tabKey="general"
        mode="edit"
        entity={demo}
      />,
    );
    // The solo field is not inside any grid container.
    const solo = container.querySelector("[data-testid='field-c']");
    expect(solo).not.toBeNull();
    expect(solo?.closest(".md\\:grid-cols-2")).toBeNull();
    expect(solo?.parentElement?.className).toContain("space-y-6");
  });
});

describe("LayoutDrivenTabBody descriptions (#1220 follow-up)", () => {
  const describedLayout: EntityLayout = {
    tabs: [{
      key: "general",
      label: "General",
      description: "What this tab is about",
      sections: [{
        key: "main",
        title: "Main",
        description: "The core fields",
        fields: ["a"],
      }],
    }],
  };

  it("renders the tab description above the sections and the section description under its title", () => {
    const {
      getByText,
    } = render(
      <LayoutDrivenTabBody
        workbench={workbench}
        layout={describedLayout}
        tabKey="general"
        mode="view"
        entity={demo}
      />,
    );
    expect(getByText("What this tab is about")).toBeTruthy();
    expect(getByText("The core fields")).toBeTruthy();
  });

  it("shows a description on an untitled section (title falls back to empty)", () => {
    const layout: EntityLayout = {
      tabs: [{
        key: "general",
        label: "General",
        sections: [{
          key: "main",
          description: "Standalone blurb",
          fields: ["a"],
        }],
      }],
    };
    const {
      getByText,
    } = render(
      <LayoutDrivenTabBody
        workbench={workbench}
        layout={layout}
        tabKey="general"
        mode="edit"
        entity={demo}
      />,
    );
    expect(getByText("Standalone blurb")).toBeTruthy();
  });
});

describe("LayoutDrivenTabBody empty-section hiding (#1225)", () => {
  const emptyFields = {
    filled: {
      key: "filled",
      label: "Filled",
      view: () => <span>Filled value</span>,
      edit: () => <input aria-label="Filled" />,
    },
    // A view renderer that returns nothing when the entity has no value for it.
    blank: {
      key: "blank",
      label: "Blank",
      view: () => null,
      edit: () => <input aria-label="Blank" />,
    },
  } satisfies Record<string, WorkbenchField<Demo>>;

  const emptyWorkbench = {
    fields: emptyFields,
  } as unknown as EntityWorkbench<Demo>;

  const emptyLayout: EntityLayout = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [
        {
          key: "a",
          title: "Filled Section",
          fields: ["filled"],
        },
        {
          key: "b",
          title: "Empty Section",
          fields: ["blank"],
        },
      ],
    }],
  };

  it("hides a view section whose fields render no value", async () => {
    render(
      <LayoutDrivenTabBody
        workbench={emptyWorkbench}
        layout={emptyLayout}
        tabKey="general"
        mode="view"
        entity={demo}
      />,
    );

    expect(screen.getByText("Filled value")).toBeVisible();
    expect(screen.getByText("Filled Section")).toBeVisible();
    // The empty section's heading stays mounted (for re-measure) but hidden.
    await waitFor(() => expect(screen.getByText("Empty Section")).not.toBeVisible());
  });

  it("keeps every section in edit mode so inputs stay reachable", () => {
    render(
      <LayoutDrivenTabBody
        workbench={emptyWorkbench}
        layout={emptyLayout}
        tabKey="general"
        mode="edit"
        entity={demo}
      />,
    );

    expect(screen.getByText("Empty Section")).toBeVisible();
    expect(screen.getByLabelText("Blank")).toBeVisible();
  });

  const onlyBlankLayout: EntityLayout = {
    tabs: [{
      key: "general",
      label: "General",
      sections: [{
        key: "b",
        title: "Empty Section",
        fields: ["blank"],
      }],
    }],
  };

  it("reports the whole tab empty when every section renders no value", async () => {
    const onViewEmptyChange = vi.fn();
    render(
      <LayoutDrivenTabBody
        workbench={emptyWorkbench}
        layout={onlyBlankLayout}
        tabKey="general"
        mode="view"
        entity={demo}
        onViewEmptyChange={onViewEmptyChange}
      />,
    );
    await waitFor(() => expect(onViewEmptyChange).toHaveBeenLastCalledWith(true));
  });

  it("reports the tab non-empty when a section has content", async () => {
    const onViewEmptyChange = vi.fn();
    render(
      <LayoutDrivenTabBody
        workbench={emptyWorkbench}
        layout={emptyLayout}
        tabKey="general"
        mode="view"
        entity={demo}
        onViewEmptyChange={onViewEmptyChange}
      />,
    );
    await waitFor(() => expect(onViewEmptyChange).toHaveBeenLastCalledWith(false));
  });
});
