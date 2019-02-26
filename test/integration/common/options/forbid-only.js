'use strict';

var helpers = require('../../helpers');
var runMocha = helpers.runMocha;
var runMochaJSON = helpers.runMochaJSON;

describe('--forbid-only', function() {
  var args = [];
  var onlyErrorMessage = '`.only` forbidden';

  beforeEach(function() {
    args = ['--forbid-only'];
  });

  it('should succeed if there are only passed tests', function(done) {
    runMochaJSON('forbid-only/passed', args, function(err, res) {
      if (err) {
        return done(err);
      }
      expect(res, 'to have passed');
      done();
    });
  });

  it('should fail if there are tests marked only', function(done) {
    runMochaJSON('forbid-only/only', args, function(err, res) {
      if (err) {
        return done(err);
      }
      expect(res, 'to have failed with error', onlyErrorMessage);
      done();
    });
  });

  it('should fail if there are tests in suites marked only', function(done) {
    var spawnOpts = {stdio: 'pipe'};
    runMocha(
      'forbid-only/only-suite',
      args,
      function(err, res) {
        if (err) {
          return done(err);
        }

        expect(res, 'to satisfy', {
          code: 1,
          output: new RegExp(onlyErrorMessage)
        });
        done();
      },
      spawnOpts
    );
  });

  it('should fail if there is empty suite marked only', function(done) {
    var spawnOpts = {stdio: 'pipe'};
    runMocha(
      'forbid-only/only-empty-suite',
      args,
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res, 'to satisfy', {
          code: 1,
          output: new RegExp(onlyErrorMessage)
        });
        done();
      },
      spawnOpts
    );
  });

  it('should fail if there is suite marked only which matches grep', function(done) {
    var spawnOpts = {stdio: 'pipe'};
    runMocha(
      'forbid-only/only-suite',
      args.concat('--fgrep', 'suite marked with only'),
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res, 'to satisfy', {
          code: 1,
          output: new RegExp(onlyErrorMessage)
        });
        done();
      },
      spawnOpts
    );
  });

  it('should succeed if suite marked only does not match grep', function(done) {
    runMochaJSON(
      'forbid-only/only-suite',
      args.concat('--fgrep', 'bumble bees'),
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res, 'to have passed');
        done();
      }
    );
  });

  it('should succeed if suite marked only does not match inverted grep', function(done) {
    runMochaJSON(
      'forbid-only/only-suite',
      args.concat('--fgrep', 'suite marked with only', '--invert'),
      function(err, res) {
        if (err) {
          return done(err);
        }
        expect(res, 'to have passed');
        done();
      }
    );
  });
});
