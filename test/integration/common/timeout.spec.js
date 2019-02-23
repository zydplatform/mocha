'use strict';

var runMochaJSON = require('../helpers').runMochaJSON;

describe('this.timeout()', function() {
  it('is respected by sync and async suites', function(done) {
    runMochaJSON('timeout.fixture.js', function(err, res) {
      if (err) {
        done(err);
        return;
      }
      expect(res, 'to have failed with count', 2);
      done();
    });
  });
});
