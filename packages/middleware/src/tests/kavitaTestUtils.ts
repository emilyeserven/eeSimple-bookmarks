/** Shared helpers for the Kavita connector tests (env-var config + sequenced `global.fetch` stub). */

export const KAVITA_ENV_KEYS = ["KAVITA_ENDPOINT", "KAVITA_API_KEY"];

/** Point the connector at a fake server via env vars (the DB is unavailable in tests). */
export function configureKavitaEnv(): void {
  process.env.KAVITA_ENDPOINT = "http://kavita:5000";
  process.env.KAVITA_API_KEY = "secret-key";
}

/** Remove the fake config again (call from `afterEach`). */
export function clearKavitaEnv(): void {
  for (const k of KAVITA_ENV_KEYS) delete process.env[k];
}

export interface RecordedRequest {
  url: string;
  init?: RequestInit;
}

/**
 * Stub `global.fetch` to answer each call from a queue of responses (the last one repeats), while
 * recording every request. Returns the recorded requests and a restore fn.
 */
export function stubFetchSequence(
  responses: { status: number;
    body?: string | ArrayBuffer;
    headers?: Record<string, string>; }[],
): { requests: RecordedRequest[];
  restore: () => void; } {
  const original = global.fetch;
  const requests: RecordedRequest[] = [];
  let index = 0;
  global.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({
      url: String(input),
      init,
    });
    const spec = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return new Response(spec.body ?? null, {
      status: spec.status,
      headers: spec.headers,
    });
  }) as typeof global.fetch;
  return {
    requests,
    restore: () => {
      global.fetch = original;
    },
  };
}
