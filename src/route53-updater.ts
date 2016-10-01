import * as _fetch from 'node-fetch';

import { Logger } from './logger';

type Fetch = typeof _fetch;

const route53Updater = require('route53-updater');
// The IP below is the IP for the AWS metadata URL
const ec2IpUrl = 'http://169.254.169.254/latest/meta-data/local-ipv4';

export default async function route53Update(
  baseUrl: string,
  hostedZoneId: string,
  logger: Logger,
  fetch: Fetch,
  retryDelay = 200,
  maxTimes = 5) {

  if (!baseUrl) {
    logger.info('[route53Update] Base url undefined, skipping update.');
    return false;
  }

  if (!hostedZoneId) {
    logger.info('[route53Update] Zone undefined, skipping update.');
    return false;
  }

  // See if we are running on AWS
  let ip: string = '<undefined>';
  try {
    const response = await (<any> fetch)(ec2IpUrl, {timeout: 500});
    ip = await response.text();
  } catch (err) {
    logger.info('[route53Update] Not running on EC2, skipping update');
    return false;
  }
  const recordSetName = baseUrl.replace(/\.$/, '') + '.';
  let success = false;
  let i = 0;
  while (!success && i < maxTimes) {
    i++;
    try {
      await new Promise((resolve, reject) => {
        const callback = (err: any) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        };
        route53Updater('UPDATE', {
          hostedZoneId,
          recordSetName,
          type: 'A',
          ttl: 5,
          metadata: 'local-ipv4',
        }, callback);
      });
      logger.info(`[route53Update] Updated record for ${baseUrl} to ${ip}.`);
      success = true;
    } catch (err) {
      logger.info(`[route53Update] ${err.message}.`);
      if (typeof err.retryable === 'boolean' && !err.retryable) {
        i = maxTimes;
      }
      if (i < maxTimes) {
        logger.info(`[route53Update] Trying again in ${retryDelay}ms.`);
        await sleep(retryDelay);
      }
    }
  }
  return success;
}

function sleep(ms = 0) {
  return new Promise(r => setTimeout(r, ms));
}
