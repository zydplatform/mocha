'use strict';

var run = require('../helpers').runMochaJSON;
var args = [];

describe('multiple calls to done()', function() {
  var res;
  describe('from a spec', function() {
    before(function(done) {
      run('multiple-done.fixture.js', args, function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in failures', function() {
      expect(res, 'to have failed count', 1)
        .and('to have passed count', 1)
        .and('to have pending count', 0);
    });

    it('throws a descriptive error', function() {
      expect(res, 'to have failed with error', 'done() called multiple times');
    });
  });

  describe('with error passed on second call', function() {
    before(function(done) {
      run('multiple-done-with-error.fixture.js', args, function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in failures', function() {
      expect(res, 'to have failed count', 1)
        .and('to have passed count', 1)
        .and('to have pending count', 0);
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
      run('multiple-done-specs.fixture.js', args, function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in a failure', function() {
      expect(res, 'to have failed')
        .and('to have failed count', 1)
        .and('to have passed count', 2);
    });

    it('correctly attributes the error', function() {
      expect(res, 'to have failed test', 'suite test1').and(
        'to have failed with error',
        'done() called multiple times'
      );
    });
  });

  describe('from a before hook', function() {
    before(function(done) {
      run('multiple-done-before.fixture.js', args, function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in a failure', function() {
      expect(res, 'to have failed')
        .and('to have failed count', 1)
        .and('to have passed count', 1);
    });

    it('correctly attributes the error', function() {
      expect(
        res,
        'to have failed test',
        'suite "before all" hook in "suite"'
      ).and('to have failed with error', 'done() called multiple times');
    });
  });

  describe('from a beforeEach hook', function() {
    before(function(done) {
      run('multiple-done-beforeEach.fixture.js', args, function(err, result) {
        res = result;
        done(err);
      });
    });

    it('results in a failure', function() {
      expect(res, 'to have failed')
        .and('to have failed count', 2)
        .and('to have passed count', 2)
        .and('to have pending count', 0);
    });

    it('correctly attributes the errors', function() {
      expect(res, 'to have failed test count', 2)
        .and(
          'to have failed test order',
          'suite "before each" hook in "suite"',
          'suite "before each" hook in "suite"'
        )
        .and(
          'to have failed with error order',
          'done() called multiple times',
          'done() called multiple times'
        );
    });
  });
});
