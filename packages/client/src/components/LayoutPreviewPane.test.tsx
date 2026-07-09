import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LayoutPreviewPane } from "./LayoutPreviewPane";
import { categoryWorkbench } from "./workbench/category";
import { renderWithRouter } from "../test-utils/router";

/**
 * Smoke test for the Page Layouts preview pane (#1225): it mounts for a real kind, builds the "Sample"
 * entity (selected by default), and renders its controls without crashing — the sample path needs no
 * network, so this verifies the integration (workbench resolve → `LayoutDrivenTabBody`) end to end even
 * with the instance-list queries unmocked.
 */
describe("LayoutPreviewPane", () => {
  it("renders the View/Edit toggle and defaults the picker to the Sample entity", async () => {
    await renderWithRouter(
      <LayoutPreviewPane
        kind="category"
        layout={categoryWorkbench.defaultLayout ?? {
          tabs: [],
        }}
      />,
    );

    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    // The picker trigger shows the default selection — the filled-in Sample entity.
    expect(screen.getByText("Sample — all fields filled in")).toBeInTheDocument();
  });
});
