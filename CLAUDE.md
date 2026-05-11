# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio for **Niccolò Menegazzo** (sound designer / sound engineer). Italian-language content. Deployed at `niccolomenegazzo.com`.

Built on **Grav 1.7** (flat-file PHP CMS, Twig templates, YAML config, Markdown content). No database. Vendored Composer deps are committed (`vendor/`) so the server image doesn't run `composer install` — keep this in mind when changing dependencies.

## Run / Build / Deploy

Local dev (FrankenPHP, bind-mount of whole project, port 8080):
```bash
docker compose up -d --build      # http://localhost:8080
docker compose logs -f app
docker compose down
```

Production deploy is automatic: every push to `main` runs `.github/workflows/deploy.yml`, which rsyncs to the `arch_php` host (Oracle x86_64 Arch Linux, IP `150.230.157.31`, SSH user `arch`) and runs `docker compose -f docker-compose.prod.yml up -d --build`, then **does a tar-pipe sync of the rsync'd `user/` into the running container** (because the named volume `nicoweb_user:/app/user` doesn't pick up image changes after first creation), and finally smoke-tests the public URL on the routes `/`, `/la-ferocia`, `/i-miei-stupidi-intenti`, `/la-diva-del-bataclan`, `/about`, `/contact`, `/admin`. **Update the smoke test list when you change page slugs** (e.g. when about → bio, contact → contatti, the workflow's smoke test list also needs to change). The tar-pipe step excludes `user/data`, `user/accounts`, `user/config/plugins/email.yaml` so admin-runtime data and the SMTP password are preserved on prod.

Manual deploy from a workstation: `./deploy/deploy.sh` (uses the SSH alias `arch_php`, target `/home/arch/nicoweb`).

**Auto-push workflow.** This repo treats `git push origin main` as the publish step: every change ends with `commit + push` so it goes live. When working here, finish each task by committing the working tree and pushing to `main` without asking — Francesco wants the loop tight. Standard caveats still apply (never `--amend` published commits, never skip hooks, never force-push, stop and warn if a sensitive file like `.env` / `user/accounts/` / `user/config/plugins/email.yaml` slipped into the diff). If you change a page slug, update the smoke-test list in `.github/workflows/deploy.yml` in the same commit, or the deploy fails.

Grav CLI (rarely needed; admin UI covers most things):
```bash
bin/grav clear-cache
bin/grav install                  # only if vendor/plugins are missing
bin/plugin login newuser          # create an admin account in user/accounts/
```

There are no tests for the site itself — `composer test` / `composer phpstan` are upstream Grav scripts and are not run in CI here.

## Architecture

**Single Grav site, custom theme, no plugins beyond the stock admin set.** Most "code" is templates and YAML.

- `index.php` — Grav front controller, untouched. All routes go through it.
- `user/themes/nicoweb/` — the only project-specific theme. Active via `user/config/system.yaml` (`pages.theme: nicoweb`).
  - `templates/home.html.twig` — landing page with a Web Audio drone intro: **quasi-controfase** fundamental (two sines at `freq_a` / `freq_b` = 220 / 220.4 Hz, second channel inverted via negative gain → 180° phase, the small detune avoids total cancellation in mono playback) plus a **shimmer** layer (octave + twelfth, `freq_a*2` / `freq_a*3`, modulated by a 0.3 Hz LFO with a soft 1.5s fade-in envelope). All four signals share the same lowpass sweep `filter_start → filter_end`, panning -1/+1 → 0/0 over `duration`, then fade out. All knobs (`duration`, `fade`, `freq_a`/`freq_b`, `filter_start`/`filter_end`) are read from `user/pages/01.home/home.md` frontmatter — change the page, not the template. The four-mode test panel that briefly lived on the home is gone; if you need to A/B alternative phase techniques again, restore from git history (commit `d7d67b5`).
    - **Intro skip logic.** The home script checks for a `?skip=1` query param: if present → skip intro and `history.replaceState` to scrub it from the URL (so a subsequent refresh plays the intro again normally). The footer "Home" link points to `/?skip=1` so navigating back to the home from an inner page doesn't replay the audio every time. Direct URL / external link / refresh / first visit → intro plays. (We previously tried a referrer + `performance.navigation.type` heuristic; it was fragile with Referrer-Policy and new-tab navigations, so we switched to the explicit flag.)
    - **Below the intro the home renders a Profilo section** that pulls content (body + facts + clients) from the `/bio` page via `pages.find('/bio')`. The bio page itself is hidden from the menu (`visible: false`) but stays as the single source of truth so Nicco edits it from `/admin → Pages → Bio` and the home updates automatically.
    - **Intro is just the O.** The intro overlay shows only the symbol — `Niccolò Menegazzo` text is gone, and the O does **not** shrink on reveal. No frame around the O. The slash is visible from page load (no fade-in). On click the slash dissolves, the accent appears, and the `.intro__hint` ("tap to get in phase") fades to 0 over 5s in sync with the slash transition.
    - **Fire effect on the accent.** When the user clicks the intro the `.symbol` gains `.active` and `.accent` runs `flame-ignite` (2.5s ease-in, builds a warm glow via `filter: drop-shadow()` and animates `background-color` from cold to warm). `.accent` is a CSS-drawn bar (small angled `div` with `background`, like `.slash`), not a font glyph — we tried the precomposed-`ò`-clipped approach but the grave was too small and detached from the o at our sizes, so we switched to a tuned bar for full control over length / thickness / angle / position. The fire fades out with the whole overlay's `opacity` transition.
  - `templates/category.html.twig` — listing template for **Teatro** and **Musica**: shows the section title + intro + a `.cat-list` of all visible children (each child is a single show/event using `work.html.twig`).
  - `templates/work.html.twig` — used by individual show/event pages (children of a category) and by stand-alone work pages like `06.work-in-progress`. Renders `header.media` as `<img>`/`<video>`/`<audio>` based on `header.media.type`. The "← back" link points to the parent category when it's a `category` template, else to `/`.
  - `blueprints/*.yaml` — admin UI form definitions for each page template (what fields appear in `/admin`).
- `user/pages/NN.slug/template.md` — Grav convention. The numeric prefix sets menu order; the filename (minus `.md`) selects the Twig template (`home.md` → `home.html.twig`, `work.md` → `work.html.twig`, `default.md` → `default.html.twig`, `contact.md` → `contact.html.twig`, `category.md` → `category.html.twig`). Current pages:
  - `01.home` (home)
  - `02.bio` (default, `visible:false` — single source of truth for the home profilo body)
  - `03.contatti` (contact, `visible:false` — form + admin Forms inbox)
  - `04.teatro/category.md` (Teatro index) + `04.teatro/NN.<slug>/work.md` for each show
  - `05.musica/category.md` (Musica index) + `05.musica/NN.<slug>/work.md` for each event
  - `06.work-in-progress/work.md` (stand-alone work page)
  To add a new show under Teatro/Musica, create a child folder via `/admin → Pages → Teatro → Add page` (or duplicate `04.teatro/01.esempio-spettacolo/`).
- `user/config/` — site-level config (title, language, contact). `system.yaml` is committed; admin-edited overrides accumulate here too.
- `user/accounts/`, `user/data/` — runtime, gitignored. The deploy workflow excludes them so admin-created accounts and form submissions on prod aren't clobbered.
- `public.legacy/` — the previous static PHP site, kept locally for reference only. Gitignored, not deployed, not served.
- `webserver-configs/` — upstream Grav samples. **Not used.** The real config is `docker/Caddyfile`.

### Containers

`docker/Dockerfile` builds on `dunglas/frankenphp:1-php8.3-alpine` (Caddy + PHP in one process), adds `gd zip exif intl`, copies `docker/php.ini` and `docker/Caddyfile`. Dev and prod both run x86_64 now (prod = arch_php on Oracle x86_64); the upstream image is multi-arch so it'd still work on ARM if needed.

`docker/Caddyfile` is the routing source of truth: blocks dotfiles, `/system`, `/vendor`, `/user/accounts|config|data|env`, etc.; long-caches static assets; everything else falls through to `index.php`. `SERVER_NAME` is templated by compose:
- dev (`docker-compose.yml`): `:80` — HTTP only, no TLS.
- prod (`docker-compose.prod.yml`): `niccolomenegazzo.com www.niccolomenegazzo.com` — Caddy auto-issues Let's Encrypt certs. Persistent state lives in named volumes (`caddy_data`, `nicoweb_user`, `nicoweb_cache`, `nicoweb_logs`, `nicoweb_tmp`, `nicoweb_backup`) — **never** rebuild prod in a way that wipes them.

The prod stack is now standalone (binds `:80`/`:443` directly). The historical `mahoboi` Caddy proxy and `mahoboi_maho-network` referenced in `deploy/deploy.sh` are no longer in front of this container — if you edit the deploy script, the smoke-test step that uses that network will fail.

## Conventions

- Italian copy in pages and admin labels; English fine in code comments.
- Twig escaping is on (`autoescape: true`); use `|raw` only on trusted markdown output (see `base.html.twig`).
- When adding fields to a page's frontmatter, also add them to the matching `user/themes/nicoweb/blueprints/*.yaml` so they're editable from `/admin`.
- The home page intentionally hides chrome (`{% if page.slug != 'home' %}` in `partials/base.html.twig`); other pages get header + footer.

### Header

The header has **no brand mark** — no "Niccolò Menegazzo" text, no logo. Just the nav items left-aligned (`.nav { justify-content: flex-start }`). To get back to the home from an inner page the user uses the URL bar or browser back; there is no in-page home link anymore. This means the navType+referrer "skip intro when coming from internal page" logic in `home.html.twig` is now mostly dead code for normal users — keep it anyway because it still applies if someone hand-crafts an internal link.

The menu lists `Teatro / Musica / Work-in-progress` — **no Bio**, **no Contatti**. Both pages still exist and are reachable by direct URL (each is `visible: false` in its frontmatter so it's hidden from the menu only). Bio is the source of truth for home's profilo body content; Contatti hosts the form and is where form submissions land (`/admin → Forms → Contact`).

## Theme: visual language

Minimal black + warm-white (`#000` / `#f4f1ea`), single warm-tan accent (`--accent: #d4a373`) used **only** for `:focus-visible`, `aria-current="page"` nav indicator, and primary CTA hover. **Do not** broaden the accent to body text or general links — it's a punctuation color.

Two self-hosted families under `user/themes/nicoweb/fonts/` (woff2, OFL): Space Grotesk (400/500/700) and JetBrains Mono (400/500). The 500 weight is preloaded in `base.html.twig`. **No external font hosts** — adding `<link>` to googleapis is a regression.

Mono uppercase labels (`.mono` class, or `font-family:var(--mono)` + `text-transform:uppercase`) standardise on `letter-spacing: .24em` (some smaller mono labels in `.kv__row dt` keep `.16em` for legibility at the smaller size).

Page-enter and inter-page cross-fades come from CSS `@view-transition { navigation: auto }` — no JS animation library involved.

Body background is **flat black**, no texture / pattern / gradient. Past iterations tried an SVG noise tile and a `repeating-linear-gradient` of horizontal bands; both were rejected. Don't reintroduce a `background-image` on `body` without explicit user request.

### "VU meter" scroll progress

Inner pages render a 1px `<div class="scroll-meter">` at the top, fixed, in `--accent`. The width is driven by a custom property `--scroll` set on the element by `nicoweb.js` from a passive scroll listener. CSS hides it on the home page (`body[data-page="home"]`) so the audio intro stays clean. This is intentional sound-engineering visual signature — don't remove it without replacing.

### `.reveal` opt-in

Any element with `class="reveal"` fades in on scroll via IntersectionObserver in `nicoweb.js`. Useful for content-author opt-in inside markdown (`<div class="reveal">…</div>`); not auto-applied to chrome.

### Responsive breakpoints

Three media query bands, in this order in `nicoweb.css`:
- `min-width:781px and max-width:1024px` — tablet portrait, slightly tighter padding/title clamps.
- `max-width:780px` — phone/tablet small. Touch targets bumped to ≥44px on all mono links.
- `max-width:480px` — phone-small (iPhone SE class). Container padding 20px, page padding compressed.

Touch defaults: `-webkit-tap-highlight-color:transparent` globally + `a:active { opacity:.5 }` for tap feedback. `.intro` and `.home-screen` use `min-height:100dvh` plus `env(safe-area-inset-*)` padding so the audio intro hint isn't clipped by iOS Safari's dynamic toolbar / notch.

## JS

Single file: `user/themes/nicoweb/js/nicoweb.js`, loaded with `defer` from `base.html.twig`. Vanilla, no deps. Handles: mobile nav toggle, scroll meter, reveal-on-scroll, **email obfuscation reassembly** (`.email-link[data-u][data-d]` → real `mailto:` at runtime), audio players (markup not yet wired into templates), portfolio filters (markup not yet wired). The home audio drone is a separate inline script in `home.html.twig` because it's home-specific and reads frontmatter into JS literals.

## Contact form & email

`user/config/plugins/email.yaml` configures the Grav `email` plugin to send via Gmail SMTP (smtp.gmail.com:587 TLS) using the address `niccolomenegazzoaudio@gmail.com`. The SMTP password field is intentionally **empty in the committed file** — it's an App Password that lives only on prod, set via `/admin → Plugins → Email → SMTP password`. The deploy workflow (`/.github/workflows/deploy.yml`) excludes `user/config/plugins/email.yaml` from rsync so subsequent deploys don't overwrite the production password. To rotate: revoke the App Password in Google account, generate a new one, paste via /admin.

The contact form (`user/pages/03.contatti/contact.md`) runs the Grav form `process:` chain → email step → save step. If the email step fails (e.g. password missing or SMTP blocked), the save step still runs, so submissions are never lost — read them at `/admin → Forms → Contact` (form name is `contact` regardless of page slug).

### Email obfuscation pattern

Niccolò's address never appears in raw HTML. Frontmatter renders a placeholder span:
```yaml
- { label: 'Email', value: '<span class="email-link" data-u="niccolomenegazzoaudio" data-d="gmail.com">scrivimi via email</span>' }
```
At runtime `nicoweb.js` reads `data-u` + `data-d`, builds the address, and replaces the span content with a working `mailto:` anchor. Bots that don't execute JS see only "scrivimi via email" — no address to scrape. **Always use this pattern for displaying the email**; never paste the literal string into a template or content file.
