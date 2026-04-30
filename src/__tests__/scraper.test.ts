import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scrapeSetlist } from "../scraper.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe.each(!process.env.TEST_ONLINE ? [true] : [true, false])("scrapeSetlist", (useMock) => {
  const url =
    "https://www.setlist.fm/setlist/florence-the-machine/2026/madison-square-garden-new-york-ny-5b4f73c8.html";
  const mockHtml = readFileSync(join(__dirname, "scraper.florence.html"), "utf-8");

  beforeEach(() => {
    if (useMock) {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            text: () => Promise.resolve(mockHtml),
          }),
        ),
      );
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fetch and extract data correctly", async () => {
    const result = await scrapeSetlist(url);

    expect(result.artist).toBe("Florence + the Machine");
    expect(result.venue).toBe("Madison Square Garden");
    expect(result.date).toBe("2026-04-22");
    expect(result.songs).toEqual([
      "Everybody Scream",
      "Witch Dance",
      "Shake It Out",
      "Seven Devils",
      "Big God",
      "Daffodil",
      "Which Witch",
      "Cosmic Love",
      "Spectrum",
      "You Can Have It All",
      "Music by Men",
      "Buckle",
      "King",
      "The Old Religion",
      "Howl",
      "Heaven Is Here",
      "Sympathy Magic",
      "One of the Greats",
      "Dog Days Are Over",
      "Free",
      "And Love",
    ]);
  });

  it.runIf(useMock)("should throw an error if fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          statusText: "Not Found",
        }),
      ),
    );
    await expect(scrapeSetlist(url)).rejects.toThrow("Failed to fetch setlist: Not Found");
  });
});
