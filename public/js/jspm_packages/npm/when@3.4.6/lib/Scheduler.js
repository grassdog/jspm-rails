/* */ 
"format cjs";
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
