'use strict';
const nodeEnv = require('node-environment-flags');
const {deprecate, warn} = require('../utils');
const debug = require('debug')('mocha:cli:unparser');
const {
  unparseNodeFlags,
  isNodeFlag,
  impliesNoTimeouts
} = require('./node-flags');
const yargsUnparse = require('yargs-unparser');
const {aliases} = require('./run-option-metadata');

exports.unparse = function unparse(opts) {
  const mochaArgs = {_: []};
  const nodeArgs = {};

  /**
   * Given option/command `value`, disable timeouts if applicable
   * @param {string} [value] - Value to check
   * @ignore
   */
  const disableTimeouts = value => {
    if (impliesNoTimeouts(value)) {
      debug(`option "${value}" disabled timeouts`);
      mochaArgs.timeout = 0;
      delete mochaArgs.timeouts;
      delete mochaArgs.t;
    }
  };

  // sort options into "node" and "mocha" buckets
  Object.keys(opts).forEach(opt => {
    if (isNodeFlag(opt)) {
      nodeArgs[trimV8Option(opt)] = opts[opt];
      disableTimeouts(opt);
    } else {
      mochaArgs[opt] = opts[opt];
    }
  });

  // Native debugger handling
  // see https://nodejs.org/api/debugger.html#debugger_debugger
  // look for 'debug' or 'inspect' that would launch this debugger,
  // remove it from Mocha's opts and prepend it to Node's opts.
  // also coerce depending on Node.js version.
  // A deprecation warning will be printed by node, if applicable.
  // (mochaArgs._ are "positional" arguments, not prefixed with - or --)
  if (/^(debug|inspect)$/.test(mochaArgs._[0])) {
    const command = mochaArgs._.shift();
    disableTimeouts(command);
    // don't conflict with inspector
    ['debug', 'inspect', 'debug-brk', 'inspect-brk']
      .filter(opt => opt in nodeArgs || opt in mochaArgs)
      .forEach(opt => {
        warn(`command "${command}" provided; --${opt} ignored`);
        delete nodeArgs[opt];
        delete mochaArgs[opt];
      });
    nodeArgs._ = [
      parseInt(
        process.version
          .slice(1)
          .split('.')
          .shift(),
        10
      ) >= 8
        ? 'inspect'
        : 'debug'
    ];
  }

  // allow --debug to invoke --inspect on Node.js v8 or newer.
  ['debug', 'debug-brk']
    .filter(opt => opt in nodeArgs && !nodeEnv.has(opt))
    .forEach(opt => {
      const newOpt = opt === 'debug' ? 'inspect' : 'inspect-brk';
      warn(
        `"--${opt}" is not available in Node.js ${
          process.version
        }; use "--${newOpt}" instead.`
      );
      nodeArgs[newOpt] = nodeArgs[opt];
      mochaArgs.timeout = false;
      debug(`--${opt} -> ${newOpt}`);
      delete nodeArgs[opt];
    });

  // historical
  if (nodeArgs.gc) {
    deprecate(
      '"-gc" is deprecated and will be removed from a future version of Mocha.  Use "--gc-global" instead.'
    );
    nodeArgs['gc-global'] = nodeArgs.gc;
    delete nodeArgs.gc;
  }

  debug('final node args', nodeArgs);

  return {
    nodeArgs: unparseNodeFlags(nodeArgs),
    mochaArgs: yargsUnparse(mochaArgs, {alias: aliases})
  };
};

/**
 * If `value` begins with `v8-` and is not explicitly `v8-options`, remove prefix
 * @param {string} [value] - Value to check
 * @returns {string} `value` with prefix (maybe) removed
 * @ignore
 */
const trimV8Option = value =>
  value !== 'v8-options' && /^v8-/.test(value) ? value.slice(3) : value;
