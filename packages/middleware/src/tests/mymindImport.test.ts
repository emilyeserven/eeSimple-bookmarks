import assert from "node:assert/strict";
import { test } from "node:test";

import { matchMymindMediaType, MymindTagResolver } from "@/services/mymindImport";

function fakeCreate() {
  const created: { name: string;
    parentId: string | null; }[] = [];
  const create = async (name: string, parentId: string | null) => {
    created.push({
      name,
      parentId,
    });
    return `new-${created.length}`;
  };
  return {
    created,
    create,
  };
}

test("MymindTagResolver matches existing tags case-insensitively and creates missing ones once", async () => {
  const {
    created, create,
  } = fakeCreate();
  const resolver = new MymindTagResolver([{
    id: "t1",
    name: "Design",
    parentId: null,
  }], false, create);
  const ids = await resolver.resolveAll(["design", "typography", "Typography", "des: Studio"]);
  assert.deepEqual(ids, ["t1", "new-1", "new-2"]);
  assert.deepEqual(created, [{
    name: "typography",
    parentId: null,
  }, {
    name: "des: Studio",
    parentId: null,
  }]);
  assert.equal(resolver.createdCount, 2);
});

test("MymindTagResolver nests prefixed tags under a root prefix tag", async () => {
  const {
    created, create,
  } = fakeCreate();
  const resolver = new MymindTagResolver([{
    id: "root-des",
    name: "des",
    parentId: null,
  }, {
    id: "child-a",
    name: "Studio A",
    parentId: "root-des",
  }], true, create);
  assert.equal(await resolver.resolve("des: studio a"), "child-a");
  assert.equal(await resolver.resolve("des: Studio B"), "new-1");
  assert.equal(await resolver.resolve("org: Acme"), "new-3");
  assert.equal(await resolver.resolve("org: Acme"), "new-3");
  assert.deepEqual(created, [{
    name: "Studio B",
    parentId: "root-des",
  }, {
    name: "org",
    parentId: null,
  }, {
    name: "Acme",
    parentId: "new-2",
  }]);
});

test("MymindTagResolver prefers a root tag for a plain name shared with a nested tag", async () => {
  const resolver = new MymindTagResolver([{
    id: "nested",
    name: "logo",
    parentId: "p",
  }, {
    id: "root",
    name: "Logo",
    parentId: null,
  }], true, fakeCreate().create);
  assert.equal(await resolver.resolve("logo"), "root");
});

test("matchMymindMediaType matches by name/alias and skips hidden types", () => {
  const types = [{
    id: "video",
    name: "Video",
    hidden: null,
  }, {
    id: "article",
    name: "article",
    hidden: false,
  }, {
    id: "image",
    name: "Image",
    hidden: true,
  }];
  assert.equal(matchMymindMediaType("Article", types), "article");
  assert.equal(matchMymindMediaType("YouTubeVideo", types), "video");
  assert.equal(matchMymindMediaType("Image", types), null);
  assert.equal(matchMymindMediaType("Recipe", types), null);
});
