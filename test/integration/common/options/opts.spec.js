'use strict';

var helpers = require('../../helpers');
var runMochaJSON = helpers.runMochaJSON;
var runMocha = helpers.runMocha;

describe('--opts', function() {
  it('should work despite nonexistent default options file', function(done) {
    runMochaJSON('opts', function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have passed').and('to have passed test count', 1);
      done();
    });
  });

  it('should throw an error due to nonexistent options file', function(done) {
    var spawnOpts = {stdio: 'pipe'};
    var nonexistentFile = 'nosuchoptionsfile';
    runMocha(
      'opts',
      ['--opts', nonexistentFile],
      function(err, res) {
        if (err) {
          return done(err);
        }

        var pattern = 'unable to read ' + nonexistentFile;
        expect(res, 'to have failed with output', new RegExp(pattern, 'i'));
        done();
      },
      spawnOpts
    );
  });
});
