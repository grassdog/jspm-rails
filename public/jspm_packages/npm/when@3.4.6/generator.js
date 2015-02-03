/* */ 
"format cjs";
(function(process) {
  (function(define) {
    'use strict';
    define(function(require) {
      var when = require("./when");
      var slice = Array.prototype.slice;
      function lift(generator) {
        return function() {
          return run(generator, this, arguments);
        };
      }
      function call(generator) {
        return run(generator, this, slice.call(arguments, 1));
      }
      function apply(generator, args) {
        return run(generator, this, args || []);
      }
      function run(generator, thisArg, args) {
        var stepper = new Stepper(next, error, generator.apply(thisArg, args));
        return stepper.step('next', void 0);
        function next(x) {
          return stepper.step('next', x);
        }
        function error(e) {
          return stepper.step('throw', e);
        }
      }
      function Stepper(next, error, iterator) {
        this.next = next;
        this.error = error;
        this.iterator = iterator;
      }
      Stepper.prototype.step = function(action, x) {
        try {
          return this._continue(action, x);
        } catch (e) {
          return when.reject(e);
        }
      };
      Stepper.prototype._continue = function(action, x) {
        var result = this.iterator[action](x);
        return result.done ? result.value : when(result.value, this.next, this.error);
      };
      return {
        lift: lift,
        call: call,
        apply: apply
      };
    });
  }(typeof define === 'function' && define.amd ? define : function(factory) {
    module.exports = factory(require);
  }));
})(require("process"));
