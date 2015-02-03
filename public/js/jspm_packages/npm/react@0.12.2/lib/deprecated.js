/* */ 
(function(process) {
  var assign = require("./Object.assign");
  var warning = require("./warning");
  function deprecated(namespace, oldName, newName, ctx, fn) {
    var warned = false;
    if ("production" !== process.env.NODE_ENV) {
      var newFn = function() {
        ("production" !== process.env.NODE_ENV ? warning(warned, (namespace + "." + oldName + " will be deprecated in a future version. ") + ("Use " + namespace + "." + newName + " instead.")) : null);
        warned = true;
        return fn.apply(ctx, arguments);
      };
      newFn.displayName = (namespace + "_" + oldName);
      return assign(newFn, fn);
    }
    return fn;
  }
  module.exports = deprecated;
})(require("process"));
