FROM node:18-alpine

# Install git, shadow (for usermod/groupmod), and su-exec
RUN apk add --no-cache git shadow su-exec

# Set working directory
WORKDIR /app

# Clone the repository
RUN git clone https://github.com/vintx86/bose-soundtouch.git .

# Install dependencies
RUN npm install

# Use the existing 'node' user from the base image
# Change ownership to node user
RUN chown -R node:node /app

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port if your app serves HTTP
EXPOSE 8090

# Expose volume for bind/mount
VOLUME /app

# Use entrypoint to handle PUID/PGID
ENTRYPOINT ["/entrypoint.sh"]

# Start App
CMD ["npm", "run", "start"]
