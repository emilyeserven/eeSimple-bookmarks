import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useViewportWidth() {
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const onChange = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onChange);
    setWidth(window.innerWidth);
    return () => window.removeEventListener("resize", onChange);
  }, []);

  return width ?? 1024;
}
