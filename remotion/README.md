# Presswall promo video

Remotion composition for the Shopify App Store listing.

**Specs:** 1920×1080 · 60 fps · ~45 seconds

## Scenes

| # | Scene | Duration | What it shows |
|---|-------|----------|---------------|
| 1 | Hook | 2.5s | Scrolling press logos + “Shoppers trust brands…” |
| 2 | Brand | 2.0s | Official logo + “Presswall” |
| 3 | Features | 3.5s | Pick outlets → Style → Go live |
| 4 | Choice | 1.5s | “4 ready-made templates” |
| 5 | Templates | 8.0s | Classic, Dark band, Auto-scroll, Soft card |
| 6 | Dashboard | ~24s | Screen recording (`public/video/video.mp4`) |
| 7 | CTA | 4.0s | “Get started free” |

Assets are symlinked from the main app into `remotion/public/`:
`brand/`, `publishers/`, `video/`.

## Preview

```bash
cd remotion
bun install
bun run dev
```

Opens Remotion Studio (default `http://localhost:3000`).

## Render MP4

```bash
cd remotion
bun run render
```

Output: `remotion/out/presswall-promo.mp4`

Requires [FFmpeg](https://ffmpeg.org/) on your PATH.

## GIF (optional, heavier)

```bash
bun run render:gif
```

## Background music

Track lives at `public/audio/bg-music.mp3` and is mixed in `PresswallPromo.tsx`
(`BG_MUSIC_VOLUME = 0.4`, fade in/out). Dashboard screen recording is muted so
only the bed plays.

## Notes

- The dashboard clip sits in its own `<Sequence>` so `OffthreadVideo` starts at source frame 0.
- Update `DASHBOARD_VIDEO_FRAMES` in `video-config.ts` if you replace the recording (`ffprobe` → `nb_frames`).
