import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SectionsPropertyField } from "./BookmarkPropertyFields";
import { makeCustomProperty } from "../test-utils/factories";

const property = makeCustomProperty({
  type: "sections",
  name: "Page Sections",
  slug: "page-sections",
  sectionsDefaultType: "page",
});

const emptyValue = {
  exhaustive: false,
  sections: [],
};

describe("SectionsPropertyField import button", () => {
  it("renders no import button when onImport is not provided", () => {
    render(
      <SectionsPropertyField
        property={property}
        value={emptyValue}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", {
      name: /Import from Kavita/,
    })).not.toBeInTheDocument();
  });

  it("calls onImport when clicked", () => {
    const onImport = vi.fn();
    render(
      <SectionsPropertyField
        property={property}
        value={emptyValue}
        onChange={vi.fn()}
        onImport={onImport}
      />,
    );

    fireEvent.click(screen.getByRole("button", {
      name: /Import from Kavita/,
    }));
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("disables the button while the import is pending", () => {
    render(
      <SectionsPropertyField
        property={property}
        value={emptyValue}
        onChange={vi.fn()}
        onImport={vi.fn()}
        isImportPending
      />,
    );

    expect(screen.getByRole("button", {
      name: /Import from Kavita/,
    })).toBeDisabled();
  });
});
