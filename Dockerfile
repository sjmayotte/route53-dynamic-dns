# Use offical Node.js image.  The image uses Alpine linux
FROM node:8.2.1-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

# Start server
CMD [ "npm", "start" ]