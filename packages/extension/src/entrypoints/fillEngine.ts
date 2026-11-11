import "../lib/injectedGlobals";

import { defineUnlistedScript } from "wxt/utils/define-unlisted-script";

import { runRules } from "../lib/fill/fillEngine";

/**
 * Injected into the page by the popup (`executeScript({ files: ["/fillEngine.js"] })`), then driven by
 * a second `executeScript({ func })` that calls `globalThis.eesimpleFillEngine.runRules(rules)`.
 */
export default defineUnlistedScript(() => {
  globalThis.eesimpleFillEngine = {
    runRules,
  };
});
