
import * as Boom from 'boom';
import * as Hapi from 'hapi';

export default class TargetServer {

  private server: Hapi.Server;

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {
    const server = new Hapi.Server();
    server.connection({
      host: this.host,
      port: this.port,
    });
    this.setRoutes(server);
    this.server = server;
  }

  private setRoutes(server: Hapi.Server) {
    server.route([{
      method: 'GET',
      path: '/succeed',
      handler: this.succeedHandler,
    }, {
      method: 'GET',
      path: '/fail/{code?}',
      handler: this.failHandler,
    }, {
      method: 'GET',
      path: '/fail/jserror',
      handler: this.failJsHandler,
    }]);
  }

  private async succeedHandler(_request: Hapi.Request, reply: Hapi.IReply) {
    return reply(`
<html>
  <head>
  </head>
  <body>
    <h1>unicorns</h1>
  </body>
</html>
    `);
  }

  private async failJsHandler(_request: Hapi.Request, reply: Hapi.IReply) {
    return reply(`
<html>
  <head>
  </head>
  <body>
    <h1>unicorns</h1>
    <script>
      throw new Error('FAIL');
    </script>
  </body>
</html>
    `);
  }

  private async failHandler(request: Hapi.Request, reply: Hapi.IReply) {
    return reply(Boom.create(request.params.code ? Number(request.params.code) : 404));
  }

  public async start() {
    const server = this.server;
    await server.initialize();
    return server.start();
  }

  public async stop() {
    return this.server.stop();
  }

}
