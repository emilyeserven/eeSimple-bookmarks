// @vitest-environment node
import type { ImageIntent } from "./bookmarkImageIntent";

import { describe, expect, it, vi } from "vitest";

import { applyImageIntent, promoteSourceDefaults } from "./bookmarkSubmit";

type PromoteParams = Parameters<typeof promoteSourceDefaults>;
type ImageParams = Parameters<typeof applyImageIntent>;

/** A `created` bookmark with the only fields `promoteSourceDefaults` reads. */
function created(opts: {
  websiteId?: string;
  channelId?: string;
} = {}): PromoteParams[0] {
  return {
    website: opts.websiteId
      ? {
        id: opts.websiteId,
      }
      : null,
    youtubeChannel: opts.channelId
      ? {
        id: opts.channelId,
      }
      : null,
  } as PromoteParams[0];
}

const NO_FLAGS: PromoteParams[4] = {
  setWebsiteCategory: false,
  setWebsiteTags: false,
  setWebsiteMediaType: false,
  setChannelCategory: false,
  setChannelTags: false,
};

function sourceMutations() {
  const updateWebsite = {
    mutate: vi.fn(),
  };
  const updateYouTubeChannel = {
    mutate: vi.fn(),
  };
  return {
    updateWebsite,
    updateYouTubeChannel,
    deps: {
      updateWebsite,
      updateYouTubeChannel,
    } as unknown as PromoteParams[5],
  };
}

describe("promoteSourceDefaults", () => {
  it("does nothing when no flags are set", () => {
    const m = sourceMutations();
    promoteSourceDefaults(created({
      websiteId: "w1",
      channelId: "c1",
    }), "cat", "mt", ["t1"], NO_FLAGS, m.deps);
    expect(m.updateWebsite.mutate).not.toHaveBeenCalled();
    expect(m.updateYouTubeChannel.mutate).not.toHaveBeenCalled();
  });

  it("promotes both category and tags to the website default", () => {
    const m = sourceMutations();
    promoteSourceDefaults(
      created({
        websiteId: "w1",
      }),
      "cat",
      "mt",
      ["t1", "t2"],
      {
        ...NO_FLAGS,
        setWebsiteCategory: true,
        setWebsiteTags: true,
      },
      m.deps,
    );
    expect(m.updateWebsite.mutate).toHaveBeenCalledWith({
      id: "w1",
      input: {
        categoryId: "cat",
        tagIds: ["t1", "t2"],
      },
    });
  });

  it("promotes the media type to the website default", () => {
    const m = sourceMutations();
    promoteSourceDefaults(
      created({
        websiteId: "w1",
      }),
      "cat",
      "mt",
      ["t1"],
      {
        ...NO_FLAGS,
        setWebsiteMediaType: true,
      },
      m.deps,
    );
    expect(m.updateWebsite.mutate).toHaveBeenCalledWith({
      id: "w1",
      input: {
        mediaTypeId: "mt",
      },
    });
  });

  it("promotes only the opted-in field (category, not tags)", () => {
    const m = sourceMutations();
    promoteSourceDefaults(
      created({
        websiteId: "w1",
      }),
      "cat",
      "mt",
      ["t1"],
      {
        ...NO_FLAGS,
        setWebsiteCategory: true,
      },
      m.deps,
    );
    expect(m.updateWebsite.mutate).toHaveBeenCalledWith({
      id: "w1",
      input: {
        categoryId: "cat",
      },
    });
  });

  it("maps an empty categoryId to null", () => {
    const m = sourceMutations();
    promoteSourceDefaults(
      created({
        websiteId: "w1",
      }),
      "",
      "mt",
      [],
      {
        ...NO_FLAGS,
        setWebsiteCategory: true,
      },
      m.deps,
    );
    expect(m.updateWebsite.mutate).toHaveBeenCalledWith({
      id: "w1",
      input: {
        categoryId: null,
      },
    });
  });

  it("skips promotion when the source has no id even though a flag is set", () => {
    const m = sourceMutations();
    promoteSourceDefaults(created(), "cat", "mt", ["t1"], {
      ...NO_FLAGS,
      setWebsiteTags: true,
    }, m.deps);
    expect(m.updateWebsite.mutate).not.toHaveBeenCalled();
  });

  it("promotes channel defaults independently of the website", () => {
    const m = sourceMutations();
    promoteSourceDefaults(
      created({
        channelId: "c1",
      }),
      "cat",
      "mt",
      ["t1"],
      {
        ...NO_FLAGS,
        setChannelCategory: true,
        setChannelTags: true,
      },
      m.deps,
    );
    expect(m.updateWebsite.mutate).not.toHaveBeenCalled();
    expect(m.updateYouTubeChannel.mutate).toHaveBeenCalledWith({
      id: "c1",
      input: {
        categoryId: "cat",
        tagIds: ["t1"],
      },
    });
  });
});

