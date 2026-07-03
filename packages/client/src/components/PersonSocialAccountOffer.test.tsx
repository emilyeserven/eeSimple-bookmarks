import type { SocialAccountRef } from "@eesimple/types";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PersonSocialAccountOffer } from "./PersonSocialAccountOffer";

const account: SocialAccountRef = {
  platform: "instagram",
  handle: "janedoe",
  profileUrl: "https://instagram.com/janedoe",
};

describe("PersonSocialAccountOffer", () => {
  it("renders nothing when there is no account", () => {
    const {
      container,
    } = render(
      <PersonSocialAccountOffer
        account={null}
        onCreate={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the platform + handle and fires onCreate", () => {
    const onCreate = vi.fn();
    render(
      <PersonSocialAccountOffer
        account={account}
        onCreate={onCreate}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText("Instagram")).toBeInTheDocument();
    expect(screen.getByText("@janedoe")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: /create person/i,
    }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when dismissed", () => {
    const onDismiss = vi.fn();
    render(
      <PersonSocialAccountOffer
        account={account}
        onCreate={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole("button", {
      name: /dismiss/i,
    }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
