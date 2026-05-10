# FrankenPHP (Caddy + PHP) per Grav. Multi-arch (linux/amd64 + linux/arm64),
# gira sia in dev sia su arm_php (Oracle ARM).
FROM dunglas/frankenphp:1-php8.3-alpine

# Estensioni PHP richieste da Grav che non sono già nel base:
#   - gd     → ridimensionamento immagini
#   - zip    → installazione plugin/temi via admin
#   - exif   → metadata immagini
#   - intl   → date/numeri localizzati
# install-php-extensions è incluso nell'immagine FrankenPHP.
RUN install-php-extensions gd zip exif intl

# php.ini di produzione (memory_limit, upload_max_filesize ecc.)
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-grav.ini

# Caddyfile: routing per Grav (tutto a index.php, blocco di system/, vendor/…)
COPY docker/Caddyfile /etc/frankenphp/Caddyfile

# Codice del sito
WORKDIR /app
COPY . /app/

# In prod il bind del codice non c'è; queste cartelle devono comunque essere
# scrivibili dal processo PHP (gira da root nell'immagine ufficiale).
RUN rm -rf /app/public.legacy /app/.git /app/deploy /app/docker /app/docker-compose*.yml \
 && mkdir -p /app/cache /app/logs /app/tmp /app/backup /app/user/data /app/user/accounts \
 && chmod -R 775 /app/cache /app/logs /app/tmp /app/backup /app/user

EXPOSE 80 443

# Healthcheck: il default dell'immagine colpisce :2019 (admin API), che
# disabilitiamo. Sostituisco con una HEAD su / che copre Caddy + PHP.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1
