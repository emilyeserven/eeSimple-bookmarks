import type { Publisher } from "@eesimple/types";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreatePublisher } from "../hooks/usePublishers";

interface AddPublisherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created publisher so the opener can navigate to it. */
  onCreated?: (publisher: Publisher) => void;
}

/** Minimal name-only modal to create a publisher inline. */
export function AddPublisherModal({
  open, onOpenChange, onCreated,
}: AddPublisherModalProps) {
  const createPublisher = useCreatePublisher();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title="New publisher"
      description="Give the publisher a name — you can fill in the rest from its edit page."
      placeholder="e.g. Penguin Random House"
      submitLabel="Add publisher"
      isError={createPublisher.isError}
      errorMessage={createPublisher.error?.message}
      onSubmit={(name, done) => {
        createPublisher.mutate(
          {
            name,
          },
          {
            onSuccess: (publisher) => {
              onCreated?.(publisher);
              done();
            },
          },
        );
      }}
    />
  );
}
