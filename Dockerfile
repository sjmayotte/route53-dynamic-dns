# Use offical Node.js image.  The image uses Apline Linux
FROM node:20.12.2-bookworm-slim

# Build-time metadata as defined at https://github.com/opencontainers/image-spec/blob/master/annotations.md
ARG BUILD_DATE
ARG DOCKER_TAG
ARG GIT_SHA

# Optimize Node.js tooling for production
ENV NODE_ENV production

# Install timezone database to allow setting timezone through TZ environment variable
RUN apt install tzdata

LABEL org.opencontainers.image.created=$BUILD_DATE \
  org.opencontainers.image.authors="Steven Mayotte" \
  org.opencontainers.image.url="https://github.com/sjmayotte/route53-dynamic-dns" \
  org.opencontainers.image.documentation="https://github.com/sjmayotte/route53-dynamic-dns" \
  org.opencontainers.image.source="https://github.com/sjmayotte/route53-dynamic-dns" \
  org.opencontainers.image.version=$DOCKER_TAG \
  org.opencontainers.image.revision=$GIT_SHA \
  org.opencontainers.image.vendor="sjmayotte" \
  org.opencontainers.image.licenses="MIT" \
  org.opencontainers.image.ref.name="" \
  org.opencontainers.image.title="route53-dynamic-dns" \
  org.opencontainers.image.description="Update AWS Route53 hosted zone with current public IP address. Alternative to Dynamic DNS services such as Dyn, No-IP, etc"

# Create app directory
WORKDIR /usr/src/app

# Install only production dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY --chown=node:node . .

# Create data directory for application logs and temporary file with last known IP address with read/write permissions
# for all users to support running the container with alternate user
RUN mkdir data && chmod 777 data

# Don’t run Node.js apps as root
USER node

# Run server.js
CMD [ "node", "server.js" ]
