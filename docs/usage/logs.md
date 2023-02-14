# Logs

## `STDOUT`

When Node.js process starts it writes useful data to `STDOUT`. Example output:

```text
Log4js initialized with level INFO 

Logs located in application.log in /usr/src/app/data directory

If running in Docker Container use the following command to access a shell:
   docker exec -it [container_id] sh
```

If you set ENV variable `LOG_TO_STDOUT=true` then logs will send to STDOUT.

## `application.log`

Application logs are written to `data/application.log` in root project directory. Log files are compressed and archived
after reaching 10MB in size. The most recent 3 archives are kept in rotation. All other archives are deleted to keep
footprint small. This is ignored if `LOG_TO_STDOUT=true`.
