'use strict';

var helpers = require('../../helpers');
var runMochaJSON = helpers.runMochaJSON;

describe('--async-only', function() {
  var args = [];

  before(function() {
    args = ['--async-only'];
  });

  it('should fail synchronous specs', function(done) {
    runMochaJSON('async-only-sync', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed');
      done();
    });
  });

  it('should allow asynchronous specs', function(done) {
    runMochaJSON('async-only-async', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have passed');
      done();
    });
  });
});
