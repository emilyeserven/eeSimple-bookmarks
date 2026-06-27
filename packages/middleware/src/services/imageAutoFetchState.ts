import type { AutoFetchJobStatus } from "@eesimple/types";

let _state: AutoFetchJobStatus = {
  status: "idle",
};

export function getAutoFetchJobStatus(): AutoFetchJobStatus {
  return _state;
}

export function setAutoFetchJobStatus(state: AutoFetchJobStatus): void {
  _state = state;
}

let _screenshotFallbackState: AutoFetchJobStatus = {
  status: "idle",
};

export function getScreenshotFallbackJobStatus(): AutoFetchJobStatus {
  return _screenshotFallbackState;
}

export function setScreenshotFallbackJobStatus(state: AutoFetchJobStatus): void {
  _screenshotFallbackState = state;
}
