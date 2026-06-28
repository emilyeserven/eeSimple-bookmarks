import type { Publisher } from "@eesimple/types";

import { UserCircle } from "lucide-react";

import { useAuthors, useUpdateAuthor } from "../hooks/useAuthors";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { toggleId } from "../lib/tag-utils";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
  publisher: Publisher;
}

/** Association tab: pick which authors are connected to this publisher. Auto-saves on toggle. */
export function PublisherAuthorsForm({
  publisher,
}: Props) {
  const {
    data: authors,
  } = useAuthors();
  const update = useUpdateAuthor();

  return (
    <div className="space-y-3">
      {(authors ?? []).length === 0
        ? <p className="text-sm text-muted-foreground">No authors exist yet.</p>
        : (
          <ul className="space-y-2">
            {(authors ?? []).map(author => (
              <li
                key={author.id}
                className="flex items-center gap-2"
              >
                <Checkbox
                  id={`author-${author.id}`}
                  checked={author.publisherIds.includes(publisher.id)}
                  onCheckedChange={() =>
                    update.mutate(
                      {
                        id: author.id,
                        input: {
                          publisherIds: toggleId(author.publisherIds, publisher.id),
                        },
                      },
                      {
                        onSuccess: () => notifyFieldSaved("Authors"),
                        onError: error => notifyFieldSaveError("Authors", describeError(error)),
                      },
                    )}
                />
                {author.imageUrl
                  ? (
                    <img
                      src={author.imageUrl}
                      alt=""
                      className="size-5 rounded-full object-cover"
                    />
                  )
                  : (
                    <UserCircle
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                <Label
                  htmlFor={`author-${author.id}`}
                  className="cursor-pointer font-normal"
                >
                  {author.name}
                </Label>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}

/** Read-only view of connected authors. */
export function PublisherAuthorsView({
  publisher,
}: Props) {
  const {
    data: authors,
  } = useAuthors();
  const connected = (authors ?? []).filter(a => a.publisherIds.includes(publisher.id));

  if (connected.length === 0) {
    return <p className="text-sm text-muted-foreground">No authors connected.</p>;
  }

  return (
    <ul className="space-y-2">
      {connected.map(author => (
        <li
          key={author.id}
          className="flex items-center gap-2 text-sm"
        >
          {author.imageUrl
            ? (
              <img
                src={author.imageUrl}
                alt=""
                className="size-5 rounded-full object-cover"
              />
            )
            : <UserCircle className="size-4 shrink-0 text-muted-foreground" />}
          {author.name}
        </li>
      ))}
    </ul>
  );
}
