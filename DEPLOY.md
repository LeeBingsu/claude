# Deploying Lyric Kinetics to Vercel (free)

This app is **zero-config** on Vercel: standard Next.js App Router, no environment
variables, no database. The expensive work (FFT analysis, GSAP, canvas rendering,
WebCodecs/MediaRecorder encoding) all runs in the **browser**, so the only server-side
code is two tiny fetch-proxy functions returning small JSON. Server bandwidth is
negligible — you won't realistically approach the free Hobby tier's 100 GB/month.

> Hobby tier is free but **non-commercial**. If you ever monetise this, move to a paid
> plan or to Cloudflare Pages (unlimited bandwidth on its free tier).

## One-time setup (~2 minutes)

1. Go to **https://vercel.com/new** and sign in with GitHub.
2. **Import** the `leebingsu/claude` repository.
3. Vercel auto-detects Next.js — leave every build setting at its default:
   - Framework: **Next.js**
   - Build command: `next build` (default)
   - Output: (managed by Vercel)
   - Install: `npm install` (default)
   - Environment variables: **none needed**
4. **Production branch:** the code currently lives on `claude/jolly-galileo-jj12qh`.
   Pick one:
   - **A — point Vercel at this branch:** Project → Settings → Git → set
     *Production Branch* to `claude/jolly-galileo-jj12qh`. Then redeploy.
   - **B — merge to `main` first** (recommended long-term) so `main` is your
     production branch:
     ```bash
     git checkout main 2>/dev/null || git checkout -b main
     git merge claude/jolly-galileo-jj12qh
     git push -u origin main
     ```
5. Click **Deploy**. You'll get a free `*.vercel.app` URL that stays live forever and
   auto-redeploys on every push.

## Custom domain (optional, still free)

Project → Settings → Domains → add your domain and follow the DNS instructions.
Vercel provisions HTTPS automatically. (You pay your registrar for the domain itself;
Vercel hosting + SSL remain free.)

## CLI alternative

```bash
npm i -g vercel
vercel          # first run links/creates the project (preview deploy)
vercel --prod   # promote to your production *.vercel.app URL
```

## Notes for production

- **No secrets to leak** — both API routes call public endpoints (Spotify/YouTube
  oEmbed + OpenGraph, LRCLIB) with no keys.
- **Browser support** — the Studio MP4 export needs WebCodecs (Chromium / recent
  Safari & Firefox); the WebM path works anywhere `MediaRecorder` does. Nothing to
  configure server-side.
- **Caching** — the API routes already set `revalidate` hints, so Vercel/Next will
  cache upstream metadata and lyric responses for you.
