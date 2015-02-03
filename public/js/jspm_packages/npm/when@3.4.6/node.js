/* */ 
"format cjs";
(function(process) {
  (function(define) {
    define(function(require) {
      var when = require("./when");
      var Promise = when.Promise;
      var _liftAll = require("./lib/liftAll");
      var setTimer = require("./lib/timer").set;
      var slice = Array.prototype.slice;
      return {
        lift: lift,
        liftAll: liftAll,
        apply: apply,
        call: call,
        createCallback: createCallback,
        bindCallback: bindCallback,
        liftCallback: liftCallback
      };
      function apply(f, args) {
        return run(f, this, args || []);
      }
      function run(f, thisArg, args) {
        var p = Promise._defer();
        switch (args.length) {
          case 2:
            apply2(p._handler, f, thisArg, args);
            break;
          case 1:
            apply1(p._handler, f, thisArg, args);
            break;
          default:
            applyN(p._handler, f, thisArg, args);
        }
        return p;
      }
      function applyN(resolver, f, thisArg, args) {
        Promise.all(args)._handler.fold(function(f, args, resolver) {
          args.push(createCallback(resolver));
          f.apply(this, args);
        }, f, thisArg, resolver);
      }
      function apply2(resolver, f, thisArg, args) {
        Promise._handler(args[0]).fold(function(x, y, resolver) {
          Promise._handler(x).fold(function(x, y, resolver) {
            f.call(this, x, y, createCallback(resolver));
          }, y, this, resolver);
        }, args[1], thisArg, resolver);
      }
      function apply1(resolver, f, thisArg, args) {
        Promise._handler(args[0]).fold(function(f, x, resolver) {
          f.call(this, x, createCallback(resolver));
        }, f, thisArg, resolver);
      }
      function call(f) {
        return run(f, this, slice.call(arguments, 1));
      }
      function lift(f) {
        var args1 = arguments.length > 1 ? slice.call(arguments, 1) : [];
        return function() {
          var l = args1.length;
          var al = arguments.length;
          var args = new Array(al + l);
          var i;
          for (i = 0; i < l; ++i) {
            args[i] = args1[i];
          }
          for (i = 0; i < al; ++i) {
            args[i + l] = arguments[i];
          }
          return run(f, this, args);
        };
      }
      function liftAll(src, combine, dst) {
        return _liftAll(lift, combine, dst, src);
      }
      function createCallback(resolver) {
        return function(err, value) {
          if (err) {
            resolver.reject(err);
          } else if (arguments.length > 2) {
            resolver.resolve(slice.call(arguments, 1));
          } else {
            resolver.resolve(value);
          }
        };
      }
      function bindCallback(promise, callback) {
        promise = when(promise);
        if (callback) {
          promise.then(success, wrapped);
        }
        return promise;
        function success(value) {
          wrapped(null, value);
        }
        function wrapped(err, value) {
          setTimer(function() {
            callback(err, value);
          }, 0);
        }
      }
      function liftCallback(callback) {
        return function(promise) {
          return bindCallback(promise, callback);
        };
      }
    });
  })(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  });
})(require("process"));
