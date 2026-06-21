import type { TagNode } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TagGeneralForm } from "./TagGeneralForm";
import { renderWithRouter } from "../test-utils/router";

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: TagNode) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

vi.mock("../hooks/useTags", () => ({
  useUpdateTag: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: TagNode) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.({
          id: vars.id,
          slug: "reading",
          ...vars.input,
        } as TagNode);
      }
      else opts?.onError?.(new Error("offline"));
    },
  }),
}));

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();
vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

function makeTagNode(overrides: Partial<TagNode> = {}): TagNode {
  return {
    id: "tag-1",
    name: "Reading",
    slug: "reading",
    parentId: null,
    children: [],
    ...overrides,
  } as TagNode;
}

const node = makeTagNode();

describe("TagGeneralForm (auto-save)", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
    mutationBehavior = "success";
  });

  it("has no Save button", async () => {
    await renderWithRouter(
      <TagGeneralForm
        node={node}
        allTags={[node]}
        forbiddenIds={new Set(["tag-1"])}
      />,
    );
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("saves only the name on blur and toasts the field", async () => {
    await renderWithRouter(
      <TagGeneralForm
        node={node}
        allTags={[node]}
        forbiddenIds={new Set(["tag-1"])}
      />,
    );

    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "Reading List",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "tag-1",
      input: {
        name: "Reading List",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("does not save a cleared required name and shows the inline error", async () => {
    await renderWithRouter(
      <TagGeneralForm
        node={node}
        allTags={[node]}
        forbiddenIds={new Set(["tag-1"])}
      />,
    );
    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "",
      },
    });
    fireEvent.blur(name);

    expect(updateMutate).not.toHaveBeenCalled();
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
  });

  it("keeps the typed value and toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    await renderWithRouter(
      <TagGeneralForm
        node={node}
        allTags={[node]}
        forbiddenIds={new Set(["tag-1"])}
      />,
    );

    const name = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.change(name, {
      target: {
        value: "Reading List",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "offline"));
    expect(name.value).toBe("Reading List");
  });
});
