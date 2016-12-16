import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import { grab } from '../src/server';

describe('screenshotter', () => {

  it('can save a screenshot', async () => {
    const fileName = path.join(__dirname, '/../', 'test.png');
    const url = 'https://google.com';
    const streams = await grab(url, {windowSize: {width: 1200, height: 750}}, fileName);
    expect(streams[0]).to.exist;
    expect(fs.existsSync(fileName));
    fs.unlinkSync(fileName);
  });

  it('can stream a screenshot', async () => {
    const url = 'https://google.com';
    const streams = await grab(url, {windowSize: {width: 1200, height: 750}});
    expect(streams[0]).to.exist;
  });
});
