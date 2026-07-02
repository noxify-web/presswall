# Presswall promo video

A short Remotion video for the Shopify App Store listing.

**Specs:** 1920×1080, 60 fps, ~38 seconds (dashboard recording + CTA).

## Preview

```bash
cd remotion
bun install
bun run dev
```

Opens Remotion Studio at `http://localhost:3000`.

## Render MP4

```bash
cd remotion
bun run render
```

Output: `remotion/out/presswall-promo.mp4`

Requires [FFmpeg](https://ffmpeg.org/) on your PATH.

## Scenes

1. **Intro** — official Presswall logo + tagline
2. **Choice** — “4 ready-made templates — or create your own”
3. **Templates** — hard cuts through Classic, Dark band, Auto-scroll, Soft card
4. **Custom** — dashboard screen recording (`public/video/video.mp4`)
5. **CTA** — install call-to-action screen

Assets symlinked from the main app: `public/brand/`, `public/publishers/`, and `public/video/`.

## Add music

Drop your track into Remotion Studio or mux after render:

```bash
ffmpeg -i out/presswall-promo.mp4 -i your-track.mp3 -c:v copy -c:a aac -shortest out/presswall-promo-with-music.mp4
```