import { useEffect } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useUiStore } from "../stores/uiStore";

export const Route = createFileRoute("/inbox/new")({
  validateSearch: (search: Record<string, unknown>): { newsletterId?: string } => ({
    newsletterId: typeof search.newsletterId === "string" ? search.newsletterId : undefined,
  }),
  component: InboxNewRedirect,
});

/** Redirect legacy /inbox/new links to /inbox and open the Add Import modal. */
function InboxNewRedirect() {
  const {
    newsletterId,
  } = Route.useSearch();
  const navigate = useNavigate();
  const setOpen = useUiStore(s => s.setAddImportModalOpen);
  const setInitialId = useUiStore(s => s.setImportModalInitialNewsletterId);

  useEffect(() => {
    if (newsletterId) setInitialId(newsletterId);
    setOpen(true);
    void navigate({
      to: "/inbox",
      replace: true,
    });
  // One-shot redirect that navigates away immediately; it must run exactly once on mount, so the
  // dep array stays empty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
