'use strict';

var helpers = require('../../helpers');
var runMochaJSON = helpers.runMochaJSON;

describe('--bail', function() {
  var args = [];

  before(function() {
    args = ['--bail'];
  });

  it('should stop after the first error', function(done) {
    runMochaJSON('bail', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have passed test', 'should display this spec')
        .and('to have failed test', 'should only display this error')
        .and('to have passed test count', 1)
        .and('to have failed test count', 1);
      done();
    });
  });

  it('should stop after the first error - async', function(done) {
    runMochaJSON('bail-async', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have passed test', 'should display this spec')
        .and('to have failed test', 'should only display this error')
        .and('to have passed test count', 1)
        .and('to have failed test count', 1);
      done();
    });
  });

  it('should stop all tests after failing "before" hook', function(done) {
    runMochaJSON('bail-with-before', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have failed test count', 1)
        .and(
          'to have failed test',
          '"before all" hook: before suite1 for "test suite1"'
        )
        .and('to have passed test count', 0);
      done();
    });
  });

  it('should stop all tests after failing "beforeEach" hook', function(done) {
    runMochaJSON('bail-with-beforeEach', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have failed test count', 1)
        .and(
          'to have failed test',
          '"before each" hook: beforeEach suite1 for "test suite1"'
        )
        .and('to have passed test count', 0);
      done();
    });
  });

  it('should stop all tests after failing test', function(done) {
    runMochaJSON('bail-with-test', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have failed test count', 1)
        .and('to have failed test', 'test suite1')
        .and('to have passed test count', 0);
      done();
    });
  });

  it('should stop all tests after failing "after" hook', function(done) {
    runMochaJSON('bail-with-after', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have failed test count', 1)
        .and(
          'to have failed test',
          '"after all" hook: after suite1A for "test suite1A"'
        )
        .and('to have passed test count', 2)
        .and('to have passed test order', 'test suite1', 'test suite1A');
      done();
    });
  });

  it('should stop all tests after failing "afterEach" hook', function(done) {
    runMochaJSON('bail-with-afterEach', args, function(err, res) {
      if (err) {
        return done(err);
      }

      expect(res, 'to have failed')
        .and('to have failed test count', 1)
        .and(
          'to have failed test',
          '"after each" hook: afterEach suite1A for "test suite1A"'
        )
        .and('to have passed test count', 2)
        .and('to have passed test order', 'test suite1', 'test suite1A');
      done();
    });
  });
});
