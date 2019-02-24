'use strict';

var runMocha = require('../helpers').runMocha;

describe('utils.deprecate test', function() {
  it('should print unique deprecation only once', function(done) {
    runMocha(
      'deprecate.fixture.js',
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(
          res,
          'to have passed with output',
          /(deprecated thing.*\n.*deprecated thing)/i
        );
        done();
      },
      'pipe'
    );
  });
});
