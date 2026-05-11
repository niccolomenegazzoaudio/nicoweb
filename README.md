# nicoweb

Sito portfolio di **Niccolò Menegazzo** (sound designer / sound engineer)
costruito su [Grav 1.7](https://getgrav.org/) (flat-file PHP CMS) servito da
[FrankenPHP](https://frankenphp.dev/) (Caddy + PHP nello stesso processo).

Live: <https://niccolomenegazzo.com>

## Stack

- Grav 1.7 — CMS flat-file (Markdown + YAML + Twig)
- FrankenPHP — Caddy + PHP 8.3 nello stesso binario, gira identico in dev
  sul laptop e in prod su Oracle Cloud (Arch Linux x86_64)
- TLS automatico via Let's Encrypt (Caddy)
- Niente database, niente Composer sul server (vendor/ committato)

## Struttura del progetto

```
docker/
  Dockerfile      Immagine FrankenPHP + Grav
  Caddyfile       Routing PHP / blocca system & vendor / cache asset
  php.ini         php.ini di prod
docker-compose.yml         dev locale (bind mount, porta 8080)
docker-compose.prod.yml    live (porte 80/443, volumi separati per i dati editabili)
.github/workflows/
  deploy.yml      CI: push su main → rsync → docker compose up → smoke test
deploy/
  deploy.sh       deploy manuale (alternativa al CI)

user/
  pages/          Contenuti del sito (markdown + frontmatter)
  themes/nicoweb/ Tema custom: CSS, Twig, blueprints per l'admin
  config/         site.yaml, system.yaml
  plugins/        admin, login, form, email, …
  accounts/       Utenti admin (NON committato, .gitignore)
system/, vendor/, bin/   Core di Grav (provenienti dallo skeleton ufficiale)
index_bk.php      Sito originale di Niccolò, archiviato come reference
                  (servito anche dall'app a /reference)
```

## Pages

- `01.home`        — landing con intro audio-visiva (Ò + drone 220/220.8 Hz)
- `02–04.<work>`   — singoli progetti (La ferocia · I miei stupidi intenti · La diva del Bataclan)
- `05.about`       — biografia, gear, clienti
- `06.contact`     — form contatti
- `99.reference`   — archivio del sito originale (`index_bk.php` 1:1)

## Admin

Il pannello admin è a `/admin`. L'utente locale viene creato con:

```bash
docker exec nicoweb bin/plugin login newuser \
  --user nicco --password 'STRONG-PASS' \
  --email niccolomenegazzoaudio@gmail.com \
  --permissions a --language en \
  --fullname "Niccolò Menegazzo" --title "Sound Designer"
```

In produzione lo stesso comando, ma sul container `nicoweb` su `arch_php`.

## Sviluppo locale

```bash
docker compose up -d --build
open http://localhost:8080
```

Modifiche a `user/pages/`, `user/themes/`, CSS o Twig sono live (bind mount).
Se il caching Twig dà fastidio: `docker exec nicoweb bin/grav cache --all`.

## Deploy

### Automatico (preferito)

Push su `main` → la GitHub Action in `.github/workflows/deploy.yml`:

1. rsync del codice verso `arch_php:/home/arch/nicoweb/`
   (esclude `cache/`, `logs/`, `tmp/`, `user/data/`, `user/accounts/`)
2. `docker compose -f docker-compose.prod.yml up -d --build`
3. Smoke test pubblico di tutte le route principali

Secrets richiesti nel repo (già configurati):
`SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`,
`DEPLOY_PATH`, `PUBLIC_URL`.

### Manuale

```bash
./deploy/deploy.sh           # rsync + up
./deploy/deploy.sh --dry-run # vede cosa cambierebbe
```

## Volumi persistenti in produzione

Solo i dati che l'admin può modificare vivono su volume:

```
user/pages, user/config, user/data, user/accounts, cache, logs, tmp, backup
```

Tema, plugin, codice e Dockerfile vengono dall'immagine — un nuovo deploy
aggiorna automaticamente CSS/template/Caddy senza che servano interventi
manuali.

## Reference / sito originale

`index_bk.php` è il sito originale (single-page con intro Ò + audio drone +
3 link). È archiviato come riferimento ed è raggiungibile a
<https://niccolomenegazzo.com/reference>.
