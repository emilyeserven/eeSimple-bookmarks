import { TriangleAlert } from "lucide-react";

interface BookmarkUrlResolveFeedbackProps {
  error: string;
}

/** Shown below the URL field when redirect-following failed during a URL scan. */
export function BookmarkUrlResolveFeedback({
  error,
}: BookmarkUrlResolveFeedbackProps) {
  return (
    <div
      className="
        flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm
        text-amber-800
        dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300
      "
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="font-medium">Couldn&apos;t follow this redirect</p>
        <p>{error}</p>
        <p
          className="
            text-amber-700
            dark:text-amber-400
          "
        >
          Edit the URL field above to replace it with the final destination link.
        </p>
      </div>
    </div>
  );
}
