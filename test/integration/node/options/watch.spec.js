'use strict';

var helpers = require('../../helpers');
var runMocha = helpers.runMocha;

describe('--watch', function() {
  var args = [];

  before(function() {
    args = ['--watch'];
  });

  describe('when enabled', function() {
    before(function() {
      // Feature works but SIMULATING the signal (ctrl+c) via child process
      // does not work due to lack of POSIX signal compliance on Windows.
      if (process.platform === 'win32') {
        this.skip();
      }
    });

    it('should show the cursor and signal correct exit code, when watch process is terminated', function(done) {
      this.timeout(0);
      this.slow(3000);

      var fixture = 'exit';
      var spawnOpts = {stdio: 'pipe', killTimeout: 1000};
      runMocha(
        fixture,
        args,
        function postmortem(err, data) {
          if (err) {
            return done(err);
          }

          var expectedCloseCursor = '\u001b[?25h';
          expect(data.output, 'to contain', expectedCloseCursor);

          function exitStatusBySignal(sig) {
            return 128 + sig;
          }

          var sigint = 2;
          expect(data.code, 'to be', exitStatusBySignal(sigint));
          done();
        },
        spawnOpts
      );
    });
  });
});
