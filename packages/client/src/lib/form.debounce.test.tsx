import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppForm } from "./form";

// Verifies the `debounceSave` opt-in on the shared text primitives: a text/textarea field debounces
// its `onBlur` save handler while typing, blur flushes it immediately, and without the flag the field
// keeps the old blur-only behavior. Fake timers drive the 700ms debounce deterministically.

function TextHarness({
  onSave,
  debounceSave,
}: {
  onSave: () => void;
  debounceSave?: boolean;
}) {
  const form = useAppForm({
    defaultValues: {
      name: "",
    },
  });
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label="Name"
          onBlur={onSave}
          debounceSave={debounceSave}
        />
      )}
    </form.AppField>
  );
}

function TextareaHarness({
  onSave,
}: {
  onSave: () => void;
}) {
  const form = useAppForm({
    defaultValues: {
      description: "",
    },
  });
  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label="Description"
          onBlur={onSave}
          debounceSave
        />
      )}
    </form.AppField>
  );
}

describe("debounceSave on text primitives", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("does not save on mount", () => {
    const onSave = vi.fn();
    render(
      <TextHarness
        onSave={onSave}
        debounceSave
      />,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves once after typing settles for the debounce interval", () => {
    const onSave = vi.fn();
    render(
      <TextHarness
        onSave={onSave}
        debounceSave
      />,
    );
    const input = screen.getByLabelText("Name");

    fireEvent.change(input, {
      target: {
        value: "a",
      },
    });
    fireEvent.change(input, {
      target: {
        value: "ab",
      },
    });
    // Still within the debounce window — no save yet.
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onSave).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("flushes immediately on blur and does not double-fire afterward", () => {
    const onSave = vi.fn();
    render(
      <TextHarness
        onSave={onSave}
        debounceSave
      />,
    );
    const input = screen.getByLabelText("Name");

    fireEvent.change(input, {
      target: {
        value: "typed",
      },
    });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledTimes(1);

    // The pending debounce timer was cancelled by blur, so nothing fires later.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("without debounceSave, a text field saves only on blur (not while typing)", () => {
    const onSave = vi.fn();
    render(<TextHarness onSave={onSave} />);
    const input = screen.getByLabelText("Name");

    fireEvent.change(input, {
      target: {
        value: "typed",
      },
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("debounces a textarea field the same way", () => {
    const onSave = vi.fn();
    render(<TextareaHarness onSave={onSave} />);
    const input = screen.getByLabelText("Description");

    fireEvent.change(input, {
      target: {
        value: "notes",
      },
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
