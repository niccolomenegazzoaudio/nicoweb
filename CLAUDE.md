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

Production deploy is automatic: every push to `main` runs `.github/workflows/deploy.yml`, which rsyncs to the `arm_php` host (Oracle ARM, IP `130.61.237.237`) and runs `docker compose -f docker-compose.prod.yml up -d --build`, then smoke-tests the public URL plus the routes `/`, `/la-ferocia`, `/i-miei-stupidi-intenti`, `/la-diva-del-bataclan`, `/about`, `/contact`, `/admin`, `/reference`. If you add a top-level route, update the smoke test list.

Manual deploy from a workstation: `./deploy/deploy.sh` (uses the SSH alias `arm_php`, target `/home/ubuntu/nicoweb`).

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
  - `templates/home.html.twig` — landing page with a Web Audio drone intro (sine 220/220.8 Hz, panning, lowpass sweep). All knobs (`duration`, `fade`, `freq_a`/`freq_b`, `filter_start`/`filter_end`) are read from `user/pages/01.home/home.md` frontmatter — change the page, not the template.
  - `templates/work.html.twig` — used by the three project pages, picked because each page file is named `work.md`. Renders `header.media` as `<img>`/`<video>`/`<audio>` based on `header.media.type`.
  - `blueprints/*.yaml` — admin UI form definitions for each page template (what fields appear in `/admin`).
- `user/pages/NN.slug/template.md` — Grav convention. The numeric prefix sets menu order; the filename (minus `.md`) selects the Twig template (`home.md` → `home.html.twig`, `work.md` → `work.html.twig`, etc.). To add a new project, copy one of the `0N.*/work.md` directories and renumber.
- `user/config/` — site-level config (title, language, contact). `system.yaml` is committed; admin-edited overrides accumulate here too.
- `user/accounts/`, `user/data/` — runtime, gitignored. The deploy workflow excludes them so admin-created accounts and form submissions on prod aren't clobbered.
- `public.legacy/` — the previous static PHP site, kept locally for reference only. Gitignored, not deployed, not served.
- `webserver-configs/` — upstream Grav samples. **Not used.** The real config is `docker/Caddyfile`.

### Containers

`docker/Dockerfile` builds on `dunglas/frankenphp:1-php8.3-alpine` (Caddy + PHP in one process), adds `gd zip exif intl`, copies `docker/php.ini` and `docker/Caddyfile`. Multi-arch — same image runs on local x86 and on ARM64 prod.

`docker/Caddyfile` is the routing source of truth: blocks dotfiles, `/system`, `/vendor`, `/user/accounts|config|data|env`, etc.; long-caches static assets; everything else falls through to `index.php`. `SERVER_NAME` is templated by compose:
- dev (`docker-compose.yml`): `:80` — HTTP only, no TLS.
- prod (`docker-compose.prod.yml`): `niccolomenegazzo.com www.niccolomenegazzo.com` — Caddy auto-issues Let's Encrypt certs. Persistent state lives in named volumes (`caddy_data`, `nicoweb_user`, `nicoweb_cache`, `nicoweb_logs`, `nicoweb_tmp`, `nicoweb_backup`) — **never** rebuild prod in a way that wipes them.

The prod stack is now standalone (binds `:80`/`:443` directly). The historical `mahoboi` Caddy proxy and `mahoboi_maho-network` referenced in `deploy/deploy.sh` are no longer in front of this container — if you edit the deploy script, the smoke-test step that uses that network will fail.

## Conventions

- Italian copy in pages and admin labels; English fine in code comments.
- Twig escaping is on (`autoescape: true`); use `|raw` only on trusted markdown output (see `base.html.twig`).
- When adding fields to a page's frontmatter, also add them to the matching `user/themes/nicoweb/blueprints/*.yaml` so they're editable from `/admin`.
- The home page intentionally hides chrome (`{% if page.slug != 'home' %}` in `partials/base.html.twig`); other pages get header + footer.

## Theme: visual language

Minimal black + warm-white (`#000` / `#f4f1ea`), single warm-tan accent (`--accent: #d4a373`) used **only** for `:focus-visible`, `aria-current="page"` nav indicator, and primary CTA hover. **Do not** broaden the accent to body text or general links — it's a punctuation color.

Two self-hosted families under `user/themes/nicoweb/fonts/` (woff2, OFL): Space Grotesk (400/500/700) and JetBrains Mono (400/500). The 500 weight is preloaded in `base.html.twig`. **No external font hosts** — adding `<link>` to googleapis is a regression.

Mono uppercase labels (`.mono` class, or `font-family:var(--mono)` + `text-transform:uppercase`) standardise on `letter-spacing: .24em` (some smaller mono labels in `.kv__row dt` keep `.16em` for legibility at the smaller size).

Page-enter and inter-page cross-fades come from CSS `@view-transition { navigation: auto }` — no JS animation library involved.

Body has a 5%-opacity SVG noise tile in `background-image` for analog warmth — keep `background-color: var(--bg)` + `background-image:` separate (don't collapse to `background:` shorthand or the noise disappears).

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

The contact form (`user/pages/06.contact/contact.md`) runs the Grav form `process:` chain → email step → save step. If the email step fails (e.g. password missing or SMTP blocked), the save step still runs, so submissions are never lost — read them at `/admin → Forms → Contact`.

### Email obfuscation pattern

Niccolò's address never appears in raw HTML. Frontmatter renders a placeholder span:
```yaml
- { label: 'Email', value: '<span class="email-link" data-u="niccolomenegazzoaudio" data-d="gmail.com">scrivimi via email</span>' }
```
At runtime `nicoweb.js` reads `data-u` + `data-d`, builds the address, and replaces the span content with a working `mailto:` anchor. Bots that don't execute JS see only "scrivimi via email" — no address to scrape. **Always use this pattern for displaying the email**; never paste the literal string into a template or content file.
