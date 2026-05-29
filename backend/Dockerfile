FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev git unzip curl zip libicu-dev g++ make autoconf \
    && docker-php-ext-install pdo pdo_pgsql intl bcmath opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader --no-scripts

COPY . .

# Ne jamais copier .env, Render injecte les variables directement
# Ne pas faire config:cache à la build
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 8000

# Serveur PHP intégré, Laravel utilisera les variables d'environnement de Render
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]