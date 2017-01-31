
import * as Boom from 'boom';
import * as Hapi from 'hapi';
import * as Joi from 'joi';
import * as path from 'path';
import { Readable } from 'stream';

import { defaultGoodOptions } from './goodOptions';
import { Logger } from './logger';

const good = require('good');
const Pageres = require('pageres');

interface WebshotOptions {
  renderDelay?: number; // in milliseconds
  streamType?: string;
  windowSize?: {
    width: number;
    height: number;
  };
}

interface PageresOptions {
  delay: number; // defaults to 0, in seconds
  format: string; // defaults to png
  filename?: string;
}

function webshotToPageres(
  webshotOptions: WebshotOptions,
  fileName?: string,
): { options: PageresOptions, size: string } {
  let options = {
    delay: webshotOptions.renderDelay ? Math.round(webshotOptions.renderDelay / 1000) : 0,
    format: webshotOptions.streamType || 'png',
  };
  let size = '1024x768';
  if (webshotOptions.windowSize) {
    size = `${webshotOptions.windowSize.width}x${webshotOptions.windowSize.height}`;
  }
  if (fileName) {
    options = {
      ...options,
      format: path.extname(fileName).replace(/^\./, '') || webshotOptions.streamType || 'png',
      filename: path.basename(fileName).replace(/\.[^.]+$/, ''),
    };
  }
  return { options, size };
}

export function grab(url: string, webshotOptions: WebshotOptions, fileName?: string): Promise<Readable[]> {
    const {options, size} = webshotToPageres(webshotOptions, fileName);
    const pageRes = new Pageres(options)
        .src(url, [size], { crop: true });
    if (fileName) {
      pageRes.dest(path.dirname(fileName));
    }
    return pageRes.run();
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
      handler: this.handler.bind(this, true),
      config: {
        validate: {
          payload: {
            url: Joi.string().min(3).required(),
            fileName: Joi.string().optional(),
            options: Joi.object().default({ streamType: 'png' }),
          },
        },
      },
    }, {
      method: 'GET',
      path: '/',
      handler: this.handler.bind(this, false),
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

  private handler(isPost: boolean, request: Hapi.Request, reply: Hapi.IReply) {
    const body = isPost ? request.payload : request.query;
    const url = body.url;
    const fileName = body.fileName;
    const options = body.options;
    if (fileName) {
      return this.saveHandler(url, options, reply, fileName);
    } else {
      return this.streamHandler(url, options, reply);
    }
  }

  private async saveHandler(url: string, webshotOptions: WebshotOptions, reply: Hapi.IReply, fileName: string) {

    this.logger.info(`Saving a screenshot of '${url}' to '${fileName}'`);
    try {
      await grab(url, webshotOptions, fileName);
      reply(200);
    } catch (err) {
      reply(Boom.wrap(err));
      return;
    }
  }

  private async streamHandler(url: string, webshotOptions: WebshotOptions, reply: Hapi.IReply) {

    this.logger.info(`Taking a screenshot of ${url}`);
    try {
      const streams = await grab(url, webshotOptions);
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
