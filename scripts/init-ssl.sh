#!/bin/bash
# SSL İlk Kurulum Scripti
# VPS'te yalnızca bir kez çalıştırılır.
# Kullanım: bash scripts/init-ssl.sh
set -e

DOMAIN="app.altugengin.com"
ALT_DOMAIN="app.altugengin.cloud"
EMAIL="${SSL_EMAIL:?'SSL_EMAIL ortam değişkeni tanımlanmamış. Örn: SSL_EMAIL=admin@altugengin.com bash scripts/init-ssl.sh'}"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "=== SSL İlk Kurulum: $DOMAIN ==="

# 1. Geçici self-signed sertifika oluştur (nginx başlayabilsin diye)
echo ""
echo "→ [1/4] Geçici sertifika oluşturuluyor..."
$COMPOSE run --rm --entrypoint "
  mkdir -p /etc/letsencrypt/live/$DOMAIN &&
  openssl req -x509 -nodes -newkey rsa:2048 -days 1
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem
    -out    /etc/letsencrypt/live/$DOMAIN/fullchain.pem
    -subj   '/CN=localhost' 2>/dev/null
" certbot

# 2. Sadece nginx-proxy'yi başlat
echo "→ [2/4] nginx-proxy başlatılıyor..."
$COMPOSE up -d nginx-proxy
echo "   5 saniye bekleniyor..."
sleep 5

# 3. Gerçek Let's Encrypt sertifikasını al
echo "→ [3/4] Let's Encrypt sertifikası alınıyor ($DOMAIN + $ALT_DOMAIN)..."
$COMPOSE run --rm --entrypoint "
  certbot certonly --webroot -w /var/www/certbot
    --email $EMAIL
    --agree-tos --no-eff-email
    -d $DOMAIN
    -d $ALT_DOMAIN
    --force-renewal
" certbot

# 4. nginx'i yeniden yükle (artık gerçek sertifika var)
echo "→ [4/4] nginx yeniden yükleniyor..."
$COMPOSE exec nginx-proxy nginx -s reload

echo ""
echo "✓ SSL kurulumu tamamlandı!"
echo "  https://$DOMAIN"
echo ""
echo "Tüm servisleri başlatmak için:"
echo "  docker compose -f docker-compose.prod.yml up -d"
