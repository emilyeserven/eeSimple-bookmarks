import type { EntityWorkbench, WorkbenchField } from "./types";
import type { EntityLayout } from "@eesimple/types";

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
