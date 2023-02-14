# Environment Variables

Environment variables are required to run the process.

<!-- markdownlint-disable line-length -->

| VARIABLE                 | TYPE      | Required                                              | COMMENTS                                                                                                                                                             |
|--------------------------|-----------|-------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `AWS_ACCESS_KEY_ID`      | `string`  | Yes                                                   | AWS Access Key for IAM user                                                                                                                                          |
| `AWS_SECRET_ACCESS_KEY`  | `string`  | Yes                                                   | AWS Secret Access Key for IAM user                                                                                                                                   |
| `AWS_REGION`             | `string`  | Yes                                                   | AWS Region; ex: `us-east-1`                                                                                                                                          |
| `ROUTE53_HOSTED_ZONE_ID` | `string`  | Yes                                                   | AWS Route53 Hosted Zone ID; ex: `Z25S75OFY0ERQD`                                                                                                                     |
| `ROUTE53_DOMAIN`         | `string`  | Yes                                                   | AWS Route53 FQDN; ex: `home.example.com` or multiple domains separated by comma `home.example.com, *.home.example.com`                                               |
| `ROUTE53_TYPE`           | `string`  | Yes                                                   | AWS Route 53 record type for FQDN; ex: `A`                                                                                                                           |
| `ROUTE53_TTL`            | `integer` | Yes                                                   | AWS Route 53 TTL in seconds for FQDN; ex: `60`                                                                                                                       |
| `SEND_EMAIL_SES`         | `boolean` | No (default: `false`)                                 | Case sensitive, use AWS SES to send notification email. ex: `true`                                                                                                   |
| `SES_TO_ADDRESS`         | `string`  | Yes if `SEND_EMAIL_SES = true`                        | 'To' address for email; ex: `admin@example.com`                                                                                                                      |
| `SES_FROM_ADDRESS`       | `string`  | Yes if `SEND_EMAIL_SES = true`                        | 'From' address for email; ex: `admin@example.com`                                                                                                                    |
| `UPDATE_FREQUENCY`       | `integer` | No (default: `60000`)                                 | Interval in milliseconds to check if Public IP has changed; ex: `60000` (which is every minute)                                                                      |
| `IPCHECKER`              | `string`  | No (default: `ifconfig.co`)                           | Public IP checker service. `ifconfig.co` or `ipify.org`.  See note below for 'opendns'                                                                               |
| `LOG_TO_STDOUT`          | `boolean` | No (default: `false`)                                 | Case sensitive, use to set log to STDOUT rather than to the application log file. ex: `true`                                                                         |
| `TZ`                     | `string`  | No (default: `UTC`, which is default in Alpine Linux) | Timezone for docker container and logs.  See [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones),  ex: `America/New_York` |

<!-- markdownlint-enable line-length -->

For help setting up IAM user access
see [AWS Javascript SDK - Getting Started](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-nodejs.html).

When multiple domains are specified, same Public IP will be updated for each domain.

As of November 2021, 'opendns' option is not working because the server's certificate chain is incomplete. The latest
release temporarily points 'opendns' option to 'ipify.org'. This change will be removed after server config is fixed.
More info in [this issue](https://github.com/sjmayotte/route53-dynamic-dns/issues/18#issuecomment-971780716).

## Minimum ENV Variables

Run with default values

    AWS_ACCESS_KEY_ID=[SECRET]
    AWS_SECRET_ACCESS_KEY=[SECRET]
    AWS_REGION=[REGION]
    ROUTE53_HOSTED_ZONE_ID=[value]
    ROUTE53_DOMAIN=[value]
    ROUTE53_TYPE=[value]
    ROUTE53_TTL=[value]

## Enable SES Emails

Run with SES Emails. Make sure IAM policy exists to use SES services.
See [AWS Services](/route53-dynamic-dns/config/aws/#ses)

    AWS_ACCESS_KEY_ID=[SECRET]
    AWS_SECRET_ACCESS_KEY=[SECRET]
    AWS_REGION=[REGION]
    ROUTE53_HOSTED_ZONE_ID=[value]
    ROUTE53_DOMAIN=[value]
    ROUTE53_TYPE=[value]
    ROUTE53_TTL=[value]
    SEND_EMAIL_SES=true
    SES_TO_ADDRESS=[value]
    SES_FROM_ADDRESS=[value]

## Full Configuration

Run with all options (`LOG_TO_STDOUT=true` is recommended setting in container)

    AWS_ACCESS_KEY_ID=[SECRET]
    AWS_SECRET_ACCESS_KEY=[SECRET]
    AWS_REGION=[REGION]
    ROUTE53_HOSTED_ZONE_ID=[value]
    ROUTE53_DOMAIN=[value]
    ROUTE53_TYPE=[value]
    ROUTE53_TTL=[value]
    SEND_EMAIL_SES=[true or false]
    SES_TO_ADDRESS=[if SEND_EMAIL_SES = true then value else empty]
    SES_FROM_ADDRESS=[if SEND_EMAIL_SES = true then value else empty]
    UPDATE_FREQUENCY=60000
    IPCHECKER=ifconfig.co
    LOG_TO_STDOUT=false
    TZ=America/New_York
