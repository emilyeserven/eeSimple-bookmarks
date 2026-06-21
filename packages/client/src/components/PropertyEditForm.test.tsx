import type { CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PropertyForm } from "./PropertyForm";
import { PropertyGeneralEditForm } from "./PropertyGeneralEditForm";
import { PropertyCategoriesEditForm } from "./PropertyScopeEditForms";
import { makeCustomProperty } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";
import { sampleCategories, sampleMediaTypes } from "../test-utils/story-mocks";

// The auto-saving edit tabs are data-in / mutation-out: the only side effects are the update mutation
// and the named auto-save toast, both mocked here so the tests pin the persistence contract (which key
// is sent, with what toast) without a real network or router.

const updateMutate
  = vi.fn<(vars: { id: string;
    input: Record<string, unknown>; }, opts?: {
      onSuccess?: (data: CustomProperty) => void;
      onError?: (error: Error) => void;
    }) => void>();
let mutationBehavior: "success" | "error" = "success";

vi.mock("../hooks/useCustomProperties", () => ({
  useCustomProperties: () => ({
    data: [],
  }),
  useUpdateCustomProperty: () => ({
    mutate: (
      vars: { id: string;
        input: Record<string, unknown>; },
      opts?: { onSuccess?: (data: CustomProperty) => void;
        onError?: (error: Error) => void; },
    ) => {
      updateMutate(vars, opts);
      if (mutationBehavior === "success") {
        opts?.onSuccess?.(makeCustomProperty({
          id: vars.id,
          ...vars.input,
        }));
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

const property = makeCustomProperty({
  id: "prop-1",
  name: "Priority",
  slug: "priority",
  type: "number",
  description: "How urgent",
  enabled: true,
  categoryIds: ["cat-workflow"],
});

beforeEach(() => {
  updateMutate.mockReset();
  notifyFieldSaved.mockReset();
  notifyFieldSaveError.mockReset();
  mutationBehavior = "success";
});

describe("PropertyGeneralEditForm (auto-save)", () => {
  it("has no Save button", async () => {
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);
    expect(screen.queryByRole("button", {
      name: /save/i,
    })).toBeNull();
  });

  it("renders the Type as immutable and never saves it", async () => {
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);
    // The Type combobox/select trigger is disabled in edit mode.
    expect(screen.getByLabelText("Type")).toBeDisabled();
  });

  it("saves only the name on blur and toasts the field", async () => {
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);

    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "Urgency",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "prop-1",
      input: {
        name: "Urgency",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("saves the description on blur", async () => {
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);

    const description = screen.getByLabelText("Description");
    fireEvent.change(description, {
      target: {
        value: "Triage urgency",
      },
    });
    fireEvent.blur(description);

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "prop-1",
      input: {
        description: "Triage urgency",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Description");
  });

  it("saves enabled on change (no blur needed)", async () => {
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);

    fireEvent.click(screen.getByLabelText("Property is active"));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate.mock.calls[0][0]).toEqual({
      id: "prop-1",
      input: {
        enabled: false,
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Status");
  });

  it("does not save and shows the inline error when the name is cleared", async () => {
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);

    const name = screen.getByLabelText("Name");
    fireEvent.change(name, {
      target: {
        value: "",
      },
    });
    fireEvent.blur(name);

    expect(updateMutate).not.toHaveBeenCalled();
    expect(notifyFieldSaved).not.toHaveBeenCalled();
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
  });

  it("keeps the typed value and toasts an error when the save fails", async () => {
    mutationBehavior = "error";
    await renderWithRouter(<PropertyGeneralEditForm property={property} />);

    const name = screen.getByLabelText<HTMLInputElement>("Name");
    fireEvent.change(name, {
      target: {
        value: "Urgency",
      },
    });
    fireEvent.blur(name);

    await waitFor(() => expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "offline"));
    expect(name.value).toBe("Urgency");
  });
});

describe("PropertyCategoriesEditForm (auto-save)", () => {
  it("persists allCategories + categoryIds together with one Categories toast", async () => {
    await renderWithRouter(
      <PropertyCategoriesEditForm
        property={property}
        categories={sampleCategories}
      />,
    );

    // Toggling another category fires a single combined save.
    fireEvent.click(screen.getByLabelText(/Content/));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const sent = updateMutate.mock.calls[0][0];
    expect(sent.id).toBe("prop-1");
    expect(Object.keys(sent.input).sort()).toEqual(["allCategories", "categoryIds"]);
    expect(sent.input.allCategories).toBe(false);
    expect(sent.input.categoryIds).toContain("cat-content");
    expect(notifyFieldSaved).toHaveBeenCalledTimes(1);
    expect(notifyFieldSaved).toHaveBeenCalledWith("Categories");
  });
});

describe("PropertyForm create path (regression guard)", () => {
  it("still renders a submit button and submits the built payload", async () => {
    const onSubmit = vi.fn();
    await renderWithRouter(
      <PropertyForm
        mode="create"
        categories={sampleCategories}
        mediaTypes={sampleMediaTypes}
        numberProperties={[]}
        propertyGroups={[]}
        onSubmit={onSubmit}
        submitLabel="Add property"
        idPrefix="new"
      />,
    );

    const submit = screen.getByRole("button", {
      name: "Add property",
    });
    expect(submit).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: {
        value: "Priority",
      },
    });
    fireEvent.click(submit);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: "Priority",
      type: "number",
    });
    // The create form must not auto-save through the update mutation.
    expect(updateMutate).not.toHaveBeenCalled();
  });
});
