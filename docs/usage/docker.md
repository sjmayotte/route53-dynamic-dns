# Docker

## Run Container Examples

See [Docker Run Reference](https://docs.docker.com/engine/reference/run/) for full list of options.

### Minimum ENV Variables

Run container with default values (see: [Environment Variables](/route53-dynamic-dns/config/env/))

```bash
docker run -d -t -i --rm \
    --name route53-dynamic-dns \
    -e AWS_ACCESS_KEY_ID=[SECRET] \
    -e AWS_SECRET_ACCESS_KEY=[SECRET] \
    -e AWS_REGION=[REGION] \
    -e ROUTE53_HOSTED_ZONE_ID=[value] \
    -e ROUTE53_DOMAIN=[value] \
    -e ROUTE53_TYPE=[value] \
    -e ROUTE53_TTL=[value] \
    sjmayotte/route53-dynamic-dns:[verison]
```

### Enable SES Emails

Run container with SES Emails  (see: [Environment Variables](/route53-dynamic-dns/config/env/))

```bash
docker run -d -t -i --rm \
    --name route53-dynamic-dns \
    -e AWS_ACCESS_KEY_ID=[SECRET] \
    -e AWS_SECRET_ACCESS_KEY=[SECRET] \
    -e AWS_REGION=[REGION] \
    -e ROUTE53_HOSTED_ZONE_ID=[value] \
    -e ROUTE53_DOMAIN=[value] \
    -e ROUTE53_TYPE=[value] \
    -e ROUTE53_TTL=[value] \
    -e SEND_EMAIL_SES=true \
    -e SES_TO_ADDRESS=[value] \
    -e SES_FROM_ADDRESS=[value] \
    sjmayotte/route53-dynamic-dns:[verison]
```

### Full Configuration

Run container with all options (see: [Environment Variables](/route53-dynamic-dns/config/env/)).  `LOG_TO_STDOUT=true`
is recommended setting in container.

```bash
docker run -d -t -i --rm \
    --name route53-dynamic-dns \
    -e AWS_ACCESS_KEY_ID=[SECRET] \
    -e AWS_SECRET_ACCESS_KEY=[SECRET] \
    -e AWS_REGION=[REGION] \
    -e ROUTE53_HOSTED_ZONE_ID=[value] \
    -e ROUTE53_DOMAIN=[value] \
    -e ROUTE53_TYPE=[value] \
    -e ROUTE53_TTL=[value] \
    -e SEND_EMAIL_SES=[true or false] \
    -e SES_TO_ADDRESS=[if SEND_EMAIL_SES = true then value else empty] \
    -e SES_FROM_ADDRESS=[if SEND_EMAIL_SES = true then value else empty] \
    -e UPDATE_FREQUENCY=60000 \
    -e IPCHECKER=ifconfig.co \
    -e LOG_TO_STDOUT=true \
    -e TZ=America/New_York \
    sjmayotte/route53-dynamic-dns:[verison]
```

## View Useful Container Data

Determine `CONTAINER ID` for container started in previous step.

```bash
docker ps -a
```

Sample output

```text
CONTAINER ID    IMAGE                           COMMAND        CREATED            STATUS            PORTS       NAMES
9998c92ff8a1    sjmayotte/route53-dynamic-dns   "npm start"    45 seconds ago     Up 44 seconds                 route53-dynamic-dns
```

### Application logs

View logs of `STDOUT` from `CONTAINER ID` (copy from output above)

```bash
docker logs [CONTAINER ID]
```

View Node.js process log, which is written to `application.log` in the `data` directory of the project root.
See: [Logs](/route53-dynamic-dns/usage/logs/) for more details.

```bash
docker exec -it [CONTAINER ID] sh
```

```bash
/usr/src/app > ls -la
/usr/src/app > tail -f data/application.log
```

If running container with `LOG_TO_STDOUT=true` you will see logs in STDOUT.

### File for caching current IP address

The current known IP address is written to `last-known-ip.txt` in the `data` directory of the project root. This file is
used to reduce the number of lookups to Route53.

```bash
docker exec -it [CONTAINER ID] sh
```

```bash
/usr/src/app > cat data/last-known-ip.txt
```
