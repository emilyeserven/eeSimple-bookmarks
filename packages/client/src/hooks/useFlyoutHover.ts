import { useRef, useState } from "react";

/** Open/close state with a debounced close, so moving between the trigger and the popover keeps it open. */
export function useFlyoutHover() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }
  return {
    open,
    setOpen,
    openNow: () => {
      cancelClose();
      setOpen(true);
    },
    closeSoon: () => {
      cancelClose();
      closeTimer.current = setTimeout(() => setOpen(false), 150);
    },
  };
}
