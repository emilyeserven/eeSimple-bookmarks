import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderKavitaFieldSyncHint } from "./KavitaFieldSyncHint";

describe("renderKavitaFieldSyncHint", () => {
  it("returns null when the local and Kavita values match", () => {
    expect(renderKavitaFieldSyncHint("name", "Berserk", "Berserk")).toBeNull();
  });

  it("returns null while the Kavita value is still loading (undefined)", () => {
    expect(renderKavitaFieldSyncHint("name", "Berserk", undefined)).toBeNull();
  });

  it("returns null when the Kavita value is unavailable (null)", () => {
    expect(renderKavitaFieldSyncHint("release year", 1989, null)).toBeNull();
  });

  it("renders a warning icon with the Kavita value in its tooltip when they differ", () => {
    const element = renderKavitaFieldSyncHint("name", "Berserk", "Berserk Deluxe Edition");
    expect(element).not.toBeNull();
    render(element);
    expect(screen.getByRole("button", {
      name: "Out of sync with Kavita name",
    })).toBeInTheDocument();
  });
});
