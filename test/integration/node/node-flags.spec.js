'use strict';

var runMocha = require('../helpers').runMocha;

describe('node flags', function() {
  it('should not consider argument values to be node flags', function(done) {
    runMocha(
      ['--require', 'trace-dependency'],
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res, 'not to have failed with output', /bad option/i);
        done();
      },
      {stdio: 'pipe', wrap: true}
    );
  });
});
