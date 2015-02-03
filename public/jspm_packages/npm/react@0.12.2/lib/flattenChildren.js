/* */ 
(function(process) {
  "use strict";
  var ReactTextComponent = require("./ReactTextComponent");
  var traverseAllChildren = require("./traverseAllChildren");
  var warning = require("./warning");
  function flattenSingleChildIntoContext(traverseContext, child, name) {
    var result = traverseContext;
    var keyUnique = !result.hasOwnProperty(name);
    ("production" !== process.env.NODE_ENV ? warning(keyUnique, 'flattenChildren(...): Encountered two children with the same key, ' + '`%s`. Child keys must be unique; when two children share a key, only ' + 'the first child will be used.', name) : null);
    if (keyUnique && child != null) {
      var type = typeof child;
      var normalizedValue;
      if (type === 'string') {
        normalizedValue = ReactTextComponent(child);
      } else if (type === 'number') {
        normalizedValue = ReactTextComponent('' + child);
      } else {
        normalizedValue = child;
      }
      result[name] = normalizedValue;
    }
  }
  function flattenChildren(children) {
    if (children == null) {
      return children;
    }
    var result = {};
    traverseAllChildren(children, flattenSingleChildIntoContext, result);
    return result;
  }
  module.exports = flattenChildren;
})(require("process"));
