'use strict'

// Dependencies
const https = require('https')
const fs = require('fs')
const path = require('path')
const log4js = require('log4js')
const dotenv = require('dotenv')
const { Route53Client, TestDNSAnswerCommand, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53')
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')

// Initialize dotenv to try and load .env file
const dotenvresult = dotenv.config()

// Global configuration variables set using environment variables
const ROUTE53_HOSTED_ZONE_ID = process.env.ROUTE53_HOSTED_ZONE_ID
const ROUTE53_DOMAIN = process.env.ROUTE53_DOMAIN
const ROUTE53_TYPE = process.env.ROUTE53_TYPE
const ROUTE53_TTL = process.env.ROUTE53_TTL
const SEND_EMAIL_SES = JSON.parse(process.env.SEND_EMAIL_SES || 'false')
const SES_TO_ADDRESS = process.env.SES_TO_ADDRESS
const SES_FROM_ADDRESS = process.env.SES_FROM_ADDRESS
const UPDATE_FREQUENCY = parseInt(process.env.UPDATE_FREQUENCY || '60000')
const IPCHECKER = process.env.IPCHECKER || 'ifconfig.co'
const LOG_TO_STDOUT = JSON.parse(process.env.LOG_TO_STDOUT || 'false')
const dataFolderPath = path.resolve(path.join(__dirname, 'data'))

// Setup connection info for IPCHECKER services. Other services can
// be added below in future if desired
// Temporarily pointing opendns to ipify.org url for backwards compatability.
// This will be updated back to https://diagnostic.opendns.com/myip when server
// configuration is fixed
const ipChecker = {
  opendns: {
    fullname: 'ipify.org',
    url: 'https://api.ipify.org'
  },
  'ifconfig.co': {
    fullname: 'ifconfig.co',
    url: 'https://ifconfig.co/ip'
  },
  'ipify.org': {
    fullname: 'ipify.org',
    url: 'https://api.ipify.org'
  }
}

// Make sure folder for application logs and last known IP address exists when running directly from Node
try {
  if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath)
  }
} catch (err) {
  console.error('Error creating data folder for logs and temp files: ' + err)
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
  // noinspection JSUnresolvedVariable
  console.log('Log4js initialized with level', logger.level.levelStr, '\n\nLogging is configured to STDOUT')
} else {
  // Configure logging using log4js
  // Max log size is 10MB with rotation keeping no more than 3 backups (backups are compressed)
  log4js.configure({
    appenders: {
      app: {
        type: 'file',
        filename: path.join(dataFolderPath, 'application.log'),
        maxLogSize: 10000000,
        backups: 3,
        compress: true
      }
    },
    categories: {
      default: {
        appenders: ['app'],
        level: 'info'
      }
    }
  })

  // Useful information displayed in console when process is started by NPM
  // noinspection JSUnresolvedVariable
  console.log('Log4js initialized with level', logger.level.levelStr, '\n\nLogs located in application.log in', dataFolderPath, 'directory\n\nIf running in Docker Container use the following command to access a shell:\n   docker exec -it [container_id] sh \n\n')
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
const LastKnownIPFileName = path.join(dataFolderPath, 'last-known-ip.txt')
let currentIP = ''
let previousIP = ''
const route53Domains = ROUTE53_DOMAIN.split(',').map(domain => domain.trim())
const firstRoute53Domain = route53Domains[0]
let SentErrorEmail = false
let FirstRun = true

/**
 Create clients for AWS services.
 Note that there are multiple ways of configuring AWS region and credentials in AWS SDK v3.
 Since we already got AWS_REGION, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY into environment variables,
 AWS SDK will automatically detect and read those.
 See https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/configuring-the-jssdk.html
 */
const route53Client = new Route53Client({})
const sesClient = new SESClient({})

// Determine if file exists
const RemoveFileNameIfItExists = function (filename) {
  fs.stat(filename, function (err) {
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
  fs.unlink(filename, function (err) {
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

  // Remove when OpenDNS cert issue is fixed
  if (IPCHECKER === 'opendns') {
    logger.info('OpenDNS option temporarily pointing to ipify.org because of cert issue; see: https://github.com/sjmayotte/route53-dynamic-dns/issues/18')
  }

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
  fs.stat(LastKnownIPFileName, function (err) {
    if (err && err.code === 'ENOENT') {
      // File doesn't exist.  Create a file with currentIP retrieved from Route53
      logger.info(LastKnownIPFileName, 'does not exist.  The file will be created')
      logger.info('Initiating request to AWS Route53 (Method: testDNSAnswer) to get IP for', firstRoute53Domain, '(', ROUTE53_TYPE, 'Record )')

      // Create AWS SDK command to retrieve current IP for Route53 record
      const testDNSAnswerCommand = new TestDNSAnswerCommand({
        HostedZoneId: ROUTE53_HOSTED_ZONE_ID,
        RecordName: firstRoute53Domain,
        RecordType: ROUTE53_TYPE
      })
      // Send the command by using the AWS SDK client for Route53, using the promise pattern
      route53Client
        .send(testDNSAnswerCommand)
        .then((data) => {
          // Successful response
          previousIP += data.RecordData
          // In this case only set currentIP = previousIP
          logger.info('AWS Route53 responded that', firstRoute53Domain, '(', ROUTE53_TYPE, 'Record ) is pointing to', previousIP)
          // Update LastKnownIPFileName with current IP
          WriteCurrentIPInLastKnownIPFileName(previousIP)
        })
        .catch((err) => {
          logger.error('Unable to lookup', firstRoute53Domain, 'in AWS Route53 using AWS-SDK!  Error data below:\n', err, err.stack)
          SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
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
    // Update Route53 for each domain (if more than one supplied in config)
    route53Domains.forEach(route53Domain => UpdateEntryInRoute53(route53Domain))
  }
}

// Update AWS Route53 based on new IP address
const UpdateEntryInRoute53 = function (route53Domain) {
  logger.info('Initiating request to AWS Route53 (Method: changeResourceRecordSets) for domain', route53Domain)

  // Create AWS SDK command for changing the Route53 record
  const changeResourceRecordSetsCommand = new ChangeResourceRecordSetsCommand({
    HostedZoneId: ROUTE53_HOSTED_ZONE_ID,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: route53Domain,
            ResourceRecords: [
              {
                Value: currentIP
              }
            ],
            Type: ROUTE53_TYPE,
            TTL: parseInt(ROUTE53_TTL)
          }
        }
      ],
      Comment: 'Updating public IP from ' + previousIP + ' to ' + currentIP + ' based on ISP change'
    }
  })
  // Send the command by using the AWS SDK client for Route53, using the promise pattern
  route53Client
    .send(changeResourceRecordSetsCommand)
    .then((data) => {
      // Successful response
      logger.info('Request successfully submitted to AWS Route53 to update', route53Domain, '(', ROUTE53_TYPE, 'record) with new Public IP:', currentIP, '\nAWS Route 53 response:\n', data)
      // Update LastKnownIPFileName with new Public IP
      WriteCurrentIPInLastKnownIPFileName(currentIP)
      // Send email notifying user of change
      SendEmailNotificationAWSSES('Route53', '', route53Domain)
      SentErrorEmail = false
    })
    .catch((err) => {
      logger.error('Unable to update Route53 for domain', route53Domain, '!  Error data below:\n', err, err.stack)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
    })
}

// Handles sending error email
const SendErrorNotificationEmail = function (EmailBodyErrorMessage) {
  if (!SentErrorEmail) {
    SentErrorEmail = true
    SendEmailNotificationAWSSES('Error', EmailBodyErrorMessage, '')
  } else {
    logger.info('Email notification already sent.  Suppressing email notification to avoid spamming admin.')
  }
}

// Send email notification using AWS SES
const SendEmailNotificationAWSSES = function (EmailMessageType, EmailBodyErrorMessage, route53Domain) {
  // Skip sending SES email if the flag is set to false.
  if (!SEND_EMAIL_SES) {
    logger.info('AWS SES email notification disabled.  If you want to enable, please update config.')
    return
  }

  logger.info('Initiating request to AWS SES (Method: sendEmail)')

  // Set params required for AWS SES
  const commandInput = {
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
      commandInput.Message.Subject.Data = '[INFO]: Route53 Public IP Updated for ' + route53Domain
      commandInput.Message.Body.Html.Data = 'Request successfully submitted to AWS Route53 to update ' + route53Domain + ' (' + ROUTE53_TYPE + ' record) with new Public IP: ' + currentIP
      commandInput.Message.Body.Text.Data = 'Request successfully submitted to AWS Route53 to update ' + route53Domain + ' (' + ROUTE53_TYPE + ' record) with new Public IP: ' + currentIP
      break
    case 'Error':
      commandInput.Message.Subject.Data = '[ERROR]: route53-dynamic-dns'
      commandInput.Message.Body.Html.Data = EmailBodyErrorMessage
      commandInput.Message.Body.Text.Data = EmailBodyErrorMessage
      break
    default:
      commandInput.Message.Subject.Data = '[INFO]: route53-dynamic-dns Started'
      commandInput.Message.Body.Html.Data = 'route53-dynamic-dns process was started'
      commandInput.Message.Body.Text.Data = 'route53-dynamic-dns process was started'
      break
  }
  // Create AWS SDK command for sending email
  const sendEmailCommand = new SendEmailCommand(commandInput)
  // Send the command by using the AWS SDK client for Route53, using the promise pattern
  sesClient
    .send(sendEmailCommand)
    .then((data) => {
      logger.info('Request successfully submitted to AWS SES to send email.\n', data)
    })
    .catch((err) => {
      logger.error('Unable to send email via AWS SES!  Error data below:\n', err, err.stack)
      SendErrorNotificationEmail('An error occurred that needs to be reviewed.  Here are logs that are immediately available.<br /><br />' + err.message + '<br /><br />' + err.stack)
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
const intervalId = setInterval(RunScript, UPDATE_FREQUENCY)

// Shutdown by clearing recurring call to RunScript and return when complete
const shutdown = () => {
  logger.info('Stopping server.js process with id ' + intervalId + '...')
  clearInterval(intervalId)
}

// Gracefully shutdown process by trapping SIGINT and SIGTERM signals
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
