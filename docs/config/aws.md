# AWS Services

## Minimum AWS IAM Policy
Below are examples of minimium IAM policies for Route53 and SES

### Route53
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "route53policy1",
            "Effect": "Allow",
            "Action": "route53:ChangeResourceRecordSets",
            "Resource": "arn:aws:route53:::hostedzone/*"
        },
        {
            "Sid": "route53policy2",
            "Effect": "Allow",
            "Action": "route53:TestDNSAnswer",
            "Resource": "*"
        }
    ]
}
```
### SES
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