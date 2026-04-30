import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import open from "open";

const SCOPES = Scopes.playlistModify;

function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function authorize(clientId: string, redirectUri: string): Promise<string> {
  const { verifier, challenge } = pkce();

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SCOPES.join(" "),
      code_challenge_method: "S256",
      code_challenge: challenge,
    });

  const port = new URL(redirectUri).port || "80";

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, `http://127.0.0.1:${port}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      server.close();
      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Authorized. You can close this tab.</h1>");
        resolve(code);
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h1>Authorization failed: ${error}</h1>`);
        reject(new Error(`Spotify auth failed: ${error}`));
      }
    });
    server.listen(Number(port), () => open(authUrl));
  });

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  });

  if (!resp.ok) throw new Error(`Token exchange failed: ${resp.statusText}`);
  const token = await resp.json();
  return token.access_token as string;
}

export class SpotifyManager {
  private sdk!: SpotifyApi;
  private clientId: string;
  private redirectUri: string;

  constructor(clientId: string, redirectUri: string) {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
  }

  async authenticate(): Promise<void> {
    const accessToken = await authorize(this.clientId, this.redirectUri);
    this.sdk = SpotifyApi.withAccessToken(this.clientId, {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "",
    });
  }

  async searchTrack(artist: string, track: string): Promise<string | null> {
    const results = await this.sdk.search(`track:${track} artist:${artist}`, ["track"]);
    const firstTrack = results.tracks.items[0];
    return firstTrack ? firstTrack.uri : null;
  }

  async createPlaylist(name: string): Promise<string> {
    const profile = await this.sdk.currentUser.profile();
    const playlist = await this.sdk.playlists.createPlaylist(profile.id, {
      name,
      public: true,
    });
    return playlist.id;
  }

  async addTracks(playlistId: string, trackUris: string[]): Promise<void> {
    // Spotify API has a limit of 100 tracks per request for adding items
    const chunkSize = 100;
    for (let i = 0; i < trackUris.length; i += chunkSize) {
      const chunk = trackUris.slice(i, i + chunkSize);
      await this.sdk.playlists.addItemsToPlaylist(playlistId, chunk);
    }
  }
}
