/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var timed = require("./lib/decorators/timed");
    var array = require("./lib/decorators/array");
    var flow = require("./lib/decorators/flow");
    var fold = require("./lib/decorators/fold");
    var inspect = require("./lib/decorators/inspect");
    var generate = require("./lib/decorators/iterate");
    var progress = require("./lib/decorators/progress");
    var withThis = require("./lib/decorators/with");
    var unhandledRejection = require("./lib/decorators/unhandledRejection");
    var TimeoutError = require("./lib/TimeoutError");
    var Promise = [array, flow, fold, generate, progress, inspect, withThis, timed, unhandledRejection].reduce(function(Promise, feature) {
      return feature(Promise);
    }, require("./lib/Promise"));
    var slice = Array.prototype.slice;
    when.promise = promise;
    when.resolve = Promise.resolve;
    when.reject = Promise.reject;
    when.lift = lift;
    when['try'] = attempt;
    when.attempt = attempt;
    when.iterate = Promise.iterate;
    when.unfold = Promise.unfold;
    when.join = join;
    when.all = all;
    when.settle = settle;
    when.any = lift(Promise.any);
    when.some = lift(Promise.some);
    when.race = lift(Promise.race);
    when.map = map;
    when.filter = filter;
    when.reduce = reduce;
    when.reduceRight = reduceRight;
    when.isPromiseLike = isPromiseLike;
    when.Promise = Promise;
    when.defer = defer;
    when.TimeoutError = TimeoutError;
    function when(x, onFulfilled, onRejected) {
      var p = Promise.resolve(x);
      if (arguments.length < 2) {
        return p;
      }
      return arguments.length > 3 ? p.then(onFulfilled, onRejected, arguments[3]) : p.then(onFulfilled, onRejected);
    }
    function promise(resolver) {
      return new Promise(resolver);
    }
    function lift(f) {
      return function() {
        return _apply(f, this, slice.call(arguments));
      };
    }
    function attempt(f) {
      return _apply(f, this, slice.call(arguments, 1));
    }
    function _apply(f, thisArg, args) {
      return Promise.all(args).then(function(args) {
        return f.apply(thisArg, args);
      });
    }
    function defer() {
      return new Deferred();
    }
    function Deferred() {
      var p = Promise._defer();
      function resolve(x) {
        p._handler.resolve(x);
      }
      function reject(x) {
        p._handler.reject(x);
      }
      function notify(x) {
        p._handler.notify(x);
      }
      this.promise = p;
      this.resolve = resolve;
      this.reject = reject;
      this.notify = notify;
      this.resolver = {
        resolve: resolve,
        reject: reject,
        notify: notify
      };
    }
    function isPromiseLike(x) {
      return x && typeof x.then === 'function';
    }
    function join() {
      return Promise.all(arguments);
    }
    function all(promises) {
      return when(promises, Promise.all);
    }
    function settle(promises) {
      return when(promises, Promise.settle);
    }
    function map(promises, mapFunc) {
      return when(promises, function(promises) {
        return Promise.map(promises, mapFunc);
      });
    }
    function filter(promises, predicate) {
      return when(promises, function(promises) {
        return Promise.filter(promises, predicate);
      });
    }
    function reduce(promises, f) {
      var args = slice.call(arguments, 1);
      return when(promises, function(array) {
        args.unshift(array);
        return Promise.reduce.apply(Promise, args);
      });
    }
    function reduceRight(promises, f) {
      var args = slice.call(arguments, 1);
      return when(promises, function(array) {
        args.unshift(array);
        return Promise.reduceRight.apply(Promise, args);
      });
    }
    return when;
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
