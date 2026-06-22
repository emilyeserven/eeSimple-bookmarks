import type { ToolbarAction } from "./toolbarActions";

import { fireEvent, render, screen } from "@testing-library/react";
import { Eye } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";

import { HeaderToolbar } from "./HeaderToolbar";

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

/** A modal action whose body only renders while open — lets us assert it survives the dropdown closing. */
function makeActions(): ToolbarAction[] {
  return [
    {
      key: "display",
      desktop: <button type="button">Display desktop</button>,
      mobile: {
        kind: "modal",
        icon: Eye,
        label: "Display",
        renderModal: open => (open ? <div role="dialog">Display modal body</div> : null),
      },
    },
    {
      key: "open-panel",
      desktop: (
        <button
          type="button"
          aria-label="Open panel"
        >
          panel
        </button>
      ),
      mobile: {
        kind: "standalone",
      },
    },
  ];
}

describe("HeaderToolbar", () => {
  afterEach(() => setViewport(1024));

  it("renders the inline row on wide screens (no More menu)", () => {
    setViewport(1024);
    render(<HeaderToolbar actions={makeActions()} />);
    expect(screen.getByText("Display desktop")).toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "More",
    })).not.toBeInTheDocument();
  });

  it("collapses everything but the panel toggle into a More menu on small screens", async () => {
    setViewport(500);
    render(<HeaderToolbar actions={makeActions()} />);

    // The panel toggle stays standalone; the desktop-only Display node is gone.
    const moreButton = await screen.findByRole("button", {
      name: "More",
    });
    expect(screen.getByRole("button", {
      name: "Open panel",
    })).toBeInTheDocument();
    expect(screen.queryByText("Display desktop")).not.toBeInTheDocument();

    // Open the dropdown (jsdom needs a keyboard event), select the Display row.
    fireEvent.keyDown(moreButton, {
      key: " ",
    });
    const row = await screen.findByRole("menuitem", {
      name: /Display/,
    });
    fireEvent.click(row);

    // The modal body renders as a sibling of the dropdown, so it survives the dropdown closing.
    expect(await screen.findByRole("dialog")).toHaveTextContent("Display modal body");
  });
});
