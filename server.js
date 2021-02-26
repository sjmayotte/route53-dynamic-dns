'use strict'

// Dependencies
const https = require('https')
const fs = require('fs')
const AWS = require('aws-sdk')
const log4js = require('log4js')
const dotenv = require('dotenv')

// Initialize dotenv to try and load .env file
const dotenvresult = dotenv.config()

// Global configuration variables set using environment variables
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION
const ROUTE53_HOSTED_ZONE_ID = process.env.ROUTE53_HOSTED_ZONE_ID
const ROUTE53_DOMAIN = process.env.ROUTE53_DOMAIN
const ROUTE53_TYPE = process.env.ROUTE53_TYPE
const ROUTE53_TTL = process.env.ROUTE53_TTL
const SEND_EMAIL_SES = JSON.parse(process.env.SEND_EMAIL_SES || 'false')
const SES_TO_ADDRESS = process.env.SES_TO_ADDRESS
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS
const UPDATE_FREQUENCY = parseInt(process.env.UPDATE_FREQUENCY || '60000')
const IPCHECKER = process.env.IPCHECKER || 'opendns'
const LOG_TO_STDOUT = JSON.parse(process.env.LOG_TO_STDOUT || 'false')

// Setup connection info for IPCHECKER services. Other services can
// be added below in future if desired
const ipChecker = {
  opendns: {
    fullname: 'OpenDNS',
    url: 'https://diagnostic.opendns.com/myip'
  },
  'ifconfig.co': {
    fullname: 'ifconfig.co',
    url: 'https://ifconfig.co/ip'
  }
}

// Initialize logging
const logger = log4js.getLogger()
logger.level = 'info'

if (LOG_TO_STDOUT) {
  log4js.configure({
    appenders: {
      app: { type: 'stdout' }
    },
    categories: {
      default: {
        appenders: ['app'],
        level: 'info'
      }
    }
  })

  // Useful information displayed in console when process is started by NPM
  console.log('Log4js initialized with level', logger.level.levelStr, '\n\nLogging is configured to STDOUT')
} else {
  // Configure logging using log4js
  // Max log size is 10MB with rotation keeping no more than 3 backups (backups are compressed)
  log4js.configure({
    appenders: {
      app: { type: 'file', filename: 'application.log', maxLogSize: 10000000, backups: 3, compress: true }
    },
    categories: {
      default: {
        appenders: ['app'],
        level: 'info'
      }
    }
  })

  // Useful information displayed in console when process is started by NPM
  console.log('Log4js initialized with level', logger.level.levelStr, '\n\nLogs located in application.log in working directory\n\nIf running in Docker Container use the following command to access a shell:\n   docker exec -it [container_id] sh \n\n')
}

// Handle error loading required environment variables from .env file
if (dotenvresult.error) {
  logger.info('Unable to load environment variables from .env file.  Process is likely running in a container.  Make sure you pass environment variables when starting container.')
} else {
  logger.info('Successfully loaded environment variables from .env file')
}

