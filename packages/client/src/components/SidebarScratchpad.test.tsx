import type { ScratchpadSettings, UpdateScratchpadInput } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarScratchpad } from "./SidebarScratchpad";
import { renderWithRouter } from "../test-utils/router";

import { SidebarProvider } from "@/components/ui/sidebar";

const updateMutate = vi.fn<(input: UpdateScratchpadInput) => void>();
let scratchpad: ScratchpadSettings = {
  scratchpadText: "",
};

vi.mock("../hooks/useAppSettings", () => ({
  useScratchpadSettings: () => ({
    data: scratchpad,
  }),
  useUpdateScratchpadSettings: () => ({
    mutate: (input: UpdateScratchpadInput) => updateMutate(input),
  }),
}));

function renderScratchpad() {
  return renderWithRouter(
    <SidebarProvider>
      <SidebarScratchpad />
    </SidebarProvider>,
  );
}

describe("SidebarScratchpad", () => {
  beforeEach(() => {
    updateMutate.mockReset();
    scratchpad = {
      scratchpadText: "Hello **note**",
    };
  });

  it("expands to show the note as rendered Markdown", async () => {
    const {
      container,
    } = await renderScratchpad();

    // Collapsed by default — no rendered content yet.
    expect(container.querySelector("strong")).toBeNull();

    fireEvent.click(screen.getByRole("button", {
      name: "Scratchpad",
    }));

    await waitFor(() => {
      const strong = container.querySelector("strong");
      expect(strong?.textContent).toBe("note");
    });
    // Read mode has no editing textarea.
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("swaps to a mono textarea seeded with the raw Markdown when editing, and saves on blur", async () => {
    await renderScratchpad();

    fireEvent.click(screen.getByRole("button", {
      name: "Scratchpad",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "Edit notes",
    }));

    const textarea = await screen.findByRole("textbox");
    expect(textarea).toHaveValue("Hello **note**");
    expect(textarea.className).toContain("font-mono");

    fireEvent.change(textarea, {
      target: {
        value: "Updated notes",
      },
    });
    fireEvent.blur(textarea);

    expect(updateMutate).toHaveBeenCalledWith({
      scratchpadText: "Updated notes",
    });
  });

  it("does not save on blur when the note is unchanged", async () => {
    await renderScratchpad();

    fireEvent.click(screen.getByRole("button", {
      name: "Scratchpad",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "Edit notes",
    }));
    fireEvent.blur(await screen.findByRole("textbox"));

    expect(updateMutate).not.toHaveBeenCalled();
  });
});
