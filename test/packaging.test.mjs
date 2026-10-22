import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
test("Marketplace README images avoid disallowed user-provided SVG URLs", async () => {
  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  for (const [, url] of readme.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    if (url.startsWith("https://img.shields.io/")) continue;
    assert.doesNotMatch(url, /\.svg(?:[?#]|$)/i);
  }
  const ignore = await readFile(new URL("../.vscodeignore", import.meta.url), "utf8");
  assert.ok(ignore.split("\n").includes("publication.json"));
});
