# Use offical Node.js image.  The image uses Alpine linux
FROM node:8.2.1-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD run_forever.sh /run_forever.sh

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# Run server.js every 30 seconds
CMD ["/run_forever.sh"]