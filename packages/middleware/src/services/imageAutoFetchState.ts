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
