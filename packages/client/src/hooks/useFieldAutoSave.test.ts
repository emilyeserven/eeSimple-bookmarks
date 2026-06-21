import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFieldAutoSave } from "./useFieldAutoSave";

const notifyFieldSaved = vi.fn<(label: string) => void>();
const notifyFieldSaveError = vi.fn<(label: string, cause?: string) => void>();

vi.mock("../lib/autoSave", () => ({
  notifyFieldSaved: (label: string) => notifyFieldSaved(label),
  notifyFieldSaveError: (label: string, cause?: string) => notifyFieldSaveError(label, cause),
}));

interface Fields {
  name: string;
  tagIds: string[];
}

/** A fake mutation matching the `useUpdateX` shape: `mutate({ id, input }, { onSuccess, onError })`. */
function makeMutation(behavior: "success" | "error" = "success") {
  const mutate = vi.fn(
    (
      vars: { id: string;
        input: Partial<Fields>; },
      opts?: { onSuccess?: (data: Fields) => void;
        onError?: (error: Error) => void; },
    ) => {
      if (behavior === "success") opts?.onSuccess?.({
        ...vars.input,
      } as Fields);
      else opts?.onError?.(new Error("boom"));
    },
  );
  return {
    mutate,
  };
}

const labels: Record<keyof Fields, string> = {
  name: "Name",
  tagIds: "Tags",
};

describe("useFieldAutoSave", () => {
  beforeEach(() => {
    notifyFieldSaved.mockReset();
    notifyFieldSaveError.mockReset();
  });

  it("saves a single-field patch and fires a field-named success toast", () => {
    const update = makeMutation();
    const {
      result,
    } = renderHook(() =>
      useFieldAutoSave<Fields>({
        id: "c1",
        update,
        labels,
        initial: {
          name: "Old",
          tagIds: [],
        },
      }));

    act(() => result.current.saveField("name", "New"));

    expect(update.mutate).toHaveBeenCalledTimes(1);
    expect(update.mutate.mock.calls[0][0]).toEqual({
      id: "c1",
      input: {
        name: "New",
      },
    });
    expect(notifyFieldSaved).toHaveBeenCalledWith("Name");
  });

  it("skips a no-op (value equal to last saved), including deep array equality", () => {
    const update = makeMutation();
    const {
      result,
    } = renderHook(() =>
      useFieldAutoSave<Fields>({
        id: "c1",
        update,
        labels,
        initial: {
          name: "Old",
          tagIds: ["a", "b"],
        },
      }));

    act(() => result.current.saveField("name", "Old"));
    act(() => result.current.saveField("tagIds", ["a", "b"]));

    expect(update.mutate).not.toHaveBeenCalled();
    expect(notifyFieldSaved).not.toHaveBeenCalled();
  });

  it("skips an invalid value without saving or toasting", () => {
    const update = makeMutation();
    const {
      result,
    } = renderHook(() =>
      useFieldAutoSave<Fields>({
        id: "c1",
        update,
        labels,
        initial: {
          name: "Old",
          tagIds: [],
        },
      }));

    act(() => result.current.saveField("name", "", {
      valid: false,
    }));

    expect(update.mutate).not.toHaveBeenCalled();
    expect(notifyFieldSaved).not.toHaveBeenCalled();
  });

  it("advances the saved snapshot so the same value isn't saved twice", () => {
    const update = makeMutation();
    const {
      result,
    } = renderHook(() =>
      useFieldAutoSave<Fields>({
        id: "c1",
        update,
        labels,
        initial: {
          name: "Old",
          tagIds: [],
        },
      }));

    act(() => result.current.saveField("name", "New"));
    act(() => result.current.saveField("name", "New"));

    expect(update.mutate).toHaveBeenCalledTimes(1);
  });

  it("fires a field-named error toast on failure and does not advance the snapshot", () => {
    const update = makeMutation("error");
    const {
      result,
    } = renderHook(() =>
      useFieldAutoSave<Fields>({
        id: "c1",
        update,
        labels,
        initial: {
          name: "Old",
          tagIds: [],
        },
      }));

    act(() => result.current.saveField("name", "New"));
    expect(notifyFieldSaveError).toHaveBeenCalledWith("Name", "boom");

    // Snapshot did not advance, so retrying the same value attempts the save again.
    act(() => result.current.saveField("name", "New"));
    expect(update.mutate).toHaveBeenCalledTimes(2);
  });

  it("forwards an onSuccess callback (e.g. slug-rename navigation)", () => {
    const update = makeMutation();
    const onSaved = vi.fn();
    const {
      result,
    } = renderHook(() =>
      useFieldAutoSave<Fields>({
        id: "c1",
        update,
        labels,
        initial: {
          name: "Old",
          tagIds: [],
        },
      }));

    act(() => result.current.saveField("name", "New", {
      onSuccess: onSaved,
    }));
    expect(onSaved).toHaveBeenCalledWith({
      name: "New",
    });
  });
});
