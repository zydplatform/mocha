'use strict';

var helpers = require('../../helpers');
var runMochaJSON = helpers.runMochaJSON;
var resolveFixture = helpers.resolveFixture;

describe('--file', function() {
  var args = [];
  var fixtures = {
    alpha: 'file-alpha',
    beta: 'file-beta',
    theta: 'file-theta'
  };

  it('should run tests passed via file first', function(done) {
    args = ['--file', resolveFixture(fixtures.alpha)];

    var fixture = fixtures.beta;
    runMochaJSON(fixture, args, function(err, res) {
      if (err) {
        return done(err);
      }
      expect(res, 'to have passed')
        .and('to have passed test count', 2)
        .and('to have passed test order', 'should be executed first');
      done();
    });
  });

  it('should run multiple tests passed via file first', function(done) {
    args = [
      '--file',
      resolveFixture(fixtures.alpha),
      '--file',
      resolveFixture(fixtures.beta)
    ];

    var fixture = fixtures.theta;
    runMochaJSON(fixture, args, function(err, res) {
      if (err) {
        return done(err);
      }
      expect(res, 'to have passed')
        .and('to have passed test count', 3)
        .and(
          'to have passed test order',
          'should be executed first',
          'should be executed second',
          'should be executed third'
        );
      done();
    });
  });
});
