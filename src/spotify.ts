import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";

export class SpotifyManager {
  private sdk: SpotifyApi;

  constructor(clientId: string, redirectUri: string) {
    this.sdk = SpotifyApi.withUserAuthorization(clientId, redirectUri, Scopes.playlistModify);
  }

  async authenticate(): Promise<void> {
    await this.sdk.authenticate();
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
