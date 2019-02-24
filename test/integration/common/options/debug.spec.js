'use strict';

var helpers = require('../../helpers');
var spawnAsync = helpers.spawnAsync;
var DEFAULT_FIXTURE = helpers.constants.DEFAULT_FIXTURE;
var MOCHA_EXECUTABLE = helpers.constants.MOCHA_EXECUTABLE;

describe('--debug', function() {
  describe('Node.js v8+', function() {
    before(function() {
      if (process.version.substring(0, 2) === 'v6') {
        this.skip();
      }
    });

    it('should invoke --inspect', function() {
      return expect(
        spawnAsync([MOCHA_EXECUTABLE, '--debug', DEFAULT_FIXTURE], 'pipe'),
        'when fulfilled',
        'to contain output',
        /Debugger listening/i
      );
    });

    it('should invoke --inspect-brk', function() {
      return expect(
        spawnAsync(
          [MOCHA_EXECUTABLE, '--debug-brk', DEFAULT_FIXTURE],
          'pipe',
          2000
        ),
        'when fulfilled',
        'to contain output',
        /Debugger listening/i
      );
    });

    it('should respect custom host/port', function() {
      return expect(
        spawnAsync(
          [MOCHA_EXECUTABLE, '--debug=127.0.0.1:9229', DEFAULT_FIXTURE],
          'pipe'
        ),
        'when fulfilled',
        'to contain output',
        /Debugger listening on .*127.0.0.1:9229/i
      );
    });

    it('should warn about incorrect usage for version', function() {
      return expect(
        spawnAsync(
          [MOCHA_EXECUTABLE, '--debug=127.0.0.1:9229', DEFAULT_FIXTURE],
          'pipe'
        ),
        'when fulfilled',
        'to contain output',
        /"--debug" is not available/i
      );
    });
  });

  describe('Node.js v6', function() {
    // note that v6.3.0 and newer supports --inspect but still supports --debug.
    before(function() {
      if (process.version.substring(0, 2) !== 'v6') {
        this.skip();
      }
    });

    it('should start debugger', function() {
      return expect(
        spawnAsync(
          [MOCHA_EXECUTABLE, '--debug', DEFAULT_FIXTURE],
          'pipe',
          2000
        ),
        'when fulfilled',
        'to contain output',
        /Debugger listening/i
      );
    });

    it('should respect custom host/port', function() {
      return expect(
        spawnAsync(
          [MOCHA_EXECUTABLE, '--debug=127.0.0.1:9229', DEFAULT_FIXTURE],
          'pipe',
          2000
        ),
        'when fulfilled',
        'to contain output',
        /Debugger listening on .*127.0.0.1:9229/i
      );
    });
  });
});
