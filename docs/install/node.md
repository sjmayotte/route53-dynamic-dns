# Node.js Process

Steps below assume you have Node.js and NPM installed on machine. If you do not,
please [download and install Node.js and NPM](https://nodejs.org/en/download/) before proceeding.

## Download Release

Download release `version` from [release repository](https://github.com/sjmayotte/route53-dynamic-dns/releases). For
example, you can use `v1.2.1.tar.gz` to download source for release tag `v1.2.1`.

```bash
curl -sL https://github.com/sjmayotte/route53-dynamic-dns/archive/[version] | tar xz
cd route53-dynamic-dns
```

## Set Environment Variables

You have the option to pass [environment variables](/route53-dynamic-dns/config/env/) at runtime or populate environment
variables in `.env`. Release package includes `.env.example`, which can be renamed to `.env` and populated with values.
The process expects `.env` will be in root of directory structure.

```bash
cp .env.example .env
vi .env
# Update .env with values and save file
rm .env.example
```

See [Minimum ENV Variables](/route53-dynamic-dns/config/env/#minimum-env-variables) for example of minimium
configuration.

## Installation

Project uses [NPM](https://www.npmjs.com) package manager. Install dependencies from `package.json`.

```bash
npm install
```
