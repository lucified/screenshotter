// tslint:disable:no-unused-expression
import { expect } from 'chai';
// import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { constructor as loggerConstructor } from '../src/logger';
import { PageresOptions, Server } from '../src/server';

const tmpFolder = path.join(__dirname, 'tmp');
const fs = require('graceful-fs');

async function makeRequest(url: string, sizes: string[], dest?: string, options?: PageresOptions) {
  const logger = loggerConstructor(undefined, false, true);
  const server = new Server('0.0.0.0', 9090, logger);
  const hapiServer = await server.initialize();
  await hapiServer.initialize();
  return hapiServer.inject({
    method: 'POST',
    url: 'http://foo.com/',
    payload: {
      url,
      sizes,
      dest,
      options,
    },
  });
}

describe('screenshotter', () => {

  before(done => {
    mkdirp(tmpFolder, _error => rimraf(path.join(tmpFolder, '*'), _ => done()));
  });
  it('can save a screenshot', async () => {
    // Arrange
    const url = 'http://tilastot.migri.fi';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeRequest(url, sizes, tmpFolder, options);
    const paths = JSON.parse(response.payload);
    // Assert
    expect(fs.existsSync(paths[0]));
  });

  it('can stream a screenshot', async () => {
    // Arrange
    const url = 'http://tilastot.migri.fi';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeRequest(url, sizes, undefined, options);
    // Assert
    expect(response.payload.match(/PNG/) !== null).to.be.true;
  });

  it('fails gracefully when cannot write to disk', async () => {
    // Arrange
    const url = 'http://tilastot.migri.fi';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };
    const dest = '/usr';

    // Act
    const response = await makeRequest(url, sizes, dest, options);

    // Assert
    expect(response.statusCode).to.eq(400);
  });
});
