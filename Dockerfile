############################################################
# Dockerfile to run a php fpm application#
#
############################################################

FROM php:7.1.31-apache

MAINTAINER hwk <user@somedomain.com>

ENV APP_HOME 	/usr/src/app
ENV STORAGE_DIR     $APP_HOME/storage
ENV PATH        $PATH:$APP_HOME


RUN apt-get update && apt-get install -y sudo gosu bash unzip g++ make file re2c autoconf openssl libssl-dev libevent-dev \
     rtorrent mediainfo gzip screen ffmpeg-dev ffmpeg geoip zip
     #ffmpeg-dev

RUN  docker-php-ext-install sockets \
	&& rm -rf /usr/local/etc/php/conf.d/*sockets.ini && docker-php-ext-enable --ini-name 20-sockets.ini sockets \
    && docker-php-ext-install  pcntl \
    && rm -rf /usr/local/etc/php/conf.d/*pcntl.ini && docker-php-ext-enable --ini-name 10-pcntl.ini pcntl

RUN curl https://www.rarlab.com/rar/rarlinux-x64-5.7.1.tar.gz | tar -xzvf - -C /tmp/ \
    && cp -rfp /tmp/rar/rar /usr/bin/rar && ln -s /usr/bin/rar /usr/bin/unrar \
    && rar -v

RUN apt-get remove -y g++ make re2c autoconf libssl-dev libevent-dev libstdc++-8-dev g++-8 \
    && docker-php-source delete
RUN groupadd -g 1000 runuser && useradd -u 1000 -g 1000 -m runuser && usermod -a -G www-data runuser


# copy websocket server project to the image
COPY . $APP_HOME
RUN chmod -R 775 $APP_HOME \
    && chown -R www-data:www-data  "$APP_HOME"

RUN rm -rf /var/www/html \
    && ln -s $APP_HOME /var/www/html \
    && ln -s /etc/apache2/mods-available/rewrite.load /etc/apache2/mods-enabled/rewrite.load \
    && ln -s /etc/apache2/mods-available/proxy.load /etc/apache2/mods-enabled/proxy.load \
    && ln -s /etc/apache2/mods-available/remoteip.load /etc/apache2/mods-enabled/remoteip.load
#    && rm -rf /etc/apache2/sites-enabled/000-default.conf \
#    && ln -s "$APP_HOME/entrypoints/vhost.conf" /etc/apache2/sites-enabled/000-default.conf

STOPSIGNAL TERM

VOLUME ["$APP_HOME"]

WORKDIR $APP_HOME

