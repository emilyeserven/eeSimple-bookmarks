// @vitest-environment node
import { youtubeEmbedUrl } from "@eesimple/types";
import { describe, expect, it } from "vitest";

describe("youtubeEmbedUrl", () => {
  it("builds a nocookie embed URL for recognizable YouTube videos", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(youtubeEmbedUrl("https://youtube.com/shorts/dQw4w9WgXcQ"))
      .toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("returns null for non-YouTube or malformed URLs", () => {
    expect(youtubeEmbedUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=tooShort")).toBeNull();
    expect(youtubeEmbedUrl("not a url")).toBeNull();
  });
});
