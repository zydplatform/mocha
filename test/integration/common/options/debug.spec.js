'use strict';

var helpers = require('../../helpers');
var runMocha = helpers.runMocha;

describe('--debug', function() {
  describe('Node.js v8+', function() {
    before(function() {
      if (process.version.substring(0, 2) === 'v6') {
        this.skip();
      }
    });

    it('should invoke --inspect', function() {
      return expect(
        runMocha(['--debug'], {stdio: 'pipe'}),
        'when fulfilled',
        'to contain output',
        /Debugger listening/i
      );
    });

    it('should invoke --inspect-brk', function() {
      return expect(
        runMocha(['--debug-brk'], {stdio: 'pipe', killTimeout: 2000}),
        'when fulfilled',
        'to contain output',
        /Debugger listening/i
      );
    });

    it('should respect custom host/port', function() {
      return expect(
        runMocha(['--debug=127.0.0.1:9229'], {stdio: 'pipe'}),
        'when fulfilled',
        'to contain output',
        /Debugger listening on .*127.0.0.1:9229/i
      );
    });

    it('should warn about incorrect usage for version', function() {
      return expect(
        runMocha(['--debug=127.0.0.1:9229'], {stdio: 'pipe'}),
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
        runMocha(['--debug'], {stdio: 'pipe', killTimeout: 2000}),
        'when fulfilled',
        'to contain output',
        /Debugger listening/i
      );
    });

    it('should respect custom host/port', function() {
      return expect(
        runMocha(['--debug=127.0.0.1:9229'], {
          stdio: 'pipe',
          killTimeout: 2000
        }),
        'when fulfilled',
        'to contain output',
        /Debugger listening on .*127.0.0.1:9229/i
      );
    });
  });
});
