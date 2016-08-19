
import * as Boom from 'boom';
import * as Hapi from 'hapi';
import * as Joi from 'joi';

import { defaultGoodOptions } from './goodOptions';
import { Logger } from './logger';

const good = require('good');
const bluebird = require('bluebird');
const _webshot = require('webshot');
const temp = require('temp');
const inert = require('inert');
const webshot = bluebird.promisify(_webshot);

export class Server {

  public readonly logger: Logger;

  private server: Hapi.Server;
  private port: number;
  private host: string;
  private goodOptions: any;

  constructor(host: string, port: number, logger: Logger, goodOptions?: any) {
    this.host = host;
    this.port = port;
    this.logger = logger;

    const options = {};
    const server = new Hapi.Server(options);
    server.connection({
      host: this.host,
      port: this.port,
    });
    this.setRoutes(server);
    this.server = server;
    this.goodOptions = goodOptions || defaultGoodOptions;

  }

  private setRoutes(server: Hapi.Server) {
    server.route([{
      method: 'POST',
      path: '/',
      handler: this.postHandler.bind(this),
      config: {
        validate: {
          payload: {
            url: Joi.string().min(3).required(),
            fileName: Joi.string().optional(),
            options: Joi.object().default({streamType: 'png'}),
          },
        },
      },
    }, {
      method: 'GET',
      path: '/',
      handler: this.getHandler.bind(this),
      config: {
        validate: {
          query: {
            url: Joi.string().min(3).required(),
            fileName: Joi.string().optional(),
            options: Joi.object().default({}),
          },
        },
      },
    }]);
  }

  private postHandler(request: Hapi.Request, reply: Hapi.IReply) {
    const body = request.payload;
    const url = body.url;
    const fileName = body.fileName;
    const options = body.options;
    return this.handler(url, options, reply, fileName);
  }
  private getHandler(request: Hapi.Request, reply: Hapi.IReply) {
    const body = request.query;
    const url = body.url;
    const fileName = body.fileName;
    const options = body.options;
    return this.handler(url, options, reply, fileName);

  }

  private async handler(url: string, options: any, reply: Hapi.IReply, fileName?: string) {

    this.logger.info(`Taking a screenshot of ${url}`);
    if (fileName) {
      try {
        await webshot(url, fileName, options);
        reply(200);
      } catch (err) {
        reply(Boom.wrap(err));
      }
      return;
    }
    const imgType = options.streamType || 'png';
    const tempName = temp.path({ suffix: '.' + imgType });
    try {
      await webshot(url, tempName, options);
    } catch (err) {
      reply(Boom.wrap(err));
      return;
    }

    reply.file(tempName, { confine: false, etagMethod: false } as any);
  }

  public async start(): Promise<Hapi.Server> {

    const server = this.server;
    await this.loadBasePlugins(server);
    await server.start();

    this.logger.info(`Screenshotter running at: ${server.info.uri}`);
    return server;
  };

  private async loadBasePlugins(server: Hapi.Server) {

    await server.register([{
      options: this.goodOptions,
      register: good,
    },
    {
      register: inert,
    }]);
  };

}
