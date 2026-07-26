import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";

import { SETTINGS_FORM_AUTOSAVE_DELAY_MS, useDebouncedSettingsForm } from "./useDebouncedSettingsForm";

interface Settings {
  a: string;
  b: number;
}

const defaults: Settings = {
  a: "",
  b: 0,
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(initial: { data?: Settings;
  isLoading?: boolean; } = {}) {
  const mutate = vi.fn();
  const update = {
    mutate,
  };
  const view = renderHook(
    ({
      data, isLoading,
    }: { data?: Settings;
      isLoading: boolean; }) =>
      useDebouncedSettingsForm({
        data,
        isLoading,
        update,
        defaults,
      }),
    {
      initialProps: {
        data: initial.data,
        isLoading: initial.isLoading ?? true,
      },
    },
  );
  return {
    view,
    mutate,
  };
}

describe("useDebouncedSettingsForm", () => {
  it("returns the defaults and passes isLoading through until data arrives", () => {
    const {
      view,
    } = setup({
      isLoading: true,
    });
    expect(view.result.current.form).toEqual(defaults);
    expect(view.result.current.isLoading).toBe(true);
  });

  it("seeds the form from the server data once it loads", () => {
    const {
      view,
    } = setup();
    act(() => {
      view.rerender({
        data: {
          a: "hi",
          b: 3,
        },
        isLoading: false,
      });
    });
    expect(view.result.current.form).toEqual({
      a: "hi",
      b: 3,
    });
    expect(view.result.current.isLoading).toBe(false);
  });

  it("does not auto-save an edit made before the form is seeded", () => {
    const {
      view, mutate,
    } = setup();
    act(() => {
      view.result.current.patchForm({
        a: "early",
      });
    });
    act(() => {
      vi.advanceTimersByTime(SETTINGS_FORM_AUTOSAVE_DELAY_MS + 10);
    });
    expect(mutate).not.toHaveBeenCalled();
    // The local form still reflects the edit — only the save is withheld.
    expect(view.result.current.form.a).toBe("early");
  });

  it("merges a patch and debounce-saves the whole form after the delay", () => {
    const {
      view, mutate,
    } = setup();
    act(() => {
      view.rerender({
        data: {
          a: "seed",
          b: 1,
        },
        isLoading: false,
      });
    });
    act(() => {
      view.result.current.patchForm({
        b: 42,
      });
    });
    expect(view.result.current.form).toEqual({
      a: "seed",
      b: 42,
    });

    act(() => {
      vi.advanceTimersByTime(SETTINGS_FORM_AUTOSAVE_DELAY_MS - 1);
    });
    expect(mutate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      a: "seed",
      b: 42,
    });
  });

  it("restarts the timer on each edit, saving only once with the latest values", () => {
    const {
      view, mutate,
    } = setup();
    act(() => {
      view.rerender({
        data: {
          a: "seed",
          b: 0,
        },
        isLoading: false,
      });
    });
    act(() => {
      view.result.current.patchForm({
        a: "one",
      });
      vi.advanceTimersByTime(500);
      view.result.current.patchForm({
        a: "two",
      });
      vi.advanceTimersByTime(500);
    });
    // 1000ms after the first edit but only 500ms after the last — nothing saved yet.
    expect(mutate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(SETTINGS_FORM_AUTOSAVE_DELAY_MS);
    });
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      a: "two",
      b: 0,
    });
  });
});
