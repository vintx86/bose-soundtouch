#!/bin/sh

# Default to 1000 if not set
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Modify the existing 'node' user and group IDs to match host
groupmod -o -g "$PGID" node
usermod -o -u "$PUID" node

echo "Starting with UID: $PUID, GID: $PGID"

# Fix permissions on volume mount points
chown -R node:node /app/scripts /app/config /app/data 2>/dev/null || true

# Execute the command as the node user
exec su-exec node "$@"
