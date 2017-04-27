// tslint:disable:no-unused-expression
import { expect } from 'chai';
// import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { constructor as loggerConstructor } from '../src/logger';
import { PageresOptions, Server } from '../src/server';
import TargetServer from './target-server';

const tmpFolder = path.join(__dirname, 'tmp');
const fs = require('graceful-fs');
const targetHost = 'localhost';
const targetPort = 9099;
const targetBaseUrl = `http://${targetHost}:${targetPort}`;

async function makeSaveRequest(
  targetPath: string,
  sizes: string[],
  dest: string,
  options?: PageresOptions,
  failOnWarnings = false,
) {
  const logger = loggerConstructor(undefined, false, true);
  const server = new Server('0.0.0.0', 9090, logger);
  const hapiServer = await server.initialize();
  await hapiServer.initialize();
  return hapiServer.inject({
    method: 'POST',
    url: `http://foo.com/save`,
    payload: {
      url: `${targetBaseUrl}${targetPath}`,
      sizes,
      dest,
      options,
      failOnWarnings,
    },
  });
}

async function makeStreamRequest(
  targetPath: string,
  size: string,
  options?: PageresOptions,
) {
  const logger = loggerConstructor(undefined, false, true);
  const server = new Server('0.0.0.0', 9090, logger);
  const hapiServer = await server.initialize();
  await hapiServer.initialize();
  return hapiServer.inject({
    method: 'POST',
    url: `http://foo.com/stream`,
    payload: {
      url: `${targetBaseUrl}${targetPath}`,
      size,
      options,
    },
  });
}

async function makeFaultyRequest(failOnWarnings = false) {
  const logger = loggerConstructor(undefined, false, true);
  const server = new Server('0.0.0.0', 9090, logger);
  const hapiServer = await server.initialize();
  await hapiServer.initialize();
  return hapiServer.inject({
    method: 'POST',
    url: `http://foo.com/save`,
    payload: {
      url: `http://${targetHost}:${targetPort + 1}/succeed`,
      dest: tmpFolder,
      failOnWarnings,
    },
  });
}

describe('screenshotter', () => {

  let targetServer: TargetServer;
  before(async () => {
    await new Promise((resolve, _reject) => mkdirp(tmpFolder, resolve));
    await new Promise((resolve, _reject) => rimraf(path.join(tmpFolder, '*'), resolve));
    targetServer = new TargetServer(targetHost, targetPort);
    await targetServer.start();
  });
  after(async () => targetServer.stop());

  it('can save a screenshot', async () => {
    // Arrange
    const targetPath = '/succeed';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeSaveRequest(targetPath, sizes, tmpFolder, options);
    const paths = JSON.parse(response.payload);
    // Assert
    expect(fs.existsSync(paths[0]));
  });

  it('can stream a screenshot', async () => {
    // Arrange
    const targetPath = '/succeed';
    const size = '1024x768';
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeStreamRequest(targetPath, size, options);
    // Assert
    expect(response.payload.match(/PNG/) !== null).to.be.true;
  });

  it('returns 400 when cannot write to disk', async () => {
    // Arrange
    const targetPath = '/succeed';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };
    const dest = '/usr';

    // Act
    const response = await makeSaveRequest(targetPath, sizes, dest, options);

    // Assert
    expect(response.statusCode).to.eq(400);
  });

  it('returns 400 when the target is not responding', async () => {

    // Act
    const response = await makeFaultyRequest();

    // Assert
    expect(response.statusCode).to.eq(400);
  });

  it('returns 502 when the target returns 404 and failOnWarnings = true', async () => {
    // Arrange
    const targetPath = '/fail/404';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeSaveRequest(targetPath, sizes, tmpFolder, options, true);

    // Assert
    expect(response.statusCode).to.eq(502);
  });
  it('returns 200 when the target returns 404 and failOnWarnings = false', async () => {
    // Arrange
    const targetPath = '/fail/404';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeSaveRequest(targetPath, sizes, tmpFolder, options);

    // Assert
    expect(response.statusCode).to.eq(200);
  });
  it('returns 200 when the target has a js error and failOnWarnings = true', async () => {
    // Arrange
    const targetPath = '/fail/jserror';
    const sizes = ['1024x768'];
    const options: PageresOptions = {
      crop: true,
      scale: 1,
    };

    // Act
    const response = await makeSaveRequest(targetPath, sizes, tmpFolder, options, true);

    // Assert
    expect(response.statusCode).to.eq(200);
  });

});
