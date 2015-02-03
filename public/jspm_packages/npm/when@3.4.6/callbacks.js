/* */ 
"format cjs";
(function(process) {
  (function(define) {
    define(function(require) {
      var when = require("./when");
      var Promise = when.Promise;
      var _liftAll = require("./lib/liftAll");
      var slice = Array.prototype.slice;
      return {
        lift: lift,
        liftAll: liftAll,
        apply: apply,
        call: call,
        promisify: promisify
      };
      function apply(asyncFunction, extraAsyncArgs) {
        return _apply(asyncFunction, this, extraAsyncArgs || []);
      }
      function _apply(asyncFunction, thisArg, extraAsyncArgs) {
        return Promise.all(extraAsyncArgs).then(function(args) {
          var p = Promise._defer();
          args.push(alwaysUnary(p._handler.resolve, p._handler), alwaysUnary(p._handler.reject, p._handler));
          asyncFunction.apply(thisArg, args);
          return p;
        });
      }
      function call(asyncFunction) {
        return _apply(asyncFunction, this, slice.call(arguments, 1));
      }
      function lift(f) {
        var args = arguments.length > 1 ? slice.call(arguments, 1) : [];
        return function() {
          return _apply(f, this, args.concat(slice.call(arguments)));
        };
      }
      function liftAll(src, combine, dst) {
        return _liftAll(lift, combine, dst, src);
      }
      function promisify(asyncFunction, positions) {
        return function() {
          var thisArg = this;
          return Promise.all(arguments).then(function(args) {
            var p = Promise._defer();
            var callbackPos,
                errbackPos;
            if ('callback' in positions) {
              callbackPos = normalizePosition(args, positions.callback);
            }
            if ('errback' in positions) {
              errbackPos = normalizePosition(args, positions.errback);
            }
            if (errbackPos < callbackPos) {
              insertCallback(args, errbackPos, p._handler.reject, p._handler);
              insertCallback(args, callbackPos, p._handler.resolve, p._handler);
            } else {
              insertCallback(args, callbackPos, p._handler.resolve, p._handler);
              insertCallback(args, errbackPos, p._handler.reject, p._handler);
            }
            asyncFunction.apply(thisArg, args);
            return p;
          });
        };
      }
      function normalizePosition(args, pos) {
        return pos < 0 ? (args.length + pos + 2) : pos;
      }
      function insertCallback(args, pos, callback, thisArg) {
        if (pos != null) {
          callback = alwaysUnary(callback, thisArg);
          if (pos < 0) {
            pos = args.length + pos + 2;
          }
          args.splice(pos, 0, callback);
        }
      }
      function alwaysUnary(fn, thisArg) {
        return function() {
          if (arguments.length > 1) {
            fn.call(thisArg, slice.call(arguments));
          } else {
            fn.apply(thisArg, arguments);
          }
        };
      }
    });
  })(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  });
})(require("process"));
