import { useEffect, useState } from "react";

/**
 * The trailing-edge debounced copy of `value`: updates `delayMs` after the last change. Used to
 * keep the header quick-search from firing a server request per keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
