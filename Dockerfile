# Use offical Node.js image.  The image uses Apline Linux
FROM node:12.14.0-alpine

# Build-time metadata as defined at http://label-schema.org
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.label-schema.build-date=$BUILD_DATE \
    org.label-schema.name="Route53 DynamicDNS" \
    org.label-schema.description="Update AWS Route53 hosted zone with current public IP address. Alternative to Dynamic DNS services such as Dyn, No-IP, etc" \
    org.label-schema.url="https://github.com/sjmayotte/route53-dynamic-dns" \
    org.label-schema.vcs-ref=$VCS_REF \
    org.label-schema.vcs-url="https://github.com/sjmayotte/route53-dynamic-dns" \
    org.label-schema.vendor="sjmayotte" \
    org.label-schema.version=$VERSION \
    org.label-schema.schema-version="1.1"

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# Run server.js every 30 seconds
CMD ["npm", "start"]