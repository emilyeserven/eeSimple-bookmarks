import type { AutoFetchJobStatus } from "@eesimple/types";

let _state: AutoFetchJobStatus = {
  status: "idle",
};

export function getChannelImageAutoFetchJobStatus(): AutoFetchJobStatus {
  return _state;
}

export function setChannelImageAutoFetchJobStatus(state: AutoFetchJobStatus): void {
  _state = state;
}
