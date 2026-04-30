export interface Config {
  spotifyClientId: string;
  spotifyRedirectUri: string;
}

export function getConfig(): Config {
  const spotifyClientId = process.env["SPOTIFY_CLIENT_ID"];
  const spotifyRedirectUri = process.env["SPOTIFY_REDIRECT_URI"] || "http://127.0.0.1:8080/callback";

  if (!spotifyClientId) {
    throw new Error("SPOTIFY_CLIENT_ID environment variable is not set.");
  }

  return {
    spotifyClientId,
    spotifyRedirectUri,
  };
}
