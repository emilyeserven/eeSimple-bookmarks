import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CustomPropertyManager } from "./CustomPropertyManager";
import { makeCustomProperty } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

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
  it("renders the property preview linking to its view page", async () => {
    await renderWithRouter(<CustomPropertyManager />, {
      paths,
    });
    const link = screen.getByRole("link", {
      name: /Stars/,
    });
    expect(link).toHaveAttribute("href", "/custom-properties/stars");
  });
});
