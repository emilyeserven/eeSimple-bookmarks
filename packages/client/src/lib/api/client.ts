import { ApiError } from "../apiError";

const BASE = "/api";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(init?.body != null && {
        "Content-Type": "application/json",
      }),
    },
    ...init,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
    };
    throw new ApiError(body.message ?? `Request failed with ${res.status}`, body.code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Image uploads go through FormData, not the JSON `request` helper, so the browser sets the
// multipart boundary itself. Shared by the bookmark, website-favicon, and channel-avatar uploads.
export async function uploadImageFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(body.message ?? `Upload failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export function createCrudApi<T, C, U>(endpoint: string) {
  return {
    list: () => request<T[]>(`/${endpoint}`),
    create: (input: C) =>
      request<T>(`/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: U) =>
      request<T>(`/${endpoint}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<undefined>(`/${endpoint}/${id}`, {
        method: "DELETE",
      }),
  };
}
