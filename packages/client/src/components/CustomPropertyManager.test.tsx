import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CustomPropertyManager } from "./CustomPropertyManager";
import { makeCustomProperty } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const openItem = vi.fn();

vi.mock("./panel/usePanelControls", () => ({
  usePanelControls: () => ({
    openItem,
  }),
}));

const property = makeCustomProperty({
  id: "prop-stars",
  name: "Stars",
  slug: "stars",
  type: "number",
  categoryIds: ["cat-1"],
  showInForm: true,
});

vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [property],
    isLoading: false,
    error: null,
  }),
  useCreateCustomProperty: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useBulkDeleteCustomProperties: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const paths = ["/custom-properties/$propertySlug", "/custom-properties/new"];

describe("CustomPropertyManager", () => {
  it("does not open the panel on a plain preview click (the link navigates to the view page)", async () => {
    openItem.mockClear();
    await renderWithRouter(<CustomPropertyManager />, {
      paths,
    });
    screen.getByText("Stars").click();
    expect(openItem).not.toHaveBeenCalled();
  });

  it("opens the panel in view mode when a property preview is alt-clicked", async () => {
    openItem.mockClear();
    await renderWithRouter(<CustomPropertyManager />, {
      paths,
    });
    fireEvent.click(screen.getByText("Stars"), {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("property", property.id, "view");
  });
});