// Determine if required environment variables are set before starting to execute process
if (typeof process.env.AWS_ACCESS_KEY_ID === 'undefined' || process.env.AWS_ACCESS_KEY_ID === null) {
  logger.error('AWS_ACCESS_KEY_ID is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for AWS_ACCESS_KEY_ID and try again.')
  throw new Error('AWS_ACCESS_KEY_ID is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for AWS_ACCESS_KEY_ID and try again.')
}
if (typeof process.env.AWS_SECRET_ACCESS_KEY === 'undefined' || process.env.AWS_SECRET_ACCESS_KEY === null) {
  logger.error('AWS_SECRET_ACCESS_KEY is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for AWS_SECRET_ACCESS_KEY and try again.')
  throw new Error('AWS_SECRET_ACCESS_KEY is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for AWS_SECRET_ACCESS_KEY and try again.')
}
if (typeof process.env.AWS_REGION === 'undefined' || process.env.AWS_REGION === null) {
  logger.error('AWS_REGION is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for AWS_REGION and try again.')
  throw new Error('AWS_REGION is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for AWS_REGION and try again.')
}
if (typeof process.env.ROUTE53_HOSTED_ZONE_ID === 'undefined' || process.env.ROUTE53_HOSTED_ZONE_ID === null) {
  logger.error('ROUTE53_HOSTED_ZONE_ID is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_HOSTED_ZONE_ID and try again.')
  throw new Error('ROUTE53_HOSTED_ZONE_ID is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_HOSTED_ZONE_ID and try again.')
}
if (typeof process.env.ROUTE53_DOMAIN === 'undefined' || process.env.ROUTE53_DOMAIN === null) {
  logger.error('ROUTE53_DOMAIN is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_DOMAIN and try again.')
  throw new Error('ROUTE53_DOMAIN is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_DOMAIN and try again.')
}
if (typeof process.env.ROUTE53_TYPE === 'undefined' || process.env.ROUTE53_TYPE === null) {
  logger.error('ROUTE53_TYPE is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_TYPE and try again.')
  throw new Error('ROUTE53_TYPE is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_TYPE and try again.')
}
if (typeof process.env.ROUTE53_TTL === 'undefined' || process.env.ROUTE53_TTL === null) {
  logger.error('ROUTE53_TTL is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_TTL and try again.')
  throw new Error('ROUTE53_TTL is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for ROUTE53_TTL and try again.')
}

// Check if the "SEND_EMAIL_SES" flag is set to true before checking SES related variables.
if (SEND_EMAIL_SES) {
  if (typeof process.env.SES_TO_ADDRESS === 'undefined' || process.env.SES_TO_ADDRESS === null) {
    logger.error('SES_TO_ADDRESS is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for SES_TO_ADDRESS and try again.')
    throw new Error('SES_TO_ADDRESS is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for SES_TO_ADDRESS and try again.')
  }
  if (typeof process.env.SES_FROM_ADDRESS === 'undefined' || process.env.SES_FROM_ADDRESS === null) {
    logger.error('SES_FROM_ADDRESS is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for SES_FROM_ADDRESS and try again.')
    throw new Error('SES_FROM_ADDRESS is undefined or null in .env file or it was not set at runtime (ex: running Docker container).  Please define value for SES_FROM_ADDRESS and try again.')
  }
}

// Local variables for the process
const LastKnownIPFileName = 'Last-Known-IP.log'
let currentIP = ''
let previousIP = ''
let SentErrorEmail = false
let FirstRun = true

