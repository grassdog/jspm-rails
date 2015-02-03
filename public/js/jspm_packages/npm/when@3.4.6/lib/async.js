/* */ 
"format cjs";
(function(process) {
  (function(define) {
    'use strict';
    define(function(require) {
      var nextTick,
          MutationObs;
      if (typeof process !== 'undefined' && process !== null && typeof process.nextTick === 'function') {
        nextTick = function(f) {
          process.nextTick(f);
        };
      } else if (MutationObs = (typeof MutationObserver === 'function' && MutationObserver) || (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
        nextTick = (function(document, MutationObserver) {
          var scheduled;
          var el = document.createElement('div');
          var o = new MutationObserver(run);
          o.observe(el, {attributes: true});
          function run() {
            var f = scheduled;
            scheduled = void 0;
            f();
          }
          return function(f) {
            scheduled = f;
            el.setAttribute('class', 'x');
          };
        }(document, MutationObs));
      } else {
        nextTick = (function(cjsRequire) {
          var vertx;
          try {
            vertx = cjsRequire('vertx');
          } catch (ignore) {}
          if (vertx) {
            if (typeof vertx.runOnLoop === 'function') {
              return vertx.runOnLoop;
            }
            if (typeof vertx.runOnContext === 'function') {
              return vertx.runOnContext;
            }
          }
          var capturedSetTimeout = setTimeout;
          return function(t) {
            capturedSetTimeout(t, 0);
          };
        }(require));
      }
      return nextTick;
    });
  }(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  }));
})(require("process"));
