'use strict';

//Dependencies
const https = require('https');
const fs = require('fs');
const dns = require('dns');
const AWS = require('aws-sdk');
const log4js = require('log4js');
var config = require('./config.js');

//Global configuration variables set at runtime or in config.js
var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || config.aws_access_key_id;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || config.aws_secret_access_key;
var AWS_REGION = process.env.AWS_REGION || config.aws_region;
var ROUTE53_HOSTED_ZONE_ID = process.env.ROUTE53_HOSTED_ZONE_ID || config.route53_hosted_zone_id;
var ROUTE53_DOMAIN = process.env.ROUTE53_DOMAIN || config.route53_domain;
var ROUTE53_TYPE = process.env.ROUTE53_TYPE || config.route53_type;
var ROUTE53_TTL = process.env.ROUTE53_TTL || config.route53_ttl;
var SES_TO_ADDRESS = process.env.SES_TO_ADDRESS || config.ses_to_address;
var SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS || config.ses_from_address;
var SEND_EMAIL_SES = process.env.SEND_EMAIL_SES || config.send_email_ses;
var UPDATE_FREQUENCY = process.env.UPDATE_FREQUENCY || config.update_frequency;

//Local variables for the process
var LastKnownIPFileName = 'Last-Known-IP.log';
var currentIP = '';
var previousIP = '';
var SentErrorEmail = false;
var FirstRun = true;