// Set required configuration variables for AWS-SDK
AWS.config.update(
  {
    region: AWS_REGION,
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
)

// Create required AWS-SDK objects
const route53 = new AWS.Route53()
const ses = new AWS.SES()

// Determine if file exists
const RemoveFileNameIfItExists = function (filename) {
  fs.stat(filename, function (err, stat) {
    if (err && err.code === 'ENOENT') {
      // File doesn't exist.  Create a file with currentIP
      logger.info(filename, 'does not exist.  This file is used to cache the current IP in Route53.  The file will be created when it is needed')
      DeterminePublicIP()
    } else {
      logger.info(filename, 'already exists and can not be trusted.')
      RemoveFileName(filename)
    }
  })
}

// Remove LastKnownIPFileName if it exists.
const RemoveFileName = function (filename) {
  fs.unlink(filename, function (err, data) {
    if (err) {
      // Unable to read file
      logger.error('Unable to remove', filename, 'Error code:', err.code)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
    } else {
      logger.info(filename, 'removed successfully')
      DeterminePublicIP()
    }
  })
}

// Determine current public IP
const DeterminePublicIP = function () {
  // Set string values back to empty
  currentIP = ''
  previousIP = ''

  logger.info('HTTPS GET ' + ipChecker[IPCHECKER].url)
  // Get public IP
  https.get(ipChecker[IPCHECKER].url, (res) => {
    logger.info('Status Code:', res.statusCode, res.statusMessage)
    res.on('data', (data) => {
      if (res.statusCode === 200) {
        // Set current IP
        currentIP += data
        currentIP = currentIP.replace(/(\r\n|\n|\r)/gm, '')
        logger.info('Current Public IP (' + ipChecker[IPCHECKER].fullname + '):', currentIP)
        FindLastKnownIPLocally()
      }
    })
  }).on('error', (err) => {
    logger.error(err)
    SendErrorNotificationEmail('An error occurred that needs to be reviewed. Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
  })
}

// Get last known IP from local file
const FindLastKnownIPLocally = function () {
  // Determine if file exists
  fs.stat(LastKnownIPFileName, function (err, stat) {
    if (err && err.code === 'ENOENT') {
      // File doesn't exist.  Create a file with currentIP
      logger.info(LastKnownIPFileName, 'does not exist.  The file will be created')

      const params = {
        HostedZoneId: ROUTE53_HOSTED_ZONE_ID,
        RecordName: ROUTE53_DOMAIN,
        RecordType: ROUTE53_TYPE
      }

      logger.info('Initiating request to AWS Route53 (Method: testDNSAnswer) to get IP for', ROUTE53_DOMAIN, '(A Record)')

      route53.testDNSAnswer(params, function (err, data) {
        if (err) {
          logger.error('Unable to lookup', ROUTE53_DOMAIN, 'in AWS Route53 using AWS-SDK!  Error data below:\n', err, err.stack)
          SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
        } else {
          previousIP += data.RecordData
          // In this case only set currentIP = previousIP
          logger.info('AWS Route53 responded that', ROUTE53_DOMAIN, '(', ROUTE53_TYPE, 'Record) is pointing to', previousIP)
          // Update LastKnownIPFileName with current IP
          WriteCurrentIPInLastKnownIPFileName(previousIP)
        }
      })
    } else if (err) {
      // File exists, but some other error occurs
      logger.error('Unable to create', LastKnownIPFileName, '\n', err)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
    } else {
      // File exists.  Read contents of file to determine previousIP
      fs.readFile(LastKnownIPFileName, function (err, data) {
        if (err) {
          // Unable to read file
          logger.error('Unable to read', LastKnownIPFileName, 'Error code:', err.code)
          SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
        } else {
          // Get previousIP from file
          previousIP += data
          previousIP = previousIP.replace('\n', '')
          // Determine if we need to update Route53
          CompareCurrentIPtoLastKnownIP()
        }
      })
    }
  })
}

// Update LastKnownIPFileName with new Public IP
const WriteCurrentIPInLastKnownIPFileName = function (IPAddress) {
  fs.writeFile(LastKnownIPFileName, IPAddress, (err) => {
    if (err) {
      logger.error('Unable to write currentIP in', LastKnownIPFileName, 'Error code:', err.code)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
    } else {
      logger.info('Updated', LastKnownIPFileName, 'with new Public IP:', IPAddress)
    }
  })
}

// Determine if Route53 needs to be updated
const CompareCurrentIPtoLastKnownIP = function () {
  if (currentIP === previousIP) {
    // They match, nothing to do
    logger.info('Current Public IP matches last known Public IP', previousIP, 'in', LastKnownIPFileName)
  } else {
    // They don't match, so update Route53
    logger.info('Current Public IP does not match last known Public IP\nCurrent Public IP (' + ipChecker[IPCHECKER].fullname + '):', currentIP, '\nLast Known Public IP (', LastKnownIPFileName, '):', previousIP)
    UpdateEntryInRoute53()
  }
}

// Update AWS Route53 based on new IP address
const UpdateEntryInRoute53 = function () {
  // Prepare comment to be used in API call to AWS
  let paramsComment = null
  paramsComment = 'Updating public IP from ' + previousIP + ' to ' + currentIP + ' based on ISP change'

  // Create params required by AWS-SDK for Route53
  const params = {
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
            TTL: ROUTE53_TTL
          }
        }
      ],
      Comment: paramsComment
    }
  }

  logger.info('Initiating request to AWS Route53 (Method: changeResourceRecordSets)')

  // Make the call to update Route53 record
  route53.changeResourceRecordSets(params, function (err, data) {
    if (err) {
      logger.error('Unable to update Route53!  Error data below:\n', err, err.stack)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
    } else {
      // Successful response
      logger.info('Request successfully submitted to AWS Route53 to update', ROUTE53_DOMAIN, '(', ROUTE53_TYPE, 'record) with new Public IP:', currentIP, '\nAWS Route 53 response:\n', data)
      // Update LastKnownIPFileName with new Public IP
      WriteCurrentIPInLastKnownIPFileName(currentIP)
      // Send email notifying user of change
      SendEmailNotificationAWSSES('Route53', '')
      SentErrorEmail = false
    }
  })
}

