'use strict';

var runMocha = require('../../helpers').runMocha;

describe('--exit', function() {
  var behaviors = {
    enabled: '--exit',
    disabled: '--no-exit'
  };

  /**
   * Returns a test that executes Mocha in a subprocess with either
   * `--exit`, `--no-exit`, or default behavior.
   *
   * @param {boolean} shouldExit - Expected result; `true` if Mocha should
   *   have force-killed the process.
   * @param {string} [behavior] - 'enabled' or 'disabled'; omit for default
   * @returns {Function} async function implementing the test
   */
  var runExit = function(shouldExit, behavior) {
    return function(done) {
      var timeout = this.timeout();
      this.timeout(0);
      this.slow(Infinity);
      var args = behaviors[behavior] ? [behaviors[behavior]] : [];

      runMocha(
        'exit',
        args,
        function postmortem(err, res) {
          if (err) {
            return done(err);
          }
          expect(res, 'to satisfy', {
            signal: shouldExit ? null : 'SIGINT'
          });
          done();
        },
        {killTimeout: timeout - 500}
      );
    };
  };

  describe('default behavior', function() {
    it('should force exit after root suite completion', runExit(false));
  });

  describe('when enabled', function() {
    it(
      'should force exit after root suite completion',
      runExit(true, 'enabled')
    );
  });

  describe('when disabled', function() {
    it(
      'should not force exit after root suite completion',
      runExit(false, 'disabled')
    );
  });
});
