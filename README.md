# Afterglow

A simple TypeScript CLI tool to scrape a setlist from setlist.fm and create a corresponding Spotify playlist.

Created with AI assistance.

## Setup

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Spotify Developer Account:**
    - Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
    - Create an App and get your **Client ID**.
    - Add `http://localhost:3000` (or your preferred redirect URI) to the **Redirect URIs** in your app settings.

3.  **Environment Variables:**
    Set the following environment variables in your terminal:
    ```bash
    export SPOTIFY_CLIENT_ID='your_client_id'
    export SPOTIFY_REDIRECT_URI='http://localhost:3000' # Optional, defaults to http://localhost:3000
    ```

## Usage

Run the program with a setlist.fm URL:

```bash
pnpm start https://www.setlist.fm/setlist/florence-the-machine/2026/madison-square-garden-new-york-ny-5b4f73c8.html
```

The program will:

1.  Scrape the artist, venue, date, and songs from the URL.
2.  Open your browser to authorize with Spotify.
3.  Search for each song on Spotify.
4.  Create a new playlist in your account and add the found tracks.

## Related

- [setlist.fm to Spotify](https://setlistfm.selbi.club/)
- [Setify](https://setify.co/)