// Handles sending error email
const SendErrorNotificationEmail = function (EmailBodyErrorMessage) {
  if (!SentErrorEmail) {
    SentErrorEmail = true
    SendEmailNotificationAWSSES('Error', EmailBodyErrorMessage)
  } else {
    logger.info('Email notification already sent.  Suppressing email notification to avoid spamming admin.')
  }
}

// Send email notification using AWS SES
const SendEmailNotificationAWSSES = function (EmailMessageType, EmailBodyErrorMessage) {
  // Skip sending SES email if the flag is set to false.
  if (!SEND_EMAIL_SES) {
    logger.info('AWS SES email notification disabled.  If you want to enable, please update config.')
    return
  }

  // Set params required for AWS SES
  const params = {
    Destination: {
      BccAddresses: [],
      CcAddresses: [],
      ToAddresses: [SES_TO_ADDRESS]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: ''
        },
        Text: {
          Charset: 'UTF-8',
          Data: ''
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: ''
      }
    },
    ReplyToAddresses: [],
    Source: SES_FROM_ADDRESS
  }

  switch (EmailMessageType) {
    case 'Route53':
      params.Message.Subject.Data = '[INFO]: Route53 Public IP Updated'
      params.Message.Body.Html.Data = 'Request successfully submitted to AWS Route53 to update ' + ROUTE53_DOMAIN + ' (' + ROUTE53_TYPE + ' record) with new Public IP: ' + currentIP
      params.Message.Body.Text.Data = 'Request successfully submitted to AWS Route53 to update ' + ROUTE53_DOMAIN + ' (' + ROUTE53_TYPE + ' record) with new Public IP: ' + currentIP
      break
    case 'Error':
      params.Message.Subject.Data = '[ERROR]: route53-dynamic-dns'
      params.Message.Body.Html.Data = EmailBodyErrorMessage
      params.Message.Body.Text.Data = EmailBodyErrorMessage
      break
    default:
      params.Message.Subject.Data = '[INFO]: route53-dynamic-dns Started'
      params.Message.Body.Html.Data = 'route53-dynamic-dns process was started'
      params.Message.Body.Text.Data = 'route53-dynamic-dns process was started'
      break
  }

  logger.info('Initiating request to AWS SES (Method: sendEmail)')

  // Send email using AWS-SDK
  ses.sendEmail(params, function (err, data) {
    if (err) {
      logger.error('Unable to send email via AWS SES!  Error data below:\n', err, err.stack)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
    } else {
      logger.info('Request successfully submitted to AWS SES to send email.\n', data)
    }
  })
}

// Wrap up execution logic into a function
const RunScript = function () {
  if (FirstRun) {
    logger.info('First run of process.')
    RemoveFileNameIfItExists(LastKnownIPFileName)
    FirstRun = false
  } else {
    DeterminePublicIP()
  }
}

// Execute function RunScript at interval set in UPDATE_FREQUENCY (ex: 60000, which equals 60 seconds or 1 minute)
setInterval(RunScript, UPDATE_FREQUENCY)
