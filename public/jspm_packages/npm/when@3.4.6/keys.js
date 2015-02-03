/* */ 
"format cjs";
(function(define) {
  'use strict';
  define(function(require) {
    var when = require("./when");
    var Promise = when.Promise;
    var toPromise = when.resolve;
    return {
      all: when.lift(all),
      map: map
    };
    function all(object) {
      var p = Promise._defer();
      var resolver = Promise._handler(p);
      var results = {};
      var keys = Object.keys(object);
      var pending = keys.length;
      for (var i = 0,
          k; i < keys.length; ++i) {
        k = keys[i];
        Promise._handler(object[k]).fold(settleKey, k, results, resolver);
      }
      if (pending === 0) {
        resolver.resolve(results);
      }
      return p;
      function settleKey(k, x, resolver) {
        this[k] = x;
        if (--pending === 0) {
          resolver.resolve(results);
        }
      }
    }
    function map(object, f) {
      return toPromise(object).then(function(object) {
        return all(Object.keys(object).reduce(function(o, k) {
          o[k] = toPromise(object[k]).fold(mapWithKey, k);
          return o;
        }, {}));
      });
      function mapWithKey(k, x) {
        return f(x, k);
      }
    }
  });
})(typeof define === 'function' && define.amd ? define : function(factory) {
  module.exports = factory(require);
});
