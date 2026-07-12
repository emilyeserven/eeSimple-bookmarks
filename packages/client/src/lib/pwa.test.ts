// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// `lib/pwa` imports the Vite-provided `virtual:pwa-register` module; stub it so this pure-logic test
// doesn't depend on the PWA plugin being active under vitest.
vi.mock("virtual:pwa-register", () => ({
  registerSW: () => () => Promise.resolve(),
}));

const {
  classifyUpdateCheck,
} = await import("./pwa");

function reg(parts: Partial<ServiceWorkerRegistration>): ServiceWorkerRegistration {
  return parts as ServiceWorkerRegistration;
}

describe("classifyUpdateCheck", () => {
  it("returns 'unsupported' when there is no registration", () => {
    expect(classifyUpdateCheck(undefined)).toBe("unsupported");
  });

  it("returns 'up-to-date' when no new worker is installing or waiting", () => {
    expect(classifyUpdateCheck(reg({
      installing: null,
      waiting: null,
    }))).toBe("up-to-date");
  });

  it("returns 'updating' when a new worker is installing", () => {
    expect(classifyUpdateCheck(reg({
      installing: {} as ServiceWorker,
      waiting: null,
    }))).toBe("updating");
  });

  it("returns 'updating' when a new worker is waiting", () => {
    expect(classifyUpdateCheck(reg({
      installing: null,
      waiting: {} as ServiceWorker,
    }))).toBe("updating");
  });
});
