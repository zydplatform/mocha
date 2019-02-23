'use strict';

var Promise = global.Promise || require('es6-promise');
var DEFAULT_FIXTURE = 'test/integration/fixtures/__default__.fixture.js';

function parseEpilog(result) {
  return ['passing', 'pending', 'failing'].reduce(function(summary, type) {
    var pattern = new RegExp('  (\\d+) ' + type + '\\s');
    var match = pattern.exec(result.output);
    summary[type] = match ? parseInt(match, 10) : 0;

    return summary;
  }, result);
}

var callbackify = function(promise, done) {
  return promise
    .catch(function(err) {
      if (typeof done === 'function') {
        process.nextTick(function() {
          done(err);
        });
      } else {
        return Promise.reject(err);
      }
    })
    .then(function(output) {
      if (typeof done === 'function') {
        process.nextTick(function() {
          done(null, output);
        });
      }
      return output;
    });
};

function run(file, args, opts, done) {
  return new Promise(function(resolve, reject) {
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    window.onmessage = function(evt) {
      resolve(evt.data);
    };

    iframe.contentDocument.write('<script src="/base/mocha.js"></script>');
    iframe.contentDocument.write(
      '<script src="/base/test/integration/browser/setup.js"></script>'
    );
    iframe.contentDocument.write(
      '<script src="/base/test/integration/fixtures/' + file + '"></script>'
    );
    iframe.contentDocument.write('<script>mocha.run()</script>');
  });
}

var parseParameters = function(file, args, done, opts) {
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
  args.color = false;
  args.file = file;
  return [file, args, opts, done || null];
};

exports.runMocha = function runMocha() {
  var params = parseParameters.apply(null, arguments);
  var file = params[0];
  var args = params[1];
  var done = params[3];
  var opts = params[2];
  args.reporter = args.reporter || 'spec';
  return callbackify(run(file, args, opts).then(parseEpilog), done);
};
