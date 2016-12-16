import { expect } from 'chai';
const Pageres = require('pageres');

describe('can take a screenshot', () => {

  it('won\'t crash when running Pageres', async () => {
    const filename = 'test';
    const pageRes = new Pageres({filename})
        .src('https://google.com', ['1200x750'], {crop: true})
        .dest(__dirname + '/../');

    try {
      const stream = await pageRes.run();
      expect(stream).to.exist;
      console.log(stream);
    } catch (err) {
      expect.fail(err);
    }

  });

});
