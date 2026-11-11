import "../lib/injectedGlobals";

import { defineUnlistedScript } from "wxt/utils/define-unlisted-script";

import { start, teardown } from "../lib/picker/pickerOverlay";

/**
 * Injected into the page by the popup's "Find a selector" button, which then calls
 * `globalThis.eesimpleSelectorPicker.start()`.
 */
export default defineUnlistedScript(() => {
  globalThis.eesimpleSelectorPicker = {
    start,
    teardown,
  };
});
