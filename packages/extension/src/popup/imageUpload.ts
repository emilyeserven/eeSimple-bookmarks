import { postForm } from "./api";

/*
 * Download an image in the browser and upload its bytes to the server. The download goes straight to
 * the image's host, so the popup needs host access there — `apply.ts` requests it on the Apply click.
 */

async function fetchImageBlob(url: string): Promise<Blob | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const blob = await res.blob();
  return blob.size > 0 ? blob : null;
}

/** Upload the image at `url` to `uploadPath` (a multipart `file` field). True on success. */
export async function uploadImageFromUrl(url: string, uploadPath: string): Promise<boolean> {
  try {
    const blob = await fetchImageBlob(url);
    if (!blob) return false;
    const form = new FormData();
    form.append("file", blob, "image");
    const res = await postForm(uploadPath, form);
    return res.ok;
  }
  catch {
    return false;
  }
}
