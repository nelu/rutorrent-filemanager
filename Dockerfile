# continous build for latest tag
ARG ARCH

FROM ${ARCH}unzel/rutorrent-filemanager:latest

MAINTAINER hwk <nelu@github.com>

ENV PLUGIN_DIR 	"$APP_HOME/plugins/filemanager"

RUN rm -rf "$PLUGIN_DIR"
COPY --chmod=775 --chown=www-data:www-data . "$PLUGIN_DIR"



