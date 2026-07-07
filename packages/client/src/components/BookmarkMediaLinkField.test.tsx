import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkMediaLinkField } from "./BookmarkMediaLinkField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { renderWithRouter } from "../test-utils/router";

const bookmarksData = [
  {
    id: "parasite-id",
    title: "Parasite",
  },
  {
    id: "analysis-id",
    title: "My analysis video",
  },
];

const relationshipTypesData = [
  {
    id: "about-id",
    name: "About",
    slug: "about",
    directional: true,
    builtIn: true,
    sortOrder: 0,
  },
  {
    id: "parent-child-id",
    name: "Parent/child",
    slug: "parent-child",
    directional: true,
    builtIn: true,
    sortOrder: 1,
  },
];

vi.mock("../hooks/useBookmarks", () => ({
  useBookmarks: () => ({
    data: bookmarksData,
  }),
  useCreateBookmark: () => ({
    mutate: vi.fn(),
    isError: false,
    error: null,
  }),
}));
vi.mock("../hooks/useRelationshipTypes", () => ({
  useRelationshipTypes: () => ({
    data: relationshipTypesData,
  }),
}));
vi.mock("../hooks/useMediaTypes", () => ({
  useMediaTypes: () => ({
    data: [],
  }),
}));

describe("BookmarkMediaLinkField", () => {
  it("stages nothing until a target bookmark is picked", async () => {
    let capturedForm: import("./bookmarkFormSchema").BookmarkFormApi | undefined;
    await renderWithRouter(
      <BookmarkFormHost>
        {(form) => {
          capturedForm = form;
          return <BookmarkMediaLinkField form={form} />;
        }}
      </BookmarkFormHost>,
    );
    expect(capturedForm?.getFieldValue("mediaLinkTarget")).toBeNull();
    // No relationship-type combobox until a target is selected.
    expect(screen.queryByLabelText("Relationship type")).not.toBeInTheDocument();
  });

  it("stages an About edge with the target bookmark as parent by default", async () => {
    let capturedForm: import("./bookmarkFormSchema").BookmarkFormApi | undefined;
    await renderWithRouter(
      <BookmarkFormHost>
        {(form) => {
          capturedForm = form;
          return <BookmarkMediaLinkField form={form} />;
        }}
      </BookmarkFormHost>,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Media bookmark",
    }));
    fireEvent.click(screen.getByRole("option", {
      name: "Parasite",
    }));

    expect(capturedForm?.getFieldValue("mediaLinkTarget")).toEqual({
      bookmarkId: "parasite-id",
      relationshipTypeId: "about-id",
      direction: "parent",
    });
    // The default "About" type hides the parent/child toggle — it's already correct.
    expect(screen.queryByLabelText("The selected bookmark is the parent")).not.toBeInTheDocument();
  });

  it("shows the parent/child toggle when a non-About directional type is chosen", async () => {
    let capturedForm: import("./bookmarkFormSchema").BookmarkFormApi | undefined;
    await renderWithRouter(
      <BookmarkFormHost>
        {(form) => {
          capturedForm = form;
          return <BookmarkMediaLinkField form={form} />;
        }}
      </BookmarkFormHost>,
    );

    fireEvent.click(screen.getByRole("combobox", {
      name: "Media bookmark",
    }));
    fireEvent.click(screen.getByRole("option", {
      name: "Parasite",
    }));

    fireEvent.click(screen.getByRole("combobox", {
      name: "Relationship type",
    }));
    fireEvent.click(screen.getByRole("option", {
      name: "Parent/child",
    }));

    expect(capturedForm?.getFieldValue("mediaLinkTarget")).toMatchObject({
      relationshipTypeId: "parent-child-id",
    });
    expect(screen.getByLabelText("The selected bookmark is the parent")).toBeInTheDocument();
  });
});
