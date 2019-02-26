'use strict';

var helpers = require('../../helpers');
var runMocha = helpers.runMocha;

describe('--ui', function() {
  var simpleUiPath = require.resolve('./fixtures/ui/simple-ui.fixture.js');

  it('should load interface and run it', function(done) {
    runMocha('ui/test-for-simple-ui', ['--ui', simpleUiPath], function(
      err,
      res
    ) {
      if (err) {
        done(err);
        return;
      }
      expect(res, 'to have passed');
      done();
    });
  });

  it("should work if required and name added to Mocha's `interfaces` prop", function(done) {
    runMocha(
      'ui/test-for-simple-ui',
      ['--require', simpleUiPath, '--ui', 'simple-ui'],
      function(err, res) {
        if (err) {
          done(err);
          return;
        }
        expect(res, 'to have passed');
        done();
      }
    );
  });
});
