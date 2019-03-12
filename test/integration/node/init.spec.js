'use strict';

var fs = require('fs');
var rimraf = require('rimraf');
var runMocha = require('../helpers').runMocha;
var path = require('path');
var os = require('os');

describe('init command', function() {
  var tmpdir;

  beforeEach(function() {
    tmpdir = path.join(os.tmpdir(), 'mocha-init');
    try {
      fs.mkdirSync(tmpdir);
    } catch (ignored) {}
    expect(fs.existsSync(tmpdir), 'to be true');
  });

  afterEach(function() {
    try {
      rimraf.sync(tmpdir);
    } catch (ignored) {}
  });

  it('should break if no path supplied', function() {
    return expect(
      runMocha(['init'], {stdio: 'pipe', exactArgs: true}),
      'when fulfilled',
      expect.it(
        'to have failed with output',
        /not enough non-option arguments/i
      )
    );
  });

  it('should create some files in the dest dir', function() {
    return expect(
      runMocha(['init', tmpdir], {stdio: 'pipe', exactArgs: true}),
      'when fulfilled',
      expect.it('to have passed')
    ).then(function() {
      expect(fs.existsSync(path.join(tmpdir, 'mocha.css')), 'to be true');
      expect(fs.existsSync(path.join(tmpdir, 'mocha.js')), 'to be true');
      expect(fs.existsSync(path.join(tmpdir, 'tests.spec.js')), 'to be true');
      expect(fs.existsSync(path.join(tmpdir, 'index.html')), 'to be true');
    });
  });
});
