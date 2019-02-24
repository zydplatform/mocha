'use strict';

var runMocha = require('../../helpers').runMocha;

describe('--compilers', function() {
  it('should report deprecation', function(done) {
    runMocha(
      ['--compilers', 'coffee:coffee-script/register'],
      function(err, res) {
        if (err) {
          return done(err);
        }

        expect(res, 'to have failed with output', /compilers is deprecated/i);
        done();
      },
      'pipe'
    );
  });
});
