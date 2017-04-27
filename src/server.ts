
import * as Boom from 'boom';
import { existsSync } from 'fs';
import * as Hapi from 'hapi';
import * as Joi from 'joi';
import * as path from 'path';
import { Readable } from 'stream';
import { defaultGoodOptions } from './goodOptions';
import { Logger } from './logger';

const good = require('good');
const Pageres = require('pageres');

export interface PageresOptions {
  delay?: number;
  timeout?: number;
  crop?: boolean;
  css?: string;
  script?: string;
  cookies?: string[];
  filename?: string; // https://github.com/sindresorhus/pageres#filename
  incrementalName?: boolean;
  selector?: string;
  hide?: string[];
  username?: string;
  password?: string;
  scale?: number; // 1
  format?: 'png' | 'jpg'; // png
  userAgent?: string;
  headers?: object;
}

export const defaultPageresOptions: PageresOptions = {
  delay: 0,
  timeout: 30,
  scale: 1,
  format: 'png',
  incrementalName: false,
  crop: true,
};

export class Server {

  private server: Hapi.Server;
  private goodOptions: any;

  constructor(
    private readonly host: string,
    private readonly port: number,
    public readonly logger: Logger,
    goodOptions?: any,
  ) {
    const server = new Hapi.Server();
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
      path: '/save',
      handler: this.saveHandler,
      config: {
        bind: this,
        validate: {
          payload: {
            url: Joi.string().min(3).required(),
            dest: Joi.string().min(3).required(),
            sizes: Joi.array().default(['1024x768']),
            failOnWarnings: Joi.boolean().default(false),
            options: Joi.object().default(defaultPageresOptions),
          },
        },
      },
    }, {
      method: 'POST',
      path: '/stream',
      handler: this.streamHandler,
      config: {
        bind: this,
        validate: {
          payload: {
            url: Joi.string().min(3).required(),
            size: Joi.string().default('1024x768'),
            options: Joi.object().default(defaultPageresOptions),
          },
        },
      },
    }]);
  }

  private logStart(num: number, url: string) {
    const numText = num > 1 ? num + ' screenshots' : 'a screenshot';
    this.logger.info(`Taking ${numText} of '${url}'`);
  }
  private logEnd(num: number, start: number) {
    const numText = num > 1 ? num + ' screenshots' : 'a screenshot';
    const end = Date.now();
    const duration = Math.round((end - start) / 100) / 10;
    this.logger.info(`Took ${numText} in ${duration}s'`);
  }

  private async saveHandler(request: Hapi.Request, reply: Hapi.IReply) {
    try {
      const body = request.payload;
      const { url, sizes, dest, options, failOnWarnings } = body;
      this.logStart(sizes.length, url);
      const start = Date.now();
      const warnings: string[] = [];
      const pageres = this.getPageres(url, sizes, dest, options);
      pageres.on('warning', (msg: string) => {
        this.logger.warn(msg);
        warnings.push(msg);
      });
      const streams: Readable[] = await pageres.run();
      // Collect the filenames
      this.logEnd(sizes.length, start);
      const filenames = this.assertFiles(streams, dest);
      if (failOnWarnings && warnings.length > 0) {
        const statusCodeRegExp = new RegExp(`\\(error\\s+downloading\\s+${url}`, 'i');
        const statusCodeWarnings = warnings.filter(warning => !!warning.match(statusCodeRegExp));
        if (statusCodeWarnings && statusCodeWarnings.length > 0) {
          return reply(Boom.badGateway(statusCodeWarnings.join('\n')));
        }
      }
      return reply(filenames);
    } catch (error) {
      // Pageres throws for example when it encounters connecitivity problems
      // or is unable to write to the specified location
      this.logger.error(error.message);
      return reply(Boom.badRequest(error.message));
    }
  }

  private async streamHandler(request: Hapi.Request, reply: Hapi.IReply) {
    try {
      const body = request.payload;
      const { url, size, options } = body;
      const _options = options as PageresOptions;
      this.logStart(1, url);
      const start = Date.now();
      const pageres = this.getPageres(url, [size], undefined, options);
      pageres.on('warning', (msg: string) => {
        this.logger.warn(msg);
      });
      const streams: Readable[] = await pageres.run();
      streams[0].on('end', () => this.logEnd(1, start));
      return reply(streams[0])
        .type(_options && _options.format === 'jpg' ? 'image/jpeg' : 'image/png');
    } catch (error) {
      this.logger.warn(error.message);
      return reply(Boom.badRequest(error.message));
    }
  }

  private assertFiles(streams: Readable[], dest: string) {
    const filenames: string[] = [];
    for (const stream of streams) {
      const filename = (stream as any).filename;
      const fullPath = path.join(dest, filename);
      if (!existsSync(fullPath)) {
        throw new Error(`Couldn't write to ${fullPath}`);
      }
      filenames.push(fullPath);
      this.logger.info('Wrote screenshot to %s', fullPath);
    }
    return filenames;
  }

  public getPageres(url: string, sizes: string[], dest?: string, options?: PageresOptions) {
    const pageres = new Pageres(defaultPageresOptions).src(url, sizes, options);
    if (dest) {
      pageres.dest(dest);
    }
    return pageres;
  }

  public async initialize(): Promise<Hapi.Server> {
    const server = this.server;
    await this.loadBasePlugins(server);
    return server;
  }

  private async loadBasePlugins(server: Hapi.Server) {

    await server.register([{
      options: this.goodOptions,
      register: good,
    }]);
  }

}
