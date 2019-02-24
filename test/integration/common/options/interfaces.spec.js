'use strict';

var helpers = require('../../helpers');
var runMocha = helpers.runMocha;
var escapeRegExp = helpers.escapeRegExp;
var interfaces = require('../../../../lib/mocha').interfaces;

describe('--interfaces', function() {
  var expected = Object.keys(interfaces)
    .filter(function(name) {
      return /^[a-z]/.test(name);
    })
    .map(function(name) {
      return {
        name: escapeRegExp(name),
        description: escapeRegExp(interfaces[name].description)
      };
    });

  it('should dump a list of all interfaces with descriptions', function(done) {
    runMocha(['--interfaces'], function(err, result) {
      if (err) {
        return done(err);
      }

      expect(result.code, 'to be', 0);
      expected.forEach(function(ui) {
        expect(
          result.output,
          'to match',
          new RegExp(ui.name + '\\s*-\\s*' + ui.description)
        );
      });
      done();
    });
  });
});
