// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { notifyFieldSaved, notifyFieldSaveError } from "./autoSave";

const notifySuccess = vi.fn<(message: string) => void>();
const notifyError = vi.fn<(message: string) => void>();

vi.mock("./notifications", () => ({
  notifySuccess: (message: string) => notifySuccess(message),
  notifyError: (message: string) => notifyError(message),
}));

describe("autoSave notifications", () => {
  beforeEach(() => {
    notifySuccess.mockReset();
    notifyError.mockReset();
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
