import * as fetch from 'node-fetch';

import { constructor as loggerConstructor } from './logger';
import route53Update from './route53-updater';
import { Server } from './server';

const env = process.env;
const port = env.PORT ? parseInt(env.PORT, 10) : 8080;
const localBaseUrl = env.ROUTE53_BASEURL_LOCAL;
const route53Zone = env.ROUTE53_ZONE_LOCAL;

const logger = loggerConstructor(undefined, false, true);
const server = new Server('0.0.0.0', port, logger);

const route53Promise = route53Update(localBaseUrl, route53Zone, logger, fetch)
  .catch((err) => logger.error('Error on route53Update', err));
const serverPromise = server.start()
  .catch((err) => logger.error('Error starting server', err));

process.on('SIGINT', () => {
  process.exit();
});

Promise.all([serverPromise, route53Promise]);
