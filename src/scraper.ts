import * as cheerio from "cheerio";

export interface SetlistData {
  artist: string;
  venue: string;
  date: string;
  songs: string[];
}

export async function scrapeSetlist(url: string): Promise<SetlistData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SpotifyPlaylistCreator/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch setlist: ${response.statusText}`);
  }

  const html = await response.text();
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

  return {
    artist,
    venue,
    date,
    songs,
  };
}
