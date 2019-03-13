'use strict';

const {unparse} = require('../../lib/cli/unparser');
const {format} = require('util');
const path = require('path');
const {isNodeFlag} = require('../../lib/cli/node-flags');
const debug = require('debug')('mocha:test');
const Base = require('../../lib/reporters/base');
const glob = require('glob');
const {run} = process.env.BROWSER
  ? require('./browser-runner')
  : require('./node-runner');

const DEFAULT_FIXTURE = require.resolve(
  './common/fixtures/__default__.fixture.js'
);

exports.constants = {
  DEFAULT_FIXTURE
};

/**
 * Fixtures live here and that's where we'll look for them.
 */
const FIXTURE_PATHS = glob.sync('**/fixtures/', {
  cwd: __dirname,
  absolute: true
});

/**
 * The apex of fixture resolution convenience
 * @param {string} fixture - Name of fixture omitting `.fixture.js` extension, name of fixture with `.fixture.js` extension, absolute path to fixture, glob, or relative *from directory of test* to the fixture.
 * @returns {string} If `fixture` was a glob or absolute, then `fixture`; otherwise the absolute path to the appropriate fixture.
 */
const resolveFixture = (exports.resolveFixture = fixture => {
  const resolved = resolveFixture.cache.get(fixture);
  if (resolved) {
    return resolved;
  }
  if (path.isAbsolute(fixture) || glob.hasMagic(fixture)) {
    resolveFixture.cache.set(fixture, fixture);
    return fixture;
  }
  const baseFilepath = path.extname(fixture)
    ? fixture
    : `${fixture}.fixture.js`;
  let filepath;
  try {
    filepath = require.resolve(baseFilepath, {paths: FIXTURE_PATHS});
    resolveFixture.cache.set(fixture, filepath);
    debug(`fixture "${fixture}" resolved to ${filepath}`);
    return filepath;
  } catch (err) {
    throw new Error(
      `Could not find fixture "${fixture}" anywhere in ${FIXTURE_PATHS}`
    );
  }
});

resolveFixture.cache = new Map();

const parseParameters = (fixture, args, done, opts = {}) => {
  if (typeof fixture === 'object') {
    opts = done;
    done = args;
    args = fixture;
    fixture = DEFAULT_FIXTURE;
  }
  if (typeof args === 'function') {
    opts = done;
    done = args;
    args = [];
  }
  if (typeof done !== 'function') {
    opts = done;
    done = null;
  }

  const fixturePath = resolveFixture(fixture);

  const commandArgs = Array.isArray(args)
    ? args.reduce(
        (acc, arg) => {
          if (isNodeFlag(arg.split('=')[0], false)) {
            acc.nodeArgs.push(arg);
          } else {
            acc.mochaArgs.push(arg);
          }
          return acc;
        },
        {nodeArgs: [], mochaArgs: []}
      )
    : unparse(args);

  return [fixturePath, commandArgs, opts, done];
};

const parseEpilog = result =>
  ['passing', 'pending', 'failing'].reduce((summary, type) => {
    const pattern = new RegExp('  (\\d+) ' + type + '\\s');
    const match = pattern.exec(result.output);
    summary[type] = match ? parseInt(match, 10) : 0;

    return summary;
  }, result);

const parseJSON = result => {
  const {code, args, execPath, opts, output} = result;
  try {
    return Object.assign(JSON.parse(output), {code, args, execPath, opts});
  } catch (err) {
    err.message += format('\n\nJSON run result:\n%O', result);
    throw err;
  }
};

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

/**
 * Runs Mocha with default reporter.
 * @param {string|string[]|Function|Object} [fixture] - Fixture name or path or glob
 * @param {string[]|Function|Object} [args] - Any args to pass to Mocha
 * @param {Function|Object} [done] - Callback
 * @param {Object} [opts] - Options
 * @param {boolean} [opts.exactArgs=false] - Pass `args` to executable verbatim
 * @param {number} [opts.killTimeout] - Kill child process after *n* ms
 * @param {string|string[]} [opts.stdio] - `stdio` option for `child_process.spawn()`
 * @param {string|boolean} [opts.wrap=auto] = Use `bin/mocha` wrapper if `true`, use `bin/_mocha` if `false`, otherwise `auto` (or anything else) to let the helper pick.
 * @returns {Promise<RunResult>}
 */
exports.runMocha = (...params) => {
  const [fixturePath, args, opts, done] = parseParameters(...params);
  return callbackify(run(fixturePath, args, opts).then(parseEpilog), done);
};

exports.runMochaJSON = (...params) => {
  const [fixturePath, args, opts, done] = parseParameters(...params);
  args.mochaArgs.push('--reporter', 'json');
  return callbackify(run(fixturePath, args, opts).then(parseJSON), done);
};

/**
 * regular expression used for splitting lines based on new line / dot symbol.
 */
exports.splitRegExp = new RegExp('[\\n.' + Base.symbols.dot + ']+');

/**
 * Given a regexp-like string, escape it so it can be used with the `RegExp` constructor
 * @param {string} str - string to be escaped
 * @returns {string} Escaped string
 */

exports.escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
