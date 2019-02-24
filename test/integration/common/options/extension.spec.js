'use strict';

var runMochaJSON = require('../../helpers').runMochaJSON;
var path = require('path');

describe('--extension', function() {
  it('should allow comma-separated variables', function(done) {
    runMochaJSON(
      path.join(__dirname, 'fixtures', 'extension'),
      [
        '--require',
        'coffee-script/register',
        '--require',
        './test/setup',
        '--extension',
        'js,coffee'
      ],
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res, 'to have passed').and('to have passed test count', 2);
        done();
      }
    );
  });
});
