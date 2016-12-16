
import * as Boom from 'boom';
import * as Hapi from 'hapi';
import * as Joi from 'joi';
import * as path from 'path';

import { defaultGoodOptions } from './goodOptions';
import { Logger } from './logger';

const good = require('good');
const Pageres = require('pageres');

interface Options {
  renderDelay?: number;
  streamType?: string;
  windowSize?: {
    width: number;
    height: number;
  };
}

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
    if (fileName) {
      return this.handler(url, options, reply, fileName);
    } else {
      return this.streamHandler(url, options, reply);
    }
  }

  private getHandler(request: Hapi.Request, reply: Hapi.IReply) {
    const body = request.query;
    const url = body.url;
    const fileName = body.fileName;
    const options = body.options;
    if (fileName) {
      return this.handler(url, options, reply, fileName);
    } else {
      return this.streamHandler(url, options, reply);
    }
  }

  private async handler(url: string, options: Options, reply: Hapi.IReply, fileName: string) {

    this.logger.info(`Taking a screenshot of ${url}`);
    const _options = {
      delay: options.renderDelay || 0,
      format: path.extname(fileName) || options.streamType || 'png',
      filename: path.basename(fileName).replace(/\.[^.]+$/, ''),
    };
    const size = [ options.windowSize ? `${options.windowSize.width}x${options.windowSize.height}` : '1024x768' ];
    try {
      const pageRes = new Pageres(_options)
          .src(url, size, {crop: true})
          .dest(path.dirname(fileName));
      await pageRes.run();
      reply(200);
    } catch (err) {
      reply(Boom.wrap(err));
      return;
    }
  }

  private async streamHandler(url: string, options: Options, reply: Hapi.IReply) {

    this.logger.info(`Taking a screenshot of ${url}`);
    const _options = {
      delay: options.renderDelay || 0,
      format: options.streamType || 'png',
    };
    const size = [ options.windowSize ? `${options.windowSize.width}x${options.windowSize.height}` : '1024x768' ];
    try {
      const pageRes = new Pageres(_options).src(url, size, {crop: true});
      const streams = await pageRes.run();
      reply(streams[0]);
    } catch (err) {
      reply(Boom.wrap(err));
    }
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
    }]);
  };

}
