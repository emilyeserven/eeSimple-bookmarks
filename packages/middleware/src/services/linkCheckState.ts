import type { AutoFetchJobStatus } from "@eesimple/types";

let _state: AutoFetchJobStatus = {
  status: "idle",
};

export function getLinkCheckJobStatus(): AutoFetchJobStatus {
  return _state;
}

export function setLinkCheckJobStatus(state: AutoFetchJobStatus): void {
  _state = state;
}
