
import { constructor as loggerConstructor } from './logger';
import { Server } from './server';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const logger = loggerConstructor(undefined, false, true);
const server = new Server('0.0.0.0', port, logger);

process.on('SIGINT', function() {
  process.exit();
});

server.start().catch((err) => {
  console.log(err);
  server.logger.error('Error starting server');
});
