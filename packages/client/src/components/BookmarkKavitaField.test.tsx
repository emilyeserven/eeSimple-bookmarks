import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkKavitaField } from "./BookmarkKavitaField";
import { makeBookmark } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

let connectorsEnabled = true;

vi.mock("../hooks/useConnectors", () => ({
  useConnectors: () => ({
    data: {
      kavita: {
        enabled: connectorsEnabled,
        baseUrl: connectorsEnabled ? "http://localhost:5000" : null,
      },
    },
  }),
}));

describe("BookmarkKavitaField", () => {
  it("renders nothing when the Kavita connector is unconfigured", async () => {
    connectorsEnabled = false;
    await renderWithRouter(
      <BookmarkKavitaField
        bookmark={makeBookmark()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText("Kavita series")).not.toBeInTheDocument();
  });

  it("offers the series search when the bookmark is unlinked", async () => {
    connectorsEnabled = true;
    await renderWithRouter(
      <BookmarkKavitaField
        bookmark={makeBookmark()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("Kavita series")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search your Kavita library…")).toBeInTheDocument();
  });

  it("shows the linked series as a deep link with an unlink button", async () => {
    connectorsEnabled = true;
    const onSelect = vi.fn();
    await renderWithRouter(
      <BookmarkKavitaField
        bookmark={makeBookmark({
          kavitaSeriesId: 12,
          kavitaLibraryId: 3,
          kavitaSeriesName: "Berserk",
        })}
        onSelect={onSelect}
      />,
    );

    const link = screen.getByRole("link", {
      name: /Berserk/,
    });
    expect(link).toHaveAttribute("href", "http://localhost:5000/library/3/series/12");

    fireEvent.click(screen.getByRole("button", {
      name: "Unlink Kavita series",
    }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
