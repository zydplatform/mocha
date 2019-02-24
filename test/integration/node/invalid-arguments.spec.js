'use strict';

var runMocha = require('../helpers').runMocha;

describe('invalid arguments', function() {
  it('should exit with failure if arguments are invalid', function(done) {
    runMocha(
      ['--grep'],
      function(err, result) {
        if (err) {
          return done(err);
        }
        expect(result, 'to have failed having output', /not enough arguments/i);
        done();
      },
      {stdio: 'pipe'}
    );
  });
});
