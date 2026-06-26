import type { ConnectorsStatus } from "@eesimple/types";

import { request } from "./client";

export const connectorsApi = {
  /** Live status of the optional/gated metadata connectors (no secrets — booleans + provider name). */
  getStatus: () => request<ConnectorsStatus>("/connectors"),
};
