import { afterEach, describe, expect, it, vi } from "vitest";

import { openBasketTabs } from "./openBasketTabs";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("openBasketTabs", () => {
  it("opens each url in a new noopener/noreferrer tab via an anchor click, in order", () => {
    const clicked: { href: string;
      target: string;
      rel: string; }[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({
        href: this.href,
        target: this.target,
        rel: this.rel,
      });
    });

    openBasketTabs(["https://a.example/", "https://b.example/"]);

    expect(clicked).toEqual([
      {
        href: "https://a.example/",
        target: "_blank",
        rel: "noopener noreferrer",
      },
      {
        href: "https://b.example/",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    ]);
    // The temporary anchors are cleaned up after clicking.
    expect(document.querySelectorAll("a")).toHaveLength(0);
  });

  it("does nothing for an empty list", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click");

    openBasketTabs([]);

    expect(click).not.toHaveBeenCalled();
  });
});
