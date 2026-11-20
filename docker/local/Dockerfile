FROM php:8.3-apache
RUN apt-get update && apt-get install -y --no-install-recommends \
    libicu-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    libonig-dev libxml2-dev unzip git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j2 mysqli intl zip gd mbstring soap exif opcache \
    && a2enmod rewrite \
    && mkdir -p /var/moodledata \
    && chown www-data:www-data /var/moodledata \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY apache.conf /etc/apache2/sites-available/000-default.conf
COPY moodle.ini /usr/local/etc/php/conf.d/moodle.ini
WORKDIR /var/www/html
