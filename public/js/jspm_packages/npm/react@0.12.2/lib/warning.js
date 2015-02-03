/* */ 
(function(process) {
  "use strict";
  var emptyFunction = require("./emptyFunction");
  var warning = emptyFunction;
  if ("production" !== process.env.NODE_ENV) {
    warning = function(condition, format) {
      for (var args = [],
          $__0 = 2,
          $__1 = arguments.length; $__0 < $__1; $__0++)
        args.push(arguments[$__0]);
      if (format === undefined) {
        throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
      }
      if (!condition) {
        var argIndex = 0;
        console.warn('Warning: ' + format.replace(/%s/g, function() {
          return args[argIndex++];
        }));
      }
    };
  }
  module.exports = warning;
})(require("process"));
