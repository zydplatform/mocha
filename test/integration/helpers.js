'use strict';

const {unparse} = require('../../lib/cli/unparser');
const {spawn} = require('cross-spawn');
const {format} = require('util');
const path = require('path');
const {isNodeFlag} = require('../../lib/cli/node-flags');
const debug = require('debug')('mocha:test');
const Base = require('../../lib/reporters/base');
const glob = require('glob');

const DEFAULT_FIXTURE = require.resolve(
  './common/fixtures/__default__.fixture.js'
);
const MOCHA_EXECUTABLE = require.resolve('../../bin/mocha');
const _MOCHA_EXECUTABLE = require.resolve('../../bin/_mocha');
const MOCHIFY_EXECUTABLE = require.resolve('mochify/bin/cmd.js');

exports.constants = {
  MOCHA_EXECUTABLE,
  _MOCHA_EXECUTABLE,
  MOCHIFY_EXECUTABLE,
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
 * Ensure `DEBUG` is not passed to child processes.
 * (alternatively, we could redirect debug to some other stream?)
 */
const DEFAULT_SPAWN_OPTS = {
  stdio: ['ignore', 'pipe', 'ignore'],
  env: Object.assign({}, process.env, {DEBUG: undefined})
};

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
    debug(`fixture "${fixture} resolved to ${filepath}`);
    return filepath;
  } catch (err) {
    throw new Error(
      `Could not find fixture "${fixture}" anywhere in ${FIXTURE_PATHS}`
    );
  }
});

resolveFixture.cache = new Map();

/**
 * Spawns Mocha in a subprocess and returns an object containing its output and exit code
 *
 * @param {string[]} args - Path to executable and arguments
 * @param {Object|string} [opts] - Various options or 'pipe'
 * @param {number} [opts.killTimeout] - Kill child process after *n* ms
 * @param {string|string[]} [opts.stdio] - `stdio` option for `child_process.spawn()`
 * @returns {Promise<{{output: string, code: number, signal: string, command: string}}>} Output
 * @ignore
 */
const spawnAsync = (exports.spawnAsync = (args, opts = {}) => {
  return new Promise((resolve, reject) => {
    let output = '';
    const spawnOpts = Object.assign({}, DEFAULT_SPAWN_OPTS);
    let t;
    if (opts === 'pipe') {
      spawnOpts.stdio = 'pipe';
    } else if (opts.stdio) {
      spawnOpts.stdio = opts.stdio;
    }
    const proc = spawn(process.execPath, args, spawnOpts)
      .on('error', err => {
        clearTimeout(t);
        reject(err);
      })
      .on('close', (code, signal) => {
        clearTimeout(t);
        debug(`process #${proc.pid} closed`);
        resolve({
          output,
          code,
          signal,
          command: [process.execPath].concat(args).join(' ')
        });
      });
    debug(`process #${proc.pid} opened`);

    if (opts.killTimeout) {
      debug(`will kill process #${proc.pid} after ${opts.killTimeout} ms`);
      t = setTimeout(() => {
        process.kill(proc.pid, 'SIGINT');
        debug(`kill signal sent to process ${proc.pid}`);
      }, opts.killTimeout);
    }

    const listener = data => {
      output += data;
    };

    proc.stdout.on('data', listener);
    if (proc.stderr) {
      proc.stderr.on('data', listener);
    }
  });
});

const run = (filepath, {nodeArgs = [], mochaArgs = []} = {}, opts = {}) => {
  let executable;
  if (process.env.BROWSER) {
    executable = MOCHIFY_EXECUTABLE;
  } else if (nodeArgs.length) {
    executable = MOCHA_EXECUTABLE;
  } else {
    executable = _MOCHA_EXECUTABLE;
  }
  return spawnAsync(
    [executable].concat(nodeArgs, mochaArgs, '-C', filepath),
    opts
  );
};

const parseParameters = (fixture, args, done, spawnOpts = {}) => {
  if (typeof fixture === 'object') {
    spawnOpts = done;
    done = args;
    args = fixture;
    fixture = DEFAULT_FIXTURE;
  }
  if (typeof args === 'function') {
    spawnOpts = done;
    done = args;
    args = [];
  }
  if (typeof done !== 'function') {
    spawnOpts = done;
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

  return [fixturePath, commandArgs, spawnOpts, done];
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
exports.splitRegExp = new RegExp('[\\n' + Base.symbols.dot + ']+');

/**
 * Given a regexp-like string, escape it so it can be used with the `RegExp` constructor
 * @param {string} str - string to be escaped
 * @returns {string} Escaped string
 */

exports.escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
