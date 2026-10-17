############################################################
# Dockerfile to build ruTorrent and plugins
#
############################################################

ARG ARCH
ARG RTORRENT_IMG_SRC="unzel/rtorrent"

FROM ${ARCH}php:8.3-apache AS osbuild
ARG STORAGE_DIR=/data
ARG TARGETPLATFORM
ARG UID=1000
ARG GID=1000

ENV APP_HOME=/usr/src/app

RUN  sed -i 's/^Components: main$/& contrib non-free/' /etc/apt/sources.list.d/debian.sources \
         && apt update && apt install --no-install-recommends -y sudo gosu bash unzip g++ make file re2c autoconf openssl libssl-dev libevent-dev \
          rtorrent mediainfo \
          gzip p7zip p7zip-full p7zip-rar \
          ffmpeg sox python3-pip \
         && pip install --no-cache-dir --break-system-packages pipx \
         && pipx ensurepath

RUN  docker-php-ext-install sockets pcntl \
    && docker-php-source delete \
    && groupadd -g ${GID} runuser && useradd -u ${UID} -g ${GID} -m runuser \
    && usermod -a -G www-data runuser && usermod -a -G ${GID} www-data \
     && update-alternatives --install /usr/bin/python python /usr/bin/python3 1 \
     && pip  install --break-system-packages cloudscraper \
     && apt remove -y g++ make re2c autoconf libssl-dev libevent-dev \
     && apt autoremove -y --purge \
     && rm -rf /var/www/html \
#    && ln -s $APP_HOME /var/www/html \
    && ln -s /etc/apache2/mods-available/rewrite.load /etc/apache2/mods-enabled/rewrite.load \
    && ln -s /etc/apache2/mods-available/proxy.load /etc/apache2/mods-enabled/proxy.load \
    && ln -s /etc/apache2/mods-available/remoteip.load /etc/apache2/mods-enabled/remoteip.load \
    && apt-get clean -y \
    && rm -rf /tmp/* \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/src/php.tar.xz

# COPY rar /usr/src/rarsrc
# COPY vhost.conf /etc/apache2/sites-enabled/000-default.conf

RUN mkdir -p "$APP_HOME" "$STORAGE_DIR/downloads" "$STORAGE_DIR/.session" \
      && chmod 775 -R "$APP_HOME" \
      && chown -R ${UID}:${GID} "$STORAGE_DIR" \
    && echo "${TARGETPLATFORM}" | grep -q "arm" \
           || {  \
            BUILDPLATFORM_SHORT=$(echo "${TARGETPLATFORM}" | grep -q "64" && echo "x64" || echo "x32"); \
            RAR_DISTRO="/usr/src/rarsrc/rarlinux-${BUILDPLATFORM_SHORT}.tar.gz";  \
             tar -xzvf "${RAR_DISTRO}" -C /tmp/ \
              && cp -rfp /tmp/rar/rar /usr/bin/rar  \
              && ln -s /usr/bin/rar /usr/bin/unrar; \
            rm -rf /usr/src/rarsrc; \
            curl -L https://github.com/TheGoblinHero/dumptorrent/releases/download/v1.3/dumptorrent_linux_amd64.tar.gz \
                | tar -xzf - -C "/usr/bin"; \
     } && exit 0


FROM ${ARCH}${RTORRENT_IMG_SRC} AS rutorrent_src
LABEL org.opencontainers.image.authors="hwk <nelu@github.com>"

ARG STORAGE_DIR=/data
ARG UID=1000
ARG GID=1000
ARG RUTORRENT_VER=v5.3.16
ENV APP_HOME=/usr/src/app
ENV PATH="$PATH:$APP_HOME"

WORKDIR $APP_HOME

RUN mkdir -p "$APP_HOME" \
    && curl https://codeload.github.com/Novik/ruTorrent/tar.gz/${RUTORRENT_VER} | tar -xzf - --overwrite-dir --strip-components=1 -C "$APP_HOME"

COPY --chown=${UID}:${GID} rtorrent.conf /home/runuser/.rtorrent.rc

RUN chown -R www-data:www-data "$APP_HOME" \
    && rm -rf /var/www/html && ln -s "$APP_HOME"  "/var/www/html"

# COPY entrypoint.sh  "/usr/src/entrypoint.sh" #
# chmod 775 "/usr/src/entrypoint.sh" \ #
#     &&  #

STOPSIGNAL TERM


FROM rutorrent_src AS appbuild
ARG FILEMANAGER_MEDIA_VER=master
ARG FILEMANAGER_SHARE_VER=master

MAINTAINER hwk <nelu@github.com>
ENV PLUGIN_DIR 	"$APP_HOME/plugins/filemanager"

RUN     mkdir "$APP_HOME/plugins/filemanager-share" \
    && curl https://codeload.github.com/nelu/rutorrent-filemanager-share/tar.gz/${FILEMANAGER_SHARE_VER} \
    | tar -xzf - --overwrite-dir --strip-components=1 -C "$APP_HOME/plugins/filemanager-share" \
    && mkdir "$APP_HOME/plugins/filemanager-media" \
    && curl https://codeload.github.com/nelu/rutorrent-filemanager-media/tar.gz/${FILEMANAGER_MEDIA_VER} \
     | tar -xzf - --overwrite-dir --strip-components=1 -C "$APP_HOME/plugins/filemanager-media" \
    && chown -R www-data:www-data "$APP_HOME"

RUN rm -rf "$PLUGIN_DIR"
COPY --chmod=775 --chown=www-data:www-data . "$PLUGIN_DIR"



