'use strict';

var runMochaJSON = require('./helpers').runMochaJSON;
var invokeMocha = require('./helpers').invokeMocha;
var ERR_MOCHA_MULTIPLE_DONE = require('../../lib/errors').constants
  .ERR_MOCHA_MULTIPLE_DONE;

describe('multiple calls to done()', function() {
  var res;
  describe('from a spec', function() {
    before(function(done) {
      runMochaJSON('multiple-done', function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in failure', function() {
      expect(res, 'to have failed test count', 1)
        .and('to have passed test count', 1)
        .and('to have pending test count', 0)
        .and('to have failed');
    });

    it('throws a descriptive error', function() {
      expect(res, 'to have failed with error', 'done() called multiple times');
    });
  });

  describe('with error passed on second call', function() {
    before(function(done) {
      runMochaJSON('multiple-done-with-error', function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in failure', function() {
      expect(res, 'to have failed test count', 1)
        .and('to have passed test count', 1)
        .and('to have pending test count', 0)
        .and('to have failed');
    });

    it('should throw a descriptive error', function() {
      expect(
        res,
        'to have failed with error',
        "second error (and Mocha's done() called multiple times)"
      );
    });
  });

  describe('with multiple specs', function() {
    before(function(done) {
      runMochaJSON('multiple-done-specs', function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in failure', function() {
      expect(res, 'to have failed test count', 1)
        .and('to have passed test count', 2)
        .and('to have pending test count', 0)
        .and('to have failed');
    });

    it('correctly attributes the error', function() {
      expect(res.failures[0], 'to satisfy', {
        fullTitle: 'suite test1',
        err: {
          message: 'done() called multiple times'
        }
      });
    });
  });

  describe('from a before hook', function() {
    before(function(done) {
      runMochaJSON('multiple-done-before', function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in failure', function() {
      expect(res, 'to have failed test count', 1)
        .and('to have passed test count', 1)
        .and('to have pending test count', 0)
        .and('to have failed');
    });

    it('correctly attributes the error', function() {
      expect(res.failures[0], 'to satisfy', {
        fullTitle: 'suite "before all" hook in "suite"',
        err: {
          message: 'done() called multiple times'
        }
      });
    });
  });

  describe('from a beforeEach hook', function() {
    before(function(done) {
      runMochaJSON('multiple-done-beforeEach', function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in a failure', function() {
      expect(res, 'to have failed test count', 2)
        .and('to have passed test count', 2)
        .and('to have pending test count', 0)
        .and('to have exit code', 2);
    });

    it('correctly attributes the errors', function() {
      expect(res.failures, 'to satisfy', [
        {
          fullTitle: 'suite "before each" hook in "suite"',
          err: {message: 'done() called multiple times'}
        },
        {
          fullTitle: 'suite "before each" hook in "suite"',
          err: {message: 'done() called multiple times'}
        }
      ]);
    });
  });

  describe('when done() called asynchronously', function() {
    before(function(done) {
      invokeMocha(
        require.resolve('./fixtures/multiple-done-async.fixture.js'),
        function(err, result) {
          res = result;
          done(err);
        },
        'pipe'
      );
    });

    it('results in error', function() {
      expect(res, 'to satisfy', {
        code: expect.it('to be greater than', 0),
        output: /done\(\) called multiple times/
      });
    });

    it('fail with an error containing the information about the test', function() {
      expect(res.output, 'to match', /should fail in an async test case/);
    });

    describe('when errored after Runner has completed', function() {
      // WARNING: non-deterministic!
      before(function() {
        if (/1\) should fail in an async test case/.test(res.output)) {
          return this.skip();
        }
      });

      it('should provide extra information about the Runnable', function() {
        expect(res.output, 'to match', /multiple-done-async\.fixture\.js/)
          .and('to match', /type: 'test'/)
          .and('to match', /body: 'function/)
          .and('to match', new RegExp(ERR_MOCHA_MULTIPLE_DONE));
      });
    });
  });
});
