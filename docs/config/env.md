# Environment Variables

Environment variables are required to run the process.

    -----------------------------------------------------------------------
    VARIABLE                TYPE        COMMENTS
    -----------------------------------------------------------------------
    AWS_ACCESS_KEY_ID       string      AWS Access Key for IAM user
    AWS_SECRET_ACCESS_KEY   string      AWS Secret Access Key for IAM user
    AWS_REGION              string      AWS Region; ex: "us-east-1"
    ROUTE53_HOSTED_ZONE_ID  string      AWS Route53 Hosted Zone ID; ex: "Z25S75OFY0ERQD"
    ROUTE53_DOMAIN          string      AWS Route53 FQDN; ex: "home.example.com"
    ROUTE53_TYPE            string      AWS Route 53 record type for FQDN; ex: "A"
    ROUTE53_TTL             integer     AWS Route 53 TTL in seconds for FQDN; ex: 60
    SEND_EMAIL_SES          boolean     Case sensitive, default: `false` - use AWS SES to send notification email. ex: true
    SES_TO_ADDRESS          string      If SEND_EMAIL_SES = true then required, 'To' address for email; ex: "admin@example.com"
    SES_FROM_ADDRESS        string      If SEND_EMAIL_SES = true then `required`, 'To' address for email; ex: "admin@example.com"
    UPDATE_FREQUENCY        integer     default: `60000 (1m)` - Interval in Milliseconds to check if Public IP has changed; ex: 60000 (which is every minute)
    IPCHECKER               string      default: `ifconfig.co` - Public IP checker service. 'ifconfig.co', 'ipify.org' or 'custom' (see IPCHECKER_CUSTOM_URL below). See note below for 'opendns'
    IPCHECKER_CUSTOM_URL    string      If IPCHECKER = custom then `required`. URL to perform HTTP get request to in order to obtain external IP. Server is expected to return the IP as plain text and nothing else.
    LOG_TO_STDOUT           boolean     Case sensitive, default: `false` - Flag to set log to STDOUT rather than to the application log file.

For help setting up IAM user access see [AWS Javascript SDK - Getting Started](http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-nodejs.html).

As of November 2021, 'opendns' option is not working because the server's certificate chain is incomplete.  The latest release temporarily points 'opendns' option to 'ipify.org'.  This change will be removed after server config is fixed.  More info in [this issue](https://github.com/sjmayotte/route53-dynamic-dns/issues/18#issuecomment-971780716).


### Minimium ENV Variables
Run with default values

    AWS_ACCESS_KEY_ID=[SECRET]
    AWS_SECRET_ACCESS_KEY=[SECRET]
    AWS_REGION=[REGION]
    ROUTE53_HOSTED_ZONE_ID=[value]
    ROUTE53_DOMAIN=[value]
    ROUTE53_TYPE=[value]
    ROUTE53_TTL=[value]


### Enable SES Emails
Run with SES Emails.  Make sure IAM policy exists to use SES services.  See [AWS Services](/route53-dynamic-dns/config/aws/#ses)

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


### Full Configuration
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
