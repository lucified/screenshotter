const bluebird = require('bluebird');
const _webshot = require('webshot');
const temp = require('temp');
const webshot = bluebird.promisify(_webshot);

describe('can take a screenshot', () => {

  it('won\'t crash when running webshot', () => {
    const imgType = 'png';
    const tempName = temp.path({ suffix: '.' + imgType });
    return webshot('google.com', tempName, {});
  });

});
