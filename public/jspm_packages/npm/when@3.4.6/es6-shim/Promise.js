/* */ 
"format cjs";
(function(process) {
  !function(e) {
    "object" == typeof exports ? module.exports = e() : "function" == typeof define && define.amd ? define(e) : "undefined" != typeof window ? window.Promise = e() : "undefined" != typeof global ? global.Promise = e() : "undefined" != typeof self && (self.Promise = e());
  }(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            throw new Error("Cannot find module '" + o + "'");
          }
          var f = n[o] = {exports: {}};
          t[o][0].call(f.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, f, f.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(require, module, exports) {
        var unhandledRejections = require("../lib/decorators/unhandledRejection");
        var PromiseConstructor = unhandledRejections(require("../lib/Promise"));
        module.exports = typeof global != 'undefined' ? (global.Promise = PromiseConstructor) : typeof self != 'undefined' ? (self.Promise = PromiseConstructor) : PromiseConstructor;
      }, {
        "../lib/Promise": 2,
        "../lib/decorators/unhandledRejection": 6
      }],
      2: [function(require, module, exports) {
        (function(define) {
          'use strict';
          define(function(require) {
            var makePromise = require("./makePromise");
            var Scheduler = require("./Scheduler");
            var async = require("./async");
            return makePromise({scheduler: new Scheduler(async)});
          });
        })(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(require);
        });
      }, {
        "./Scheduler": 4,
        "./async": 5,
        "./makePromise": 7
      }],
      3: [function(require, module, exports) {
        (function(define) {
          'use strict';
          define(function() {
            function Queue(capacityPow2) {
              this.head = this.tail = this.length = 0;
              this.buffer = new Array(1 << capacityPow2);
            }
            Queue.prototype.push = function(x) {
              if (this.length === this.buffer.length) {
                this._ensureCapacity(this.length * 2);
              }
              this.buffer[this.tail] = x;
              this.tail = (this.tail + 1) & (this.buffer.length - 1);
              ++this.length;
              return this.length;
            };
            Queue.prototype.shift = function() {
              var x = this.buffer[this.head];
              this.buffer[this.head] = void 0;
              this.head = (this.head + 1) & (this.buffer.length - 1);
              --this.length;
              return x;
            };
            Queue.prototype._ensureCapacity = function(capacity) {
              var head = this.head;
              var buffer = this.buffer;
              var newBuffer = new Array(capacity);
              var i = 0;
              var len;
              if (head === 0) {
                len = this.length;
                for (; i < len; ++i) {
                  newBuffer[i] = buffer[i];
                }
              } else {
                capacity = buffer.length;
                len = this.tail;
                for (; head < capacity; ++i, ++head) {
                  newBuffer[i] = buffer[head];
                }
                for (head = 0; head < len; ++i, ++head) {
                  newBuffer[i] = buffer[head];
                }
              }
              this.buffer = newBuffer;
              this.head = 0;
              this.tail = this.length;
            };
            return Queue;
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory();
        }));
      }, {}],
      4: [function(require, module, exports) {
        (function(define) {
          'use strict';
          define(function(require) {
            var Queue = require("./Queue");
            function Scheduler(async) {
              this._async = async;
              this._queue = new Queue(15);
              this._afterQueue = new Queue(5);
              this._running = false;
              var self = this;
              this.drain = function() {
                self._drain();
              };
            }
            Scheduler.prototype.enqueue = function(task) {
              this._add(this._queue, task);
            };
            Scheduler.prototype.afterQueue = function(task) {
              this._add(this._afterQueue, task);
            };
            Scheduler.prototype._drain = function() {
              runQueue(this._queue);
              this._running = false;
              runQueue(this._afterQueue);
            };
            Scheduler.prototype._add = function(queue, task) {
              queue.push(task);
              if (!this._running) {
                this._running = true;
                this._async(this.drain);
              }
            };
            function runQueue(queue) {
              while (queue.length > 0) {
                queue.shift().run();
              }
            }
            return Scheduler;
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(require);
        }));
      }, {"./Queue": 3}],
      5: [function(require, module, exports) {
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
      }, {}],
      6: [function(require, module, exports) {
        (function(define) {
          'use strict';
          define(function(require) {
            var timer = require("../timer");
            return function unhandledRejection(Promise) {
              var logError = noop;
              var logInfo = noop;
              if (typeof console !== 'undefined') {
                logError = typeof console.error !== 'undefined' ? function(e) {
                  console.error(e);
                } : function(e) {
                  console.log(e);
                };
                logInfo = typeof console.info !== 'undefined' ? function(e) {
                  console.info(e);
                } : function(e) {
                  console.log(e);
                };
              }
              Promise.onPotentiallyUnhandledRejection = function(rejection) {
                enqueue(report, rejection);
              };
              Promise.onPotentiallyUnhandledRejectionHandled = function(rejection) {
                enqueue(unreport, rejection);
              };
              Promise.onFatalRejection = function(rejection) {
                enqueue(throwit, rejection.value);
              };
              var tasks = [];
              var reported = [];
              var running = false;
              function report(r) {
                if (!r.handled) {
                  reported.push(r);
                  logError('Potentially unhandled rejection [' + r.id + '] ' + formatError(r.value));
                }
              }
              function unreport(r) {
                var i = reported.indexOf(r);
                if (i >= 0) {
                  reported.splice(i, 1);
                  logInfo('Handled previous rejection [' + r.id + '] ' + formatObject(r.value));
                }
              }
              function enqueue(f, x) {
                tasks.push(f, x);
                if (!running) {
                  running = true;
                  running = timer.set(flush, 0);
                }
              }
              function flush() {
                running = false;
                while (tasks.length > 0) {
                  tasks.shift()(tasks.shift());
                }
              }
              return Promise;
            };
            function formatError(e) {
              var s = typeof e === 'object' && e.stack ? e.stack : formatObject(e);
              return e instanceof Error ? s : s + ' (WARNING: non-Error used)';
            }
            function formatObject(o) {
              var s = String(o);
              if (s === '[object Object]' && typeof JSON !== 'undefined') {
                s = tryStringify(o, s);
              }
              return s;
            }
            function tryStringify(e, defaultValue) {
              try {
                return JSON.stringify(e);
              } catch (e) {
                return defaultValue;
              }
            }
            function throwit(e) {
              throw e;
            }
            function noop() {}
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(require);
        }));
      }, {"../timer": 8}],
      7: [function(require, module, exports) {
        (function(define) {
          'use strict';
          define(function() {
            return function makePromise(environment) {
              var tasks = environment.scheduler;
              var objectCreate = Object.create || function(proto) {
                function Child() {}
                Child.prototype = proto;
                return new Child();
              };
              function Promise(resolver, handler) {
                this._handler = resolver === Handler ? handler : init(resolver);
              }
              function init(resolver) {
                var handler = new Pending();
                try {
                  resolver(promiseResolve, promiseReject, promiseNotify);
                } catch (e) {
                  promiseReject(e);
                }
                return handler;
                function promiseResolve(x) {
                  handler.resolve(x);
                }
                function promiseReject(reason) {
                  handler.reject(reason);
                }
                function promiseNotify(x) {
                  handler.notify(x);
                }
              }
              Promise.resolve = resolve;
              Promise.reject = reject;
              Promise.never = never;
              Promise._defer = defer;
              Promise._handler = getHandler;
              function resolve(x) {
                return isPromise(x) ? x : new Promise(Handler, new Async(getHandler(x)));
              }
              function reject(x) {
                return new Promise(Handler, new Async(new Rejected(x)));
              }
              function never() {
                return foreverPendingPromise;
              }
              function defer() {
                return new Promise(Handler, new Pending());
              }
              Promise.prototype.then = function(onFulfilled, onRejected) {
                var parent = this._handler;
                var state = parent.join().state();
                if ((typeof onFulfilled !== 'function' && state > 0) || (typeof onRejected !== 'function' && state < 0)) {
                  return new this.constructor(Handler, parent);
                }
                var p = this._beget();
                var child = p._handler;
                parent.chain(child, parent.receiver, onFulfilled, onRejected, arguments.length > 2 ? arguments[2] : void 0);
                return p;
              };
              Promise.prototype['catch'] = function(onRejected) {
                return this.then(void 0, onRejected);
              };
              Promise.prototype._beget = function() {
                var parent = this._handler;
                var child = new Pending(parent.receiver, parent.join().context);
                return new this.constructor(Handler, child);
              };
              Promise.all = all;
              Promise.race = race;
              function all(promises) {
                var resolver = new Pending();
                var pending = promises.length >>> 0;
                var results = new Array(pending);
                var i,
                    h,
                    x,
                    s;
                for (i = 0; i < promises.length; ++i) {
                  x = promises[i];
                  if (x === void 0 && !(i in promises)) {
                    --pending;
                    continue;
                  }
                  if (maybeThenable(x)) {
                    h = getHandlerMaybeThenable(x);
                    s = h.state();
                    if (s === 0) {
                      h.fold(settleAt, i, results, resolver);
                    } else if (s > 0) {
                      results[i] = h.value;
                      --pending;
                    } else {
                      unreportRemaining(promises, i + 1, h);
                      resolver.become(h);
                      break;
                    }
                  } else {
                    results[i] = x;
                    --pending;
                  }
                }
                if (pending === 0) {
                  resolver.become(new Fulfilled(results));
                }
                return new Promise(Handler, resolver);
                function settleAt(i, x, resolver) {
                  this[i] = x;
                  if (--pending === 0) {
                    resolver.become(new Fulfilled(this));
                  }
                }
              }
              function unreportRemaining(promises, start, rejectedHandler) {
                var i,
                    h,
                    x;
                for (i = start; i < promises.length; ++i) {
                  x = promises[i];
                  if (maybeThenable(x)) {
                    h = getHandlerMaybeThenable(x);
                    if (h !== rejectedHandler) {
                      h.visit(h, void 0, h._unreport);
                    }
                  }
                }
              }
              function race(promises) {
                if (Object(promises) === promises && promises.length === 0) {
                  return never();
                }
                var h = new Pending();
                var i,
                    x;
                for (i = 0; i < promises.length; ++i) {
                  x = promises[i];
                  if (x !== void 0 && i in promises) {
                    getHandler(x).visit(h, h.resolve, h.reject);
                  }
                }
                return new Promise(Handler, h);
              }
              function getHandler(x) {
                if (isPromise(x)) {
                  return x._handler.join();
                }
                return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
              }
              function getHandlerMaybeThenable(x) {
                return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
              }
              function getHandlerUntrusted(x) {
                try {
                  var untrustedThen = x.then;
                  return typeof untrustedThen === 'function' ? new Thenable(untrustedThen, x) : new Fulfilled(x);
                } catch (e) {
                  return new Rejected(e);
                }
              }
              function Handler() {}
              Handler.prototype.when = Handler.prototype.become = Handler.prototype.notify = Handler.prototype.fail = Handler.prototype._unreport = Handler.prototype._report = noop;
              Handler.prototype._state = 0;
              Handler.prototype.state = function() {
                return this._state;
              };
              Handler.prototype.join = function() {
                var h = this;
                while (h.handler !== void 0) {
                  h = h.handler;
                }
                return h;
              };
              Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
                this.when({
                  resolver: to,
                  receiver: receiver,
                  fulfilled: fulfilled,
                  rejected: rejected,
                  progress: progress
                });
              };
              Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
                this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
              };
              Handler.prototype.fold = function(f, z, c, to) {
                this.visit(to, function(x) {
                  f.call(c, z, x, this);
                }, to.reject, to.notify);
              };
              function FailIfRejected() {}
              inherit(Handler, FailIfRejected);
              FailIfRejected.prototype.become = function(h) {
                h.fail();
              };
              var failIfRejected = new FailIfRejected();
              function Pending(receiver, inheritedContext) {
                Promise.createContext(this, inheritedContext);
                this.consumers = void 0;
                this.receiver = receiver;
                this.handler = void 0;
                this.resolved = false;
              }
              inherit(Handler, Pending);
              Pending.prototype._state = 0;
              Pending.prototype.resolve = function(x) {
                this.become(getHandler(x));
              };
              Pending.prototype.reject = function(x) {
                if (this.resolved) {
                  return ;
                }
                this.become(new Rejected(x));
              };
              Pending.prototype.join = function() {
                if (!this.resolved) {
                  return this;
                }
                var h = this;
                while (h.handler !== void 0) {
                  h = h.handler;
                  if (h === this) {
                    return this.handler = cycle();
                  }
                }
                return h;
              };
              Pending.prototype.run = function() {
                var q = this.consumers;
                var handler = this.join();
                this.consumers = void 0;
                for (var i = 0; i < q.length; ++i) {
                  handler.when(q[i]);
                }
              };
              Pending.prototype.become = function(handler) {
                if (this.resolved) {
                  return ;
                }
                this.resolved = true;
                this.handler = handler;
                if (this.consumers !== void 0) {
                  tasks.enqueue(this);
                }
                if (this.context !== void 0) {
                  handler._report(this.context);
                }
              };
              Pending.prototype.when = function(continuation) {
                if (this.resolved) {
                  tasks.enqueue(new ContinuationTask(continuation, this.handler));
                } else {
                  if (this.consumers === void 0) {
                    this.consumers = [continuation];
                  } else {
                    this.consumers.push(continuation);
                  }
                }
              };
              Pending.prototype.notify = function(x) {
                if (!this.resolved) {
                  tasks.enqueue(new ProgressTask(x, this));
                }
              };
              Pending.prototype.fail = function(context) {
                var c = typeof context === 'undefined' ? this.context : context;
                this.resolved && this.handler.join().fail(c);
              };
              Pending.prototype._report = function(context) {
                this.resolved && this.handler.join()._report(context);
              };
              Pending.prototype._unreport = function() {
                this.resolved && this.handler.join()._unreport();
              };
              function Async(handler) {
                this.handler = handler;
              }
              inherit(Handler, Async);
              Async.prototype.when = function(continuation) {
                tasks.enqueue(new ContinuationTask(continuation, this));
              };
              Async.prototype._report = function(context) {
                this.join()._report(context);
              };
              Async.prototype._unreport = function() {
                this.join()._unreport();
              };
              function Thenable(then, thenable) {
                Pending.call(this);
                tasks.enqueue(new AssimilateTask(then, thenable, this));
              }
              inherit(Pending, Thenable);
              function Fulfilled(x) {
                Promise.createContext(this);
                this.value = x;
              }
              inherit(Handler, Fulfilled);
              Fulfilled.prototype._state = 1;
              Fulfilled.prototype.fold = function(f, z, c, to) {
                runContinuation3(f, z, this, c, to);
              };
              Fulfilled.prototype.when = function(cont) {
                runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
              };
              var errorId = 0;
              function Rejected(x) {
                Promise.createContext(this);
                this.id = ++errorId;
                this.value = x;
                this.handled = false;
                this.reported = false;
                this._report();
              }
              inherit(Handler, Rejected);
              Rejected.prototype._state = -1;
              Rejected.prototype.fold = function(f, z, c, to) {
                to.become(this);
              };
              Rejected.prototype.when = function(cont) {
                if (typeof cont.rejected === 'function') {
                  this._unreport();
                }
                runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
              };
              Rejected.prototype._report = function(context) {
                tasks.afterQueue(new ReportTask(this, context));
              };
              Rejected.prototype._unreport = function() {
                this.handled = true;
                tasks.afterQueue(new UnreportTask(this));
              };
              Rejected.prototype.fail = function(context) {
                Promise.onFatalRejection(this, context === void 0 ? this.context : context);
              };
              function ReportTask(rejection, context) {
                this.rejection = rejection;
                this.context = context;
              }
              ReportTask.prototype.run = function() {
                if (!this.rejection.handled) {
                  this.rejection.reported = true;
                  Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
                }
              };
              function UnreportTask(rejection) {
                this.rejection = rejection;
              }
              UnreportTask.prototype.run = function() {
                if (this.rejection.reported) {
                  Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
                }
              };
              Promise.createContext = Promise.enterContext = Promise.exitContext = Promise.onPotentiallyUnhandledRejection = Promise.onPotentiallyUnhandledRejectionHandled = Promise.onFatalRejection = noop;
              var foreverPendingHandler = new Handler();
              var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);
              function cycle() {
                return new Rejected(new TypeError('Promise cycle'));
              }
              function ContinuationTask(continuation, handler) {
                this.continuation = continuation;
                this.handler = handler;
              }
              ContinuationTask.prototype.run = function() {
                this.handler.join().when(this.continuation);
              };
              function ProgressTask(value, handler) {
                this.handler = handler;
                this.value = value;
              }
              ProgressTask.prototype.run = function() {
                var q = this.handler.consumers;
                if (q === void 0) {
                  return ;
                }
                for (var c,
                    i = 0; i < q.length; ++i) {
                  c = q[i];
                  runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
                }
              };
              function AssimilateTask(then, thenable, resolver) {
                this._then = then;
                this.thenable = thenable;
                this.resolver = resolver;
              }
              AssimilateTask.prototype.run = function() {
                var h = this.resolver;
                tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);
                function _resolve(x) {
                  h.resolve(x);
                }
                function _reject(x) {
                  h.reject(x);
                }
                function _notify(x) {
                  h.notify(x);
                }
              };
              function tryAssimilate(then, thenable, resolve, reject, notify) {
                try {
                  then.call(thenable, resolve, reject, notify);
                } catch (e) {
                  reject(e);
                }
              }
              function isPromise(x) {
                return x instanceof Promise;
              }
              function maybeThenable(x) {
                return (typeof x === 'object' || typeof x === 'function') && x !== null;
              }
              function runContinuation1(f, h, receiver, next) {
                if (typeof f !== 'function') {
                  return next.become(h);
                }
                Promise.enterContext(h);
                tryCatchReject(f, h.value, receiver, next);
                Promise.exitContext();
              }
              function runContinuation3(f, x, h, receiver, next) {
                if (typeof f !== 'function') {
                  return next.become(h);
                }
                Promise.enterContext(h);
                tryCatchReject3(f, x, h.value, receiver, next);
                Promise.exitContext();
              }
              function runNotify(f, x, h, receiver, next) {
                if (typeof f !== 'function') {
                  return next.notify(x);
                }
                Promise.enterContext(h);
                tryCatchReturn(f, x, receiver, next);
                Promise.exitContext();
              }
              function tryCatchReject(f, x, thisArg, next) {
                try {
                  next.become(getHandler(f.call(thisArg, x)));
                } catch (e) {
                  next.become(new Rejected(e));
                }
              }
              function tryCatchReject3(f, x, y, thisArg, next) {
                try {
                  f.call(thisArg, x, y, next);
                } catch (e) {
                  next.become(new Rejected(e));
                }
              }
              function tryCatchReturn(f, x, thisArg, next) {
                try {
                  next.notify(f.call(thisArg, x));
                } catch (e) {
                  next.notify(e);
                }
              }
              function inherit(Parent, Child) {
                Child.prototype = objectCreate(Parent.prototype);
                Child.prototype.constructor = Child;
              }
              function noop() {}
              return Promise;
            };
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory();
        }));
      }, {}],
      8: [function(require, module, exports) {
        (function(define) {
          'use strict';
          define(function(require) {
            var cjsRequire,
                vertx,
                setTimer,
                clearTimer;
            cjsRequire = require;
            try {
              vertx = cjsRequire('vertx');
            } catch (e) {}
            if (vertx && typeof vertx.setTimer === 'function') {
              setTimer = function(f, ms) {
                return vertx.setTimer(ms, f);
              };
              clearTimer = vertx.cancelTimer;
            } else {
              setTimer = function(f, ms) {
                return setTimeout(f, ms | 0);
              };
              clearTimer = function(t) {
                return clearTimeout(t);
              };
            }
            return {
              set: setTimer,
              clear: clearTimer
            };
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(require);
        }));
      }, {}]
    }, {}, [1])(1);
  });
  ;
})(require("process"));
