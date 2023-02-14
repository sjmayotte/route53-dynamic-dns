# Node.js Process

## Run Process

Start Node.js process which will run forever (or until process is stopped by user).

```bash
npm start
```

## Application logs

The Node.js process writes useful data to log files. See [Logs](/route53-dynamic-dns/usage/logs/) section for more
information.

## File for caching current IP address

The current known IP address is written to `last-known-ip.txt` in the `data` directory of the project root. This file is
used to reduce the number of lookups to Route53.

```bash
cat data/last-known-ip.txt
```
