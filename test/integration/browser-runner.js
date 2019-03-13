'use strict';

const {spawn} = require('cross-spawn');
const {loadRc} = require('../../lib/cli/options');
const {unparse} = require('../../lib/cli/unparser');
const MOCHIFY_EXECUTABLE = require.resolve('mochify/bin/cmd.js');
const debug = require('debug')('mocha:test:browser-runner');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

/**
 * Ensure `DEBUG` is not passed to child processes.
 * (alternatively, we could redirect debug to some other stream?)
 */
const DEFAULT_SPAWN_OPTS = {
  stdio: ['ignore', 'pipe', 'ignore'],
  env: Object.assign({}, process.env, {DEBUG: undefined})
};

const RC_OPTS = Object.assign(loadRc(), {
  global: undefined,
  timeout: 5000,
  require: undefined,
  ui: undefined
});
const RC_ARGS = unparse(RC_OPTS).mochaArgs;

exports.run = (filepath, {mochaArgs = []} = {}, opts = {}) => {
  const spawnArgs = opts.exactArgs
    ? [MOCHIFY_EXECUTABLE].concat(RC_ARGS, mochaArgs, `--mocha-path=${ROOT}`)
    : [MOCHIFY_EXECUTABLE].concat(
        RC_ARGS,
        mochaArgs,
        '--colors=false',
        `--mocha-path=${ROOT}`,
        filepath
      );
  debug('spawn cmd: %O', spawnArgs.join(' '));
  return spawnAsync(spawnArgs, opts);
};

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
          output: output.replace(/^#.+?\n/, ''),
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
