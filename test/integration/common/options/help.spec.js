'use strict';

var runMocha = require('../../helpers').runMocha;

describe('--help', function() {
  it('should output some help text', function() {
    return expect(
      runMocha(['--help'], 'pipe'),
      'when fulfilled',
      'to contain output',
      /Run tests with Mocha/
    );
  });
});
