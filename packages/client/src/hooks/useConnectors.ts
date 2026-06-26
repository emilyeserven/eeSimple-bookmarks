import { useQuery } from "@tanstack/react-query";

import { connectorsApi } from "../lib/api/connectors";

const CONNECTORS_KEY = ["connectors"] as const;

/** Live status of the optional/gated metadata connectors, for the Connectors settings page. */
export function useConnectors() {
  return useQuery({
    queryKey: CONNECTORS_KEY,
    queryFn: connectorsApi.getStatus,
  });
}
