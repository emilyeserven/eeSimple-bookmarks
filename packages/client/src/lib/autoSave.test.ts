// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyFieldSaved, notifyFieldSaveError } from "./autoSave";
import { notifyError, notifySuccess, resetToastSpies } from "../test-utils/toastSpies";

vi.mock("./notifications", async () => await import("../test-utils/toastSpies"));

describe("autoSave notifications", () => {
  beforeEach(() => {
    resetToastSpies();
  });

  it("fires a field-referencing success toast", () => {
    notifyFieldSaved("Name");
    expect(notifySuccess).toHaveBeenCalledWith("Updated Name");
  });

  it("fires a field-referencing error toast including the cause", () => {
    notifyFieldSaveError("Description", "network down");
    expect(notifyError).toHaveBeenCalledWith("Couldn't save Description: network down");
  });

  it("fires a bare field error toast when no cause is given", () => {
    notifyFieldSaveError("Icon");
    expect(notifyError).toHaveBeenCalledWith("Couldn't save Icon");
  });
});
