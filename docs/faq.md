#FAQ

##I'm using `opendns` and started getting an error
In October 2021, users started experiencing connection issues to openDNS.  It appears the server for diagnostic.opendns.com is configured incorrectly and the server's certificate chain is incomplete.  This is causing a verification error.  Rather than try and download the missing cert in the code I decided it's better to change the default to ifconfig.co and point opendns to ipify.org in the code to support backwards compatibility.  This change was made and released as version 1.2.1 in November 2021.  It will remain in effect until openDNS resolves their issue.  More information is available in [this reported issue](https://github.com/sjmayotte/route53-dynamic-dns/issues/18)

##I keep getting an error and the process won't run
Check to make sure all variables are set properly in `.env` or passed properly into the Docker Container at runtime.  Review the documentation on [Environment Variables](/route53-dynamic-dns/config/env/) and [Docker Usage](/route53-dynamic-dns/usage/docker/)