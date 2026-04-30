import { Command } from "commander";
import { getConfig } from "./config.ts";
import { scrapeSetlist } from "./scraper.ts";
import { SpotifyManager } from "./spotify.ts";

const program = new Command();

program
  .name("setlist-to-spotify")
  .description("Create Spotify playlist from setlist.fm")
  .version("1.0.0")
  .argument("<url>", "setlist.fm URL")
  .action(async (url: string) => {
    try {
      const { spotifyClientId, spotifyRedirectUri } = getConfig();

      console.log("\n--- Authenticating with Spotify ---");
      console.log("A browser window will open to authorize the application.");
      const spotify = new SpotifyManager(spotifyClientId, spotifyRedirectUri);
      await spotify.authenticate();

      console.log("--- Scraping Setlist.fm ---");
      const setlistData = await scrapeSetlist(url);
      console.log(`Artist: ${setlistData.artist}`);
      console.log(`Venue: ${setlistData.venue}`);
      console.log(`Date: ${setlistData.date}`);
      console.log(`Found ${setlistData.songs.length} songs.`);

      console.log("\n--- Searching for tracks on Spotify ---");
      const trackResults = await Promise.all(
        setlistData.songs.map(async (song) => {
          const uri = await spotify.searchTrack(setlistData.artist, song);
          return { song, uri };
        }),
      );

      const trackUris: string[] = [];
      for (const { song, uri } of trackResults) {
        if (uri) {
          trackUris.push(uri);
          console.log(`Found: "${song}"`);
        } else {
          console.log(`Not found: "${song}". Skipping.`);
        }
      }

      if (trackUris.length === 0) {
        console.log("\nNo tracks found on Spotify. Playlist creation cancelled.");
        return;
      }

      const dateObj = new Date(setlistData.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      const playlistName = `${setlistData.artist} - ${setlistData.venue} (${formattedDate})`;

      console.log(`\n--- Creating Playlist: "${playlistName}" ---`);
      const playlistId = await spotify.createPlaylist(playlistName);

      console.log("Adding tracks...");
      await spotify.addTracks(playlistId, trackUris);

      console.log(`\nSuccess! Playlist created and tracks added.`);
      console.log(`Playlist ID: ${playlistId}`);
    } catch (error) {
      console.error("\nAn error occurred:");
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      process.exit(1);
    }
  });

await program.parseAsync(process.argv);
