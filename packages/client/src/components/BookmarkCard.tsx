import type { Bookmark } from "@eesimple/types";

import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}

export function BookmarkCard({
  bookmark, onDelete,
}: BookmarkCardProps) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-1 font-semibold">
              {bookmark.favorite
                ? (
                  <Star
                    aria-label="Favorite"
                    className="size-4 fill-current text-yellow-500"
                  />
                )
                : null}
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="
                  truncate text-primary
                  hover:underline
                "
              >
                {bookmark.title}
              </a>
            </h3>
            <p className="truncate text-sm text-muted-foreground">{bookmark.url}</p>
          </div>
          {onDelete
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(bookmark.id)}
                className="
                  text-destructive
                  hover:text-destructive
                "
              >
                Delete
              </Button>
            )
            : null}
        </div>
        {bookmark.description ? <p className="mt-2 text-sm text-foreground">{bookmark.description}</p> : null}
        {bookmark.tags.length > 0
          ? (
            <ul className="mt-2 flex flex-wrap gap-1">
              {bookmark.tags.map(tag => (
                <li key={tag.id}>
                  <Badge variant="secondary">{tag.name}</Badge>
                </li>
              ))}
            </ul>
          )
          : null}
      </CardContent>
    </Card>
  );
}
