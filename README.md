# Lumina 🎵

Music player dengan synced lyrics, liquid glass UI , apple music style

## Stack
- **Next.js 14** App Router
- **Spotify** — search & metadata via web scraper (no API key needed)
- **YouTube IFrame API** — audio playback via Piped (no key needed)
- **lrclib.net** — synced LRC lyrics (free, no key needed)

## Fitur
- 🔍 Search lagu, artist, album
- 🎵 Play audio via YouTube
- 📜 Synced lyrics yang ngikutin lagu secara real-time
- 💿 Disc animation, progress bar, volume control
- 🪟 Liquid glass UI hitam-putih

## Deploy ke Vercel

```bash
# 1. Push ke GitHub dulu
git init
git add .
git commit -m "init lumina"
git remote add origin https://github.com/USERNAME/lumina.git
git push -u origin main

# 2. Import di vercel.com → New Project → pilih repo
# 3. Deploy otomatis tanpa env variable apapun!
```

## Local dev
```bash
npm install
npm run dev
```
