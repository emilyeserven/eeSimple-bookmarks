import type { ActiveReelArchiveJob, ReelArchiveJob } from "@eesimple/types";

import { request } from "./client";

/** Reel-archive background-job status, polled by the header progress indicator. */
export const reelArchiveApi = {
  /** The reel-archive jobs currently queued/processing. */
  listActive: () => request<ActiveReelArchiveJob[]>("/reel-archive/active"),
  /** One job's full record, used to resolve a completion toast once it leaves the active set. */
  getJob: (id: string) => request<ReelArchiveJob>(`/reel-archive/${id}`),
};
