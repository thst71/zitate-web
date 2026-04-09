FROM couchdb:3

# Copy custom configuration into the image so no bind mount is needed.
# This avoids the macOS Docker Desktop virtiofs chown failure that kills
# the CouchDB entrypoint (set -e + find -exec chown -f returning non-zero).
COPY --chown=couchdb:couchdb local.ini /opt/couchdb/etc/local.d/zitate.ini

