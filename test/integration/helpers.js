'use strict';

const {unparse} = require('../../lib/cli/unparser');
const {spawn} = require('cross-spawn');
const {isNodeFlag} = require('../../lib/cli/node-flags');
const path = require('path');

const DEFAULT_FIXTURE = require.resolve(
  './common/fixtures/__default__.fixture.js'
);
const MOCHA_EXECUTABLE = require.resolve('../../bin/mocha');
const _MOCHA_EXECUTABLE = require.resolve('../../bin/_mocha');
const MOCHIFY_EXECUTABLE = require.resolve('mochify/bin/cmd.js');

exports.constants = {
  MOCHA_EXECUTABLE,
  _MOCHA_EXECUTABLE,
  MOCHIFY_EXECUTABLE
};

const resolveFixturePath = fixture => {
  if (path.extname(fixture) !== '.js') {
    fixture += '.fixture.js';
  }
  if (path.dirname(fixture) === '.') {
    return path.join('test', 'integration', 'fixtures', fixture);
  }
  return fixture;
};

const hasNodeFlags = opts => Object.keys(opts).some(isNodeFlag);

/**
 * Spawns Mocha in a subprocess and returns an object containing its output and exit code
 *
 * @param {string[]} args - Path to executable and arguments
 * @returns {Promise<string>} Output
 * @ignore
 */
const spawnAsync = (exports.spawnAsync = (args, opts) => {
  return new Promise((resolve, reject) => {
    let output = '';
    opts = Object.assign(
      {stdio: ['ignore', 'pipe', 'ignore']},
      opts === 'pipe' ? {stdio: 'pipe'} : opts
    );
    const proc = spawn(process.execPath, args, opts);
    const listener = data => {
      output += data;
    };

    proc.stdout.on('data', listener);
    if (proc.stderr) {
      proc.stderr.on('data', listener);
    }
    proc.on('error', reject);

    proc.on('close', code => {
      resolve({
        output: output,
        code: code,
        execPath: process.execPath,
        args: args,
        opts: opts
      });
    });
  });
});

const run = (file, args, opts) => {
  let executable;
  if (process.env.BROWSER) {
    executable = MOCHIFY_EXECUTABLE;
  } else if (hasNodeFlags(args)) {
    executable = MOCHA_EXECUTABLE;
  } else {
    executable = _MOCHA_EXECUTABLE;
  }
  const {nodeArgs, mochaArgs} = unparse(args);
  return spawnAsync([executable].concat(nodeArgs, mochaArgs), opts);
};

const parseParameters = (file, args, done, opts) => {
  if (typeof file === 'object') {
    done = opts;
    opts = args;
    args = file;
    file = DEFAULT_FIXTURE;
  }
  if (typeof args === 'function') {
    opts = done;
    done = args;
    args = {};
  }
  if (typeof done !== 'function') {
    opts = done;
    done = null;
  }
  args._ = [resolveFixturePath(file)];
  return [file, args, opts, done];
};

const parseEpilog = result =>
  ['passing', 'pending', 'failing'].reduce((summary, type) => {
    const pattern = new RegExp('  (\\d+) ' + type + '\\s');
    const match = pattern.exec(result.output);
    summary[type] = match ? parseInt(match, 10) : 0;

    return summary;
  }, result);

const callbackify = (promise, done) =>
  promise
    .catch(err => {
      if (typeof done === 'function') {
        process.nextTick(() => {
          done(err);
        });
      } else {
        return Promise.reject(err);
      }
    })
    .then(output => {
      if (typeof done === 'function') {
        process.nextTick(() => done(null, output));
      }
      return output;
    });

exports.runMocha = (...params) => {
  const [file, args, opts, done] = parseParameters(...params);
  args.reporter = args.reporter || 'spec';
  return callbackify(run(file, args, opts).then(parseEpilog), done);
};

const parseJSON = result => {
  const {code, args, execPath, opts} = result;
  return Object.assign(JSON.parse(result.output), {code, args, execPath, opts});
};

exports.runMochaJSON = (file, args, done, opts) => {
  [file, args, opts, done] = parseParameters(file, args, done, opts);
  args.reporter = args.reporter || 'json';
  return callbackify(run(file, args, opts).then(parseJSON), done);
};
