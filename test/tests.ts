// tsimport { expect } from 'chai';

const bluebird = require('bluebird');
const _webshot = require('webshot');
const temp = require('temp');
const webshot = bluebird.promisify(_webshot);

describe('can take a screenshot', () => {

  it('won\'t crash when running webshot', () => {
    const imgType = 'png';
    const tempName = temp.path({ suffix: '.' + imgType });
    console.log(tempName);
    return webshot('google.com', tempName, {});
  });

});


