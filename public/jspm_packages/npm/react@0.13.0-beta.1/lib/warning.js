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
      if (format.indexOf('Failed CompositeComponent proptype check. ') === 0) {
        return ;
      }
      if (!condition) {
        var argIndex = 0;
        var message = 'Warning: ' + format.replace(/%s/g, function() {
          return args[argIndex++];
        });
        console.warn(message);
        try {
          throw new Error(message);
        } catch (x) {}
      }
    };
  }
  module.exports = warning;
})(require("process"));
