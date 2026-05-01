import * as cheerio from "cheerio";

export interface SetlistData {
  artist: string;
  venue: string;
  date: string;
  songs: string[];
}

export class ScrapeError extends Error {
  readonly code: number;
  readonly html: string;

  constructor(message: string, code: number, html: string) {
    super(message);
    this.name = "ScrapeError";
    this.code = code;
    this.html = html;
  }
}

export async function scrapeSetlist(url: string): Promise<SetlistData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SpotifyPlaylistCreator/1.0)",
    },
  });
  const html = await response.text();

  if (!response.ok) {
    throw new ScrapeError(`Failed to fetch setlist: ${response.statusText}`, response.status, html);
  } else if (response.status === 202 && html === "") {
    throw new ScrapeError("Stub response detected", response.status, html);
  }

  const $ = cheerio.load(html);

  const artist = $(".setlistHeadline h1 strong a").first().text().trim();
  const venue = $(".venueHeader h2").first().text().trim();

  const monthName = $(".dateBlock .month").first().text().trim();
  const day = $(".dateBlock .day").first().text().trim().padStart(2, "0");
  const year = $(".dateBlock .year").first().text().trim();

  const monthMap: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const month = monthMap[monthName] ?? "01";
  const date = `${year}-${month}-${day}`;

  const songs: string[] = [];
  $("a.songLabel").each((_, element) => {
    const songName = $(element).text().trim();
    if (songName) {
      songs.push(songName);
    }
  });

  if (!artist || songs.length === 0) {
    throw new ScrapeError(
      `Failed to parse setlist: artist="${artist}" songs=${songs.length}`,
      response.status,
      html,
    );
  }

  return {
    artist,
    venue,
    date,
    songs,
  };
}