function imageMutations() {
  const autoImage = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  };
  const addImage = {
    mutateAsync: vi.fn().mockResolvedValue({
      id: "new-img",
    }),
  };
  const imagesFromCandidates = {
    mutateAsync: vi.fn().mockResolvedValue([]),
  };
  const setMainImage = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  };
  const deleteImageById = {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  };
  return {
    autoImage,
    addImage,
    imagesFromCandidates,
    setMainImage,
    deleteImageById,
    deps: {
      autoImage,
      addImage,
      imagesFromCandidates,
      setMainImage,
      deleteImageById,
    } as unknown as ImageParams[3],
  };
}

function intent(over: Partial<ImageIntent>): ImageIntent {
  return {
    uploads: [],
    keepCandidateUrls: [],
    mainSelection: null,
    removeImageIds: [],
    auto: false,
    ...over,
  };
}

describe("applyImageIntent", () => {
  it("uploads chosen files, marking the selected one main", async () => {
    const m = imageMutations();
    const file = new File(["x"], "x.png");
    await applyImageIntent("b1", "https://e.com", intent({
      uploads: [file],
      mainSelection: {
        kind: "upload",
        index: 0,
      },
    }), m.deps);
    expect(m.addImage.mutateAsync).toHaveBeenCalledWith({
      id: "b1",
      file,
      main: true,
    });
    expect(m.autoImage.mutateAsync).not.toHaveBeenCalled();
  });

  it("captures kept scan candidates with the chosen main URL", async () => {
    const m = imageMutations();
    await applyImageIntent("b1", "https://e.com", intent({
      keepCandidateUrls: ["https://e.com/a.jpg", "https://e.com/b.jpg"],
      mainSelection: {
        kind: "candidate",
        url: "https://e.com/b.jpg",
      },
    }), m.deps);
    expect(m.imagesFromCandidates.mutateAsync).toHaveBeenCalledWith({
      id: "b1",
      urls: ["https://e.com/a.jpg", "https://e.com/b.jpg"],
      mainUrl: "https://e.com/b.jpg",
    });
  });

  it("removes images and sets an existing main", async () => {
    const m = imageMutations();
    await applyImageIntent("b1", "https://e.com", intent({
      removeImageIds: ["old-1"],
      mainSelection: {
        kind: "existing",
        id: "keep-1",
      },
    }), m.deps);
    expect(m.deleteImageById.mutateAsync).toHaveBeenCalledWith({
      id: "b1",
      imageId: "old-1",
    });
    expect(m.setMainImage.mutateAsync).toHaveBeenCalledWith({
      id: "b1",
      imageId: "keep-1",
    });
  });

  it("falls back to auto-fetch when nothing is chosen", async () => {
    const m = imageMutations();
    await applyImageIntent("b1", "https://e.com", intent({
      auto: true,
    }), m.deps);
    expect(m.autoImage.mutateAsync).toHaveBeenCalledWith({
      id: "b1",
      sourceUrl: "https://e.com",
    });
  });

  it("does nothing for the empty intent", async () => {
    const m = imageMutations();
    await applyImageIntent("b1", "https://e.com", intent({}), m.deps);
    expect(m.addImage.mutateAsync).not.toHaveBeenCalled();
    expect(m.imagesFromCandidates.mutateAsync).not.toHaveBeenCalled();
    expect(m.autoImage.mutateAsync).not.toHaveBeenCalled();
    expect(m.deleteImageById.mutateAsync).not.toHaveBeenCalled();
  });

  it("skips the auto fallback once a candidate is kept", async () => {
    const m = imageMutations();
    await applyImageIntent("b1", "https://e.com", intent({
      keepCandidateUrls: ["https://e.com/a.jpg"],
      auto: true,
    }), m.deps);
    expect(m.imagesFromCandidates.mutateAsync).toHaveBeenCalledTimes(1);
    expect(m.autoImage.mutateAsync).not.toHaveBeenCalled();
  });

  it("swallows a mutation failure (image errors are non-fatal)", async () => {
    const m = imageMutations();
    m.autoImage.mutateAsync.mockRejectedValueOnce(new Error("boom"));
    await expect(
      applyImageIntent("b1", "https://e.com", intent({
        auto: true,
      }), m.deps),
    ).resolves.toBeUndefined();
  });
});
