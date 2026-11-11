import type { runRules } from "./fill/fillEngine";
import type { start, teardown } from "./picker/pickerOverlay";

/*
 * The globals the two injected unlisted scripts (`/fillEngine.js`, `/selectorPicker.js`) define in the
 * page's isolated world. The popup injects a script file, then calls these through a second
 * `executeScript({ func })` — a `func` is serialized, so it can only reach page globals, not imports.
 */

export interface InjectedFillEngine {
  runRules: typeof runRules;
}

export interface InjectedSelectorPicker {
  start: typeof start;
  teardown: typeof teardown;
}

declare global {

  var eesimpleFillEngine: InjectedFillEngine | undefined;

  var eesimpleSelectorPicker: InjectedSelectorPicker | undefined;
}
