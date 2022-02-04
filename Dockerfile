# continous build for latest tag
ARG ARCH

FROM ${ARCH}unzel/rutorrent-filemanager:latest

MAINTAINER hwk <nelu@github.com>

ENV PLUGIN_DIR 	"$APP_HOME/plugins/filemanager"

RUN rm -rf "$PLUGIN_DIR"

COPY . "$PLUGIN_DIR"
RUN chmod -R 775 $PLUGIN_DIR \
    && chown -R www-data:www-data  "$PLUGIN_DIR"