//Set required AWS configuration variables
AWS.config.update(
    {
        region: AWS_REGION,
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
);

//Create Route53 object
var route53 = new AWS.Route53();
var ses = new AWS.SES();

//Configure logging using log4js
log4js.configure({
    appenders: {
        app: { type: 'file', filename: 'application.log' }
    },
    categories: {
        default: {
            appenders: [ 'app' ],
            level: 'info'
         }
    }
});

//Initialize logging
const logger = log4js.getLogger();
logger.level = 'info';

//Determine if file exists
var RemoveFileNameIfItExists = function (filename) {
    fs.stat(filename, function (err, stat) {
        if (err && err.code == 'ENOENT') {
            //File doesn't exist.  Create a file with currentIP
            logger.info(filename, 'does not exist.  This file is used to cache the current IP in Route53.  The file will be created when it is needed');
            DeterminePublicIP();
        }
        else {
            logger.info(filename, 'already exists and can not be trusted.');
            RemoveFileName(filename);
        }
    });
};

//Remove LastKnownIPFileName if it exists.
var RemoveFileName = function (filename) {
    fs.unlink(filename, function (err, data) {
        if (err) {
            //Unable to read file
            logger.error('Unable to remove', filename, 'Error code:', err.code);
            SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
        }
        else {
            logger.info(filename, 'removed successfully');
            DeterminePublicIP();
        }
    });
};

//Determine current public IP using OpenDNS
var DeterminePublicIP = function () {
    //Set string values back to empty
    currentIP = '';
    previousIP = '';
    
    logger.info('HTTPS GET https://diagnostic.opendns.com/myip');
    //Get public IP from OpenDNS
    https.get('https://diagnostic.opendns.com/myip', (res) => {
        logger.info('Status Code:', res.statusCode, res.statusMessage);
        res.on('data', (data) => {
            if (res.statusCode === 200) {
                //Set current IP
                currentIP += data;
                logger.info('Current Public IP (OpenDNS):', currentIP);
                FindLastKnownIPLocally();
            }
        });
    }).on('error', (err) => {
        logger.error(err);
        SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
    });
};

//Get last known IP from local file
var FindLastKnownIPLocally = function () {
    //Determine if file exists
    fs.stat(LastKnownIPFileName, function (err, stat) {
        if (err && err.code == 'ENOENT') {
            //File doesn't exist.  Create a file with currentIP
            logger.info(LastKnownIPFileName, 'does not exist.  The file will be created');

            var params = {
                HostedZoneId: ROUTE53_HOSTED_ZONE_ID,
                RecordName: ROUTE53_DOMAIN,
                RecordType: ROUTE53_TYPE,
            };

            logger.info('Initiating request to AWS Route53 (Method: testDNSAnswer) to get IP for', ROUTE53_DOMAIN, '(A Record)');
            
            route53.testDNSAnswer(params, function(err, data) {
                if (err) {
                    logger.error('Unable to lookup', ROUTE53_DOMAIN, 'in AWS Route53 using AWS-SDK!  Error data below:\n', err, err.stack);
                    SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
                }
                else {
                    previousIP += data.RecordData;
                    //In this case only set currentIP = previousIP
                    logger.info('AWS Route53 responded that', ROUTE53_DOMAIN, '(', ROUTE53_TYPE, 'Record) is pointing to', previousIP);
                    //Update LastKnownIPFileName with current IP
                    WriteCurrentIPInLastKnownIPFileName(previousIP);
                }
            });
        }
        else if (err) {
            //File exists, but some other error occurs
            logger.error('Unable to create', LastKnownIPFileName, '\n', err);
            SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
        }
        else {
            //File exists.  Read contents of file to determine previousIP
            fs.readFile(LastKnownIPFileName, function (err, data) {
                if (err) {
                    //Unable to read file
                    logger.error('Unable to read', LastKnownIPFileName, 'Error code:', err.code);
                    SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
                }
                else {
                    //Get previousIP from file
                    previousIP += data;
                    previousIP = previousIP.replace('\n', '');
                    //Determine if we need to update Route53
                    CompareCurrentIPtoLastKnownIP();
                }
            });
        }
    });
};

//Update LastKnownIPFileName with new Public IP
var WriteCurrentIPInLastKnownIPFileName = function (IPAddress) {
    fs.writeFile(LastKnownIPFileName, IPAddress, (err) => {
        if (err) {
             logger.error('Unable to write currentIP in', LastKnownIPFileName, 'Error code:', err.code);
             SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
        }
        else {
             logger.info('Updated', LastKnownIPFileName, 'with new Public IP:', IPAddress);
        }
    });
};

//Determine if Route53 needs to be updated
var CompareCurrentIPtoLastKnownIP = function () {
    if (currentIP === previousIP) {
        //They match, nothing to do
        logger.info('Current Public IP matches last known Public IP', previousIP, 'in', LastKnownIPFileName);
    }
    else {
        //They don't match, so update Route53
        logger.info('Current Public IP does not match last known Public IP\nCurrent Public IP (OpenDNS):', currentIP, '\nLast Known Public IP (', LastKnownIPFileName, '):', previousIP);
        UpdateEntryInRoute53();
    }
};

//Update AWS Route53 based on new IP address
var UpdateEntryInRoute53 = function () {
    //Prepare comment to be used in API call to AWS
    var paramsComment = null;
    paramsComment = 'Updating public IP from ' + previousIP + ' to ' + currentIP + ' based on ISP change';

    //Create params required by AWS-SDK for Route53
    var params = {
    HostedZoneId: ROUTE53_HOSTED_ZONE_ID,
    ChangeBatch: {
        Changes: [
        {
            Action: 'UPSERT',
            ResourceRecordSet: {
            Name: ROUTE53_DOMAIN,
            ResourceRecords: [
                {
                Value: currentIP
                }
            ],
            Type: ROUTE53_TYPE,
            TTL: ROUTE53_TTL,
            }
        }
        ],
        Comment: paramsComment
    }
    };

    logger.info('Initiating request to AWS Route53 (Method: changeResourceRecordSets)');

    //Make the call to update Route53 record
    route53.changeResourceRecordSets(params, function(err, data) {
        if (err) {
             logger.error('Unable to update Route53!  Error data below:\n', err, err.stack);
             SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
        }
        else {
            // Successful response
             logger.info('Request successfully submitted to AWS Route53 to update', ROUTE53_DOMAIN, '(' , ROUTE53_TYPE, 'record) with new Public IP:', currentIP, '\nAWS Route 53 response:\n', data);
            //Update LastKnownIPFileName with new Public IP
            WriteCurrentIPInLastKnownIPFileName(currentIP);
            //Send email notifying user of change
            SendEmailNotificationAWSSES('Route53', '');
            SentErrorEmail = false;
        }
    });

};

//Handles sending error email
var SendErrorNotificationEmail = function (EmailBodyErrorMessage) {
    if (!SentErrorEmail) {
        SentErrorEmail = true;
        SendEmailNotificationAWSSES('Error', EmailBodyErrorMessage);
    }
    else {
        logger.info('Email notification already sent.  Suppressing email notification to avoid spamming admin.');
    }
};

//Send email notification using AWS SES
var SendEmailNotificationAWSSES = function (EmailMessageType, EmailBodyErrorMessage) {
    if (SEND_EMAIL_SES == false) {
        logger.info('AWS SES email notification disabled.  If you want to enable, please update config.');
        return;
    }
    
    if (EmailMessageType == 'Route53') {
        var EmailSubject = '[INFO]: Route53 Public IP Updated';
        var EmailBody = 'Request successfully submitted to AWS Route53 to update ' + ROUTE53_DOMAIN + ' (' + ROUTE53_TYPE + ' record) with new Public IP: ' + currentIP;
    }
    else if (EmailMessageType == 'Error') {
        var EmailSubject = '[ERROR]: route53-dynamic-dns';
        var EmailBody = EmailBodyErrorMessage;
    }
    else {
        var EmailSubject = '[INFO]: route53-dynamic-dns Started';
        var EmailBody = "route53-dynamic-dns process was started";
    }
    
    //Set params required for AWS SES
    var params = {
        Destination: {
            BccAddresses: [ ],
            CcAddresses: [ ],
            ToAddresses: [ SES_TO_ADDRESS ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8", 
                    Data: EmailBody
                }, 
                Text: {
                    Charset: "UTF-8", 
                    Data: EmailBody
                }
            }, 
            Subject: {
                Charset: "UTF-8", 
                Data: EmailSubject
            }
        }, 
        ReplyToAddresses: [ ], 
        Source: SES_FROM_ADDRESS
    };
    
    logger.info('Initiating request to AWS SES (Method: sendEmail)');

    //Send email using AWS-SDK
    ses.sendEmail(params, function(err, data) {
        if (err) {
            logger.error('Unable to send email via AWS SES!  Error data below:\n', err, err.stack);
            SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />'+ err.stack);
        }
        else {
            logger.info('Request successfully submitted to AWS SES to send email.\n', data);
        }
    });
};

//Execute funtion every 5 minutes (300,000ms)

//Wrap up execution logic into a function
var RunScript = function () {
    if (FirstRun){
        logger.info('First run of process.')
        RemoveFileNameIfItExists(LastKnownIPFileName);
        FirstRun = false;
    }
    else {
        DeterminePublicIP();
    }
};

//Run the script at interval set in UPDATE_FREQUENCY
setInterval(RunScript, UPDATE_FREQUENCY);