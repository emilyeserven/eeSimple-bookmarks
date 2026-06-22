import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagCreateForm } from "./TagPanel";

const mutationStub = {
  mutate: vi.fn(),
  isError: false,
  error: null,
};

vi.mock("./usePanelControls", () => ({
  usePanelControls: () => ({
    close: vi.fn(),
  }),
}));

vi.mock("../../hooks/useTags", () => ({
  useCreateTag: () => mutationStub,
}));

// Viewing/editing an existing tag now goes through the shared `EntityWorkbenchPanel` (the
// `tagWorkbench`); only the create flow keeps its submit form, which is all `TagPanel.tsx` exports.
describe("TagCreateForm", () => {
  it("renders the create form with an Add tag button", () => {
    render(<TagCreateForm />);
    expect(screen.getByRole("button", {
      name: "Add tag",
    })).toBeInTheDocument();
  });
});
