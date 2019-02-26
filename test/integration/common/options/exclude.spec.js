'use strict';

var path = require('path').posix;
var helpers = require('../../helpers');
var runMochaJSON = helpers.runMochaJSON;

var BASE_FIXTURE_PATH = path.join(__dirname, 'fixtures', 'exclude');

describe('--exclude', function() {
  /*
   * Runs mocha in {path} with the given args.
   * Calls handleResult with the result.
   *
   * @param {string} fixture
   * @param {string[]} args
   * @param {function} handleResult
   * @param {function} done
   */
  function runMochaTest(fixture, args, handleResult, done) {
    runMochaJSON(fixture, args, function(err, res) {
      if (err) {
        return done(err);
      }

      handleResult(res);
      done();
    });
  }

  it('should exclude specific files', function(done) {
    var fixtures = path.join(BASE_FIXTURE_PATH, '*.fixture.js');
    runMochaTest(
      fixtures,
      ['--exclude', path.join(BASE_FIXTURE_PATH, 'fail.fixture.js')],
      function(res) {
        expect(res, 'to have passed')
          .and('to have run test', 'should find this test')
          .and('not to have pending tests');
      },
      done
    );
  });

  it('should exclude globbed files', function(done) {
    var fixtures = path.join(BASE_FIXTURE_PATH, '**', '*.fixture.js');
    runMochaTest(
      fixtures,
      ['--exclude', '**/fail.fixture.js'],
      function(res) {
        expect(res, 'to have passed')
          .and('not to have pending tests')
          .and('to have passed test count', 2);
      },
      done
    );
  });

  it('should exclude multiple patterns', function(done) {
    var fixtures = path.join(BASE_FIXTURE_PATH, '**', '*.fixture.js');
    runMochaTest(
      fixtures,
      [
        '--exclude',
        path.join(BASE_FIXTURE_PATH, 'fail.fixture.js'),
        '--exclude',
        path.join(BASE_FIXTURE_PATH, 'nested', 'fail.fixture.js')
      ],
      function(res) {
        expect(res, 'to have passed')
          .and('not to have pending tests')
          .and('to have passed test count', 2);
      },
      done
    );
  });
});
