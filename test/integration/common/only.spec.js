'use strict';

var runMochaJSON = require('../helpers').runMochaJSON;

describe('exclusive tests', function() {
  describe('when bdd interface used', function() {
    it('should run only exclusive tests', function(done) {
      runMochaJSON('only/bdd', ['--ui', 'bdd'], function(err, res) {
        if (err) {
          done(err);
          return;
        }
        expect(res, 'to have passed with count', 11);
        done();
      });
    });
  });

  describe('when tdd interface used', function() {
    it('should run only exclusive tests', function(done) {
      runMochaJSON('only/tdd', ['--ui', 'tdd'], function(err, res) {
        if (err) {
          done(err);
          return;
        }
        expect(res, 'to have passed with count', 8);
        done();
      });
    });
  });

  describe('when qunit interface used', function() {
    it('should run only exclusive tests', function(done) {
      runMochaJSON('only/qunit', ['--ui', 'qunit'], function(err, res) {
        if (err) {
          done(err);
          return;
        }
        expect(res, 'to have passed with count', 5);
        done();
      });
    });
  });
});
