import type { Bookmark } from "@eesimple/types";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete?: (id: string) => void;
}

export function BookmarkCard({
  bookmark, onDelete,
}: BookmarkCardProps) {
  return (
    <article
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1 font-semibold">
            {bookmark.favorite
              ? (
                <span
                  aria-label="Favorite"
                  title="Favorite"
                >★
                </span>
              )
              : null}
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="
                truncate text-blue-600
                hover:underline
              "
            >
              {bookmark.title}
            </a>
          </h3>
          <p className="truncate text-sm text-slate-500">{bookmark.url}</p>
        </div>
        {onDelete
          ? (
            <button
              type="button"
              onClick={() => onDelete(bookmark.id)}
              className="
                text-sm text-red-600
                hover:underline
              "
            >
              Delete
            </button>
          )
          : null}
      </div>
      {bookmark.description ? <p className="mt-2 text-sm text-slate-700">{bookmark.description}</p> : null}
      {bookmark.tags.length > 0
        ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {bookmark.tags.map(tag => (
              <li
                key={tag.id}
                className="
                  rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600
                "
              >
                {tag.name}
              </li>
            ))}
          </ul>
        )
        : null}
    </article>
  );
}
