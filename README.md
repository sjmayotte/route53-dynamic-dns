# sjmayotte/route53-dynamic-dns
[![Docker Build Statu](https://img.shields.io/docker/build/sjmayotte/route53-dynamic-dns.svg)](https://hub.docker.com/r/sjmayotte/route53-dynamic-dns) [![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns.svg?type=shield)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns?ref=badge_shield) [![](https://images.microbadger.com/badges/image/sjmayotte/route53-dynamic-dns.svg)](https://microbadger.com/images/sjmayotte/route53-dynamic-dns "Get your own image badge on microbadger.com") [![](https://images.microbadger.com/badges/version/sjmayotte/route53-dynamic-dns.svg)](https://microbadger.com/images/sjmayotte/route53-dynamic-dns "Get your own version badge on microbadger.com") [![Docker Pulls](https://img.shields.io/docker/pulls/sjmayotte/route53-dynamic-dns.svg)](https://hub.docker.com/r/sjmayotte/route53-dynamic-dns/)

Update [Amazon Route53](http://aws.amazon.com/route53/) hosted zone with current public IP address (from [OpenDNS](https://diagnostic.opendns.com/myip)).  No cost alternative to DynamicDNS services such as Dyn, No-IP, etc.  Designed to be simple and efficient with the ability to run as a [Node.js process](#nodejs-process) or in a [Docker Container](https://hub.docker.com/r/sjmayotte/route53-dynamic-dns/).

# Table of Contents
- [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Node.js Process](#nodejs-process)
    - [Clone Repository](#clone-repository)
    - [Set Environment Variables](#set-environment-variables)
    - [Installation](#installation)
  - [Docker](#docker)
    - [Pull Image](#pull-image)
    - [Run Container](#run-container)
- [Logs](#logs)
- [License](#license)
  - [MIT](#mit)
  - [Attribution](#attribution)

# Environment Variables
Environment variables are required to run the process as standalone Node.js process or Docker Container.
* `AWS_ACCESS_KEY_ID` - `string` -  AWS Access Key for IAM user; see: [AWS Javascript SDK - Getting Started](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-nodejs.html)
* `AWS_SECRET_ACCESS_KEY` - `string` - AWS Secret Access Key for IAM user; see: [AWS Javascript SDK - Getting Started](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-nodejs.html)
* `AWS_REGION` - `string` - AWS Region; ex: "us-east-1"; List of regions: [AWS Javascript SDK - Setting Region](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html)
* `ROUTE53_HOSTED_ZONE_ID` - `string` - AWS Route53 Hosted Zone ID; ex: "Z25S75OFY0ERQD"
* `ROUTE53_DOMAIN` - `string` - AWS Route53 FQDN; ex: "home.example.com"
* `ROUTE53_TYPE` - `string` - AWS Route 53 record type for FQDN; ex: "A"
* `ROUTE53_TTL` - `integer` - AWS Route 53 TTL in seconds for FQDN; ex: 60
* `SEND_EMAIL_SES` - `boolean` - Use AWS SES to send notification email. ex: true
* `SES_TO_ADDRESS` - `string` - If SEND_EMAIL_SES = true, 'To' address for email; ex: "admin@example.com"
* `SES_FROM_ADDRESS` - `string` - If SEND_EMAIL_SES = true, 'From' address for email; ex: "notification@example.com"
* `UPDATE_FREQUENCY` - `integer` - Interval in Milliseconds to check if Public IP has changed; ex: 60000 (which is every minute)

# Usage
## Node.js Process
### Clone Repository
Download latest code from Github repository.
```bash
$ git clone https://github.com/sjmayotte/route53-dynamic-dns
$ cd route53-dynamic-dns
```

### Set Environment Variables
You have the option to pass [Environment Variables](#environment-variables) at runtime or populate [Environment Variables](#environment-variables) in `.env`.  This repository contains `.env.example`, which can be renamed to `.env` and populated with values.  The process expects `.env` will be in root of directory structure.
```bash
$ cp .env.example .env
$ vi .env
$ #Update .env with values and save file
```

### Installation
Install dependencies from `package.json`.
```bash
$ npm install
```

Start Node.js process which will run forever (or until process is stopped by user).
```bash
$ npm start
```

## Docker
This image is built using official [`node:alpine`](https://hub.docker.com/_/node/) image, which runs on the popular [Alpine Linux project](http://alpinelinux.org). Alpine Linux is much smaller than most distribution base images (~5MB), which leads to much slimmer images in general.

### Pull Image
```bash
$ docker pull sjmayotte/route53-dynamic-dns
```

### Run Container
```bash
$ docker run -d -t -i --rm \
    --name route53-dynamic-dns \
    -e AWS_ACCESS_KEY_ID= \
    -e AWS_SECRET_ACCESS_KEY= \
    -e AWS_REGION= \
    -e ROUTE53_HOSTED_ZONE_ID= \
    -e ROUTE53_DOMAIN= \
    -e ROUTE53_TYPE= \
    -e ROUTE53_TTL= \
    -e SEND_EMAIL_SES= \
    -e SES_TO_ADDRESS= \
    -e SES_FROM_ADDRESS= \
    -e UPDATE_FREQUENCY= \
    sjmayotte/route53-dynamic-dns
```

# Logs
Application logs are written to `application.log` in root project directory.  Log files are compressed and archived after reaching 10MB in size.  The most recent 3 archives are kept in rotation.  All other archives are deleted to keep footprint small.

# License
## MIT
Route53 Dynamic DNS is licensed under the MIT License (https://opensource.org/licenses/MIT).  A copy of MIT License is included in this repository.

## Attribution
The following 3rd-party software components may be used by or distributed with route53-dynamic-dns: https://app.fossa.io/reports/f5377d5f-557e-4e21-8bfa-93a27ea6e540


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns.svg?type=large)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns?ref=badge_large)
