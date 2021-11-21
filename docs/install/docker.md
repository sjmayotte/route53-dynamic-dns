# Docker
Image is built from official [`node:alpine`](https://hub.docker.com/_/node/) image, which runs on the popular [Alpine Linux project](http://alpinelinux.org). Alpine Linux is much smaller than most distribution base images (~5MB), which leads to much slimmer images in general.  If you are not familiar with Docker, please start by reading [Getting Started](https://docs.docker.com/get-started/) section of [Official Docker Documentation](https://docs.docker.com/).

## Versions
### `route53-dynamic-dns:latest`
Points to `latest` stable version.  Every attempt is made to keep releases backwards compatible.  Project follows [Semantic Versioning](https://semver.org/).  You can expect breaking changes may exist in MAJOR versions (1.X.X -> 2.X.X), but they should not exist in MINOR and PATCH versions.  Since project inception there has not been a release that is not backwards compatible.  The code base is stable.  There is no expectation of issues with backwards compatibility in future versions, but everyone should be aware of how versions are managed.  For most people looking to be hands off on upgrades, it should be safe to use `latest` version.  If your primary concern is stability, it is recommended that you use a specific version (see below).

### `route53-dynamic-dns:v1.2.1`
Stable version built from tag `v1.2.1`.  The code is also available as [GitHub Release](https://github.com/sjmayotte/route53-dynamic-dns/releases) with tag `v1.2.1`.

### `route53-dynamic-dns:dev`
Automated build triggers with every `git push` to `master` branch.  This version is not guarenteed to be stable.  If you are looking for a stable version, please use `route53-dynamic-dns:v1.2.1` or `route53-dynamic-dns:latest`.

## Pull Image
Pull image from DockerHub.  Replace `[version]` with desired version (ex: `v1.2.1`).
```bash
$ docker pull sjmayotte/route53-dynamic-dns:[verison]
```