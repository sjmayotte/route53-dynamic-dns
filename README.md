# sjmayotte/route53-dynamic-dns
![Docker Image CI](https://github.com/sjmayotte/route53-dynamic-dns/workflows/Docker%20Image%20CI/badge.svg)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns.svg?type=shield)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns?ref=badge_shield) [![](https://images.microbadger.com/badges/image/sjmayotte/route53-dynamic-dns.svg)](https://microbadger.com/images/sjmayotte/route53-dynamic-dns "Get your own image badge on microbadger.com") [![](https://images.microbadger.com/badges/version/sjmayotte/route53-dynamic-dns.svg)](https://microbadger.com/images/sjmayotte/route53-dynamic-dns "Get your own version badge on microbadger.com") [![Docker Pulls](https://img.shields.io/docker/pulls/sjmayotte/route53-dynamic-dns.svg)](https://hub.docker.com/r/sjmayotte/route53-dynamic-dns/)

Update [Amazon Route53](http://aws.amazon.com/route53/) hosted zone with current public IP address (from [OpenDNS](https://diagnostic.opendns.com/myip) or [ifconfig](https://ifconfig.co/ip)).  No cost alternative to DynamicDNS services such as Dyn, No-IP, etc.  Designed to be simple and efficient with the ability to run as a [Node.js process](#nodejs-process) or in a [Docker Container](https://hub.docker.com/r/sjmayotte/route53-dynamic-dns/).

# Table of Contents
- [sjmayotte/route53-dynamic-dns](#sjmayotteroute53-dynamic-dns)
- [Table of Contents](#table-of-contents)
- [Environment Variables](#environment-variables)
- [Minimum AWS IAM Policy](#Minimum-AWS-IAM-Policy)
  - [Route53](#Route53)
  - [SES](#SES)
- [Usage](#usage)
  - [Docker](#docker)
    - [Versions](#versions)
      - [`route53-dynamic-dns:latest`](#route53-dynamic-dnslatest)
      - [`route53-dynamic-dns:v1.1`](#route53-dynamic-dnsv11)
    - [Pull Image](#pull-image)
    - [Run Container](#run-container)
    - [View Useful Container Data](#view-useful-container-data)
  - [Podman](#podman)
    - [Running Container on RHEL8 or CentOS8](#running-container-on-rhel8-or-centos8)
  - [Node.js Process](#nodejs-process)
    - [Download Release](#download-release)
    - [Set Environment Variables](#set-environment-variables)
    - [Installation](#installation)
    - [Run Process](#run-process)
- [Logs](#logs)
  - [`STDOUT`](#stdout)
  - [`application.log`](#applicationlog)
- [Issues](#issues)
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
* `SEND_EMAIL_SES` - `boolean`, default: `false` - Use AWS SES to send notification email. ex: true. NOTE: there is a known issue where setting value to false will not suppress emails.  If you really don't want emails there is a workaround outlined in [Issue #8](https://github.com/sjmayotte/route53-dynamic-dns/issues/8)
* `SES_TO_ADDRESS` - `string` - If SEND_EMAIL_SES = true, 'To' address for email; ex: "admin@example.com"
* `SES_FROM_ADDRESS` - `string` - If SEND_EMAIL_SES = true, 'From' address for email; ex: "notification@example.com"
* `UPDATE_FREQUENCY` - `integer`, default: `60000 (1m)` - Interval in Milliseconds to check if Public IP has changed; ex: 60000 (which is every minute)
* `IPCHECKER` - `string` - Public IP checker service. 'opendns' or 'ifconfig.co'. Defaults to opendns.
* `LOG_TO_STDOUT` - `boolean`, default: `false` - Flag to set log to STDOUT rather than to the application log file.

# Minimum AWS IAM Policy
Below are examples of minimium IAM policies for Route53 and SES.  Thanks for members of the community for posting in an issue!
## Route53
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "route53:ChangeResourceRecordSets",
            "Resource": "arn:aws:route53:::hostedzone/*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": "route53:TestDNSAnswer",
            "Resource": "*"
        }
    ]
}
```
## SES
```json
{
    "Effect": "Allow",
    "Action": "ses:SendEmail",
    "Resource": "*",
    "Condition": {
        "ForAllValues:StringLike": {
            "ses:Recipients": [
                "you@example.org"
            ]
        }
    }
}
```

# Usage
## Docker
Image is built from official [`node:alpine`](https://hub.docker.com/_/node/) image, which runs on the popular [Alpine Linux project](http://alpinelinux.org). Alpine Linux is much smaller than most distribution base images (~5MB), which leads to much slimmer images in general.  If you are not familiar with Docker, please start by reading [Getting Started](https://docs.docker.com/get-started/) section of [Official Docker Documentation](https://docs.docker.com/).

### Versions
#### `route53-dynamic-dns:latest`
Automated build triggers with every `git push` to `master` branch.  This version is not guarenteed to be stable.  If you are looking for a stable version, please use `route53-dynamic-dns:v1.1`.

#### `route53-dynamic-dns:v1.1`
Stable version built from `release/v1.1` branch.  The code is also available as [GitHub Release](https://github.com/sjmayotte/route53-dynamic-dns/releases) with tag `v1.1`.

### Pull Image
Pull image from DockerHub.  Replace `[version]` with desired version (ex: `v1.1`).
```bash
$ docker pull sjmayotte/route53-dynamic-dns:[verison]
```

### Run Container
Run container with desired options.  See [Docker Run Reference](https://docs.docker.com/engine/reference/run/) for full list of options.
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
    -e IPCHECKER= \
    sjmayotte/route53-dynamic-dns:[verison]
```

### View Useful Container Data
Determine `CONTAINER ID` for container started in previous step.
```bash
$ docker ps -a
```
Sample output
```
CONTAINER ID    IMAGE                           COMMAND        CREATED            STATUS            PORTS       NAMES
9998c92ff8a1    sjmayotte/route53-dynamic-dns   "npm start"    45 seconds ago     Up 44 seconds                 route53-dynamic-dns
```
View logs of `STDOUT` from `CONTAINER ID` (copy from output above)
```bash
$ docker logs [CONTAINER ID]
```
View Node.js process log, which is written to `application.log` in project root directory.  See: [Logs](#Logs) for more details.
```bash
$ docker exec -it [CONTAINER ID] sh
/usr/src/app > ls -la
/usr/src/app > tail -f application.log
```
## Podman
[Podman](https://podman.io/) is a daemonless container engine for developing, managing, and running OCI Containers on your Linux System.  There are no daemons in the background doing stuff, and this means that Podman can be integrated into system services through `systemd`.  Podman implements almost all the Docker CLI commands (apart from the ones related to Docker Swarm, of course).

### Running Container on RHEL8 or CentOS8
Below are steps to create a service in `systemd` to run a podman container the starts on boot.

If SELinux is enabled on your system, you must turn on the `container_manage_cgroup` boolean to run containers with systemd.
```bash
$ setsebool -P container_manage_cgroup on
```
Create file in `/etc/systemd/system/[service-name]` for `systemd` configuration.  In example below we assume `[service-name]` = `r53-dydns-container.service`.
```bash
$ vi /etc/systemd/system/r53-dydns-container.service
```
Add contents below to file.  Replace `[env]` with [Environment Variables](#environment-variables).  Example below uses `sjmayotte/route53-dynamic-dns:v1.1`
```bash
[Unit]
Description=Route53 Dynamic DNS Container
After=network.target

[Service]
Type=simple
TimeoutStartSec=5m
ExecStartPre=-/usr/bin/podman rm "r53-dydns"

ExecStart=/usr/bin/podman run -it --name r53-dydns -e AWS_ACCESS_KEY_ID=[env] -e AWS_SECRET_ACCESS_KEY=[env] -e AWS_REGION=[env] -e ROUTE53_HOSTED_ZONE_ID=[env] -e ROUTE53_DOMAIN=[env] -e ROUTE53_TYPE=[env] -e ROUTE53_TTL=[env] -e SEND_EMAIL_SES=[env] -e SES_TO_ADDRESS=[env] -e SES_FROM_ADDRESS=[env] -e UPDATE_FREQUENCY=[env] -e IPCHECKER=[env] sjmayotte/route53-dynamic-dns:v1.1

ExecReload=-/usr/bin/podman stop "r53-dydns"
ExecReload=-/usr/bin/podman rm "r53-dydns"

ExecStop=-/usr/bin/podman stop "r53-dydns"

Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```
Configure `systemd` service.
```bash
# Reload files for systemd
$ systemctl daemon-reload

# Start service
$ systemctl start r53-dydns-container.service

# Determine status of service
$ systemctl status r53-dydns-container.service

# If all looks good enable at start-up
$ systemctl enable r53-dydns-container.service
```
Take a look at the container that is running.  Remember to use elevated permission if needed.
```bash
# Find running containers
$ podman ls -la

# Access shell in container
$ podman exec -it [container_id] sh

# Stop container with systemd
$ systemctl stop r53-dydns-container.service

# Start container with systemd
$ systemctl start r53-dydns-container.service

# Reload container with systemd
$ systemctl reload r53-dydns-container.service
```

## Node.js Process
Steps below assume you have Node.js and NPM installed on machine.  If you do not, please [download and install Node.js and NPM](https://nodejs.org/en/download/) before proceeding.

### Download Release
Download release `version` from [release repository](https://github.com/sjmayotte/route53-dynamic-dns/releases).  For example, you can use `v1.1.tar.gz` to download source for release tag `v1.1`.
```bash
$ curl -sL https://github.com/sjmayotte/route53-dynamic-dns/archive/[version] | tar xz
$ cd route53-dynamic-dns
```

### Set Environment Variables
You have the option to pass [environment variables](#environment-variables) at runtime or populate environment variables in `.env`.  Release package includes `.env.example`, which can be renamed to `.env` and populated with values.  The process expects `.env` will be in root of directory structure.
```bash
$ cp .env.example .env
$ vi .env
$ # Update .env with values and save file
$ rm .env.example
```

### Installation
Project uses [NPM](https://www.npmjs.com) package manager.  Install dependencies from `package.json`.
```bash
$ npm install
```

### Run Process
Start Node.js process which will run forever (or until process is stopped by user).
```bash
$ npm start
```
The Node.js process writes useful data to log files.  See [Logs](#logs) section for more information.

# Logs
## `STDOUT`
When Node.js process starts it writes useful data to `STDOUT`.  Example output:
```
Log4js initialized with level INFO 

Logs located in application.log in working directory

If running in Docker Container use the following command to access a shell:
   docker exec -it [container_id] sh
```

## `application.log`
Application logs are written to `application.log` in root project directory.  Log files are compressed and archived after reaching 10MB in size.  The most recent 3 archives are kept in rotation.  All other archives are deleted to keep footprint small.

# Issues
If you run into any issues, check to make sure all variables are set properly in `.env` or passed properly into Docker Container at runtime.  If you are sure your environment variables are correct, please open an [issue](https://github.com/sjmayotte/route53-dynamic-dns/issues) and provide as much detail as possible.

# License
## MIT
Route53 Dynamic DNS is licensed under the MIT License (https://opensource.org/licenses/MIT).  A copy of MIT License is included in this repository.

## Attribution
The following 3rd-party software components may be used by or distributed with route53-dynamic-dns: https://app.fossa.io/reports/f5377d5f-557e-4e21-8bfa-93a27ea6e540


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns.svg?type=large)](https://app.fossa.io/projects/git%2Bhttps%3A%2F%2Fgithub.com%2Fsjmayotte%2Froute53-dynamic-dns?ref=badge_large)
