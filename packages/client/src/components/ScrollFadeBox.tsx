import type { ReactNode } from "react";

import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollFadeBoxProps {
  /**
   * The number of items rendered inside, used to re-check the scroll position whenever the list
   * grows or shrinks (so the top/bottom fade overlays appear/disappear correctly).
   */
  itemCount: number;
  /** The `<li>` items shown inside the scrollable list. */
  children: ReactNode;
}

/**
 * A fixed-height, scrollable `<ul>` with top/bottom fade overlays that appear only when there is more
 * content to scroll to in that direction. Shared by {@link BookmarkTagsBox} and
 * {@link BookmarkLocationsBox} (and any other bookmark badge list that overflows its card slot).
 */
export function ScrollFadeBox({
  itemCount, children,
}: ScrollFadeBoxProps) {
  const ref = useRef<HTMLUListElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setShowTop(el.scrollTop > 0);
    setShowBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }, []);

  useEffect(() => {
    sync();
  }, [itemCount, sync]);

  return (
    <div className="relative mt-2">
      <ul
        ref={ref}
        onScroll={sync}
        className="
          flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-md border p-1
        "
      >
        {children}
      </ul>
      {showTop
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 top-0 h-5 rounded-t-md
              bg-linear-to-b from-card to-transparent
            "
          />
        )
        : null}
      {showBottom
        ? (
          <div
            className="
              pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-md
              bg-linear-to-t from-card to-transparent
            "
          />
        )
        : null}
    </div>
  );
}
