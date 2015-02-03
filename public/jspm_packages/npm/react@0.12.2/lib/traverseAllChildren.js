/* */ 
(function(process) {
  "use strict";
  var ReactElement = require("./ReactElement");
  var ReactInstanceHandles = require("./ReactInstanceHandles");
  var invariant = require("./invariant");
  var SEPARATOR = ReactInstanceHandles.SEPARATOR;
  var SUBSEPARATOR = ':';
  var userProvidedKeyEscaperLookup = {
    '=': '=0',
    '.': '=1',
    ':': '=2'
  };
  var userProvidedKeyEscapeRegex = /[=.:]/g;
  function userProvidedKeyEscaper(match) {
    return userProvidedKeyEscaperLookup[match];
  }
  function getComponentKey(component, index) {
    if (component && component.key != null) {
      return wrapUserProvidedKey(component.key);
    }
    return index.toString(36);
  }
  function escapeUserProvidedKey(text) {
    return ('' + text).replace(userProvidedKeyEscapeRegex, userProvidedKeyEscaper);
  }
  function wrapUserProvidedKey(key) {
    return '$' + escapeUserProvidedKey(key);
  }
  var traverseAllChildrenImpl = function(children, nameSoFar, indexSoFar, callback, traverseContext) {
    var nextName,
        nextIndex;
    var subtreeCount = 0;
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        nextName = (nameSoFar + (nameSoFar ? SUBSEPARATOR : SEPARATOR) + getComponentKey(child, i));
        nextIndex = indexSoFar + subtreeCount;
        subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);
      }
    } else {
      var type = typeof children;
      var isOnlyChild = nameSoFar === '';
      var storageName = isOnlyChild ? SEPARATOR + getComponentKey(children, 0) : nameSoFar;
      if (children == null || type === 'boolean') {
        callback(traverseContext, null, storageName, indexSoFar);
        subtreeCount = 1;
      } else if (type === 'string' || type === 'number' || ReactElement.isValidElement(children)) {
        callback(traverseContext, children, storageName, indexSoFar);
        subtreeCount = 1;
      } else if (type === 'object') {
        ("production" !== process.env.NODE_ENV ? invariant(!children || children.nodeType !== 1, 'traverseAllChildren(...): Encountered an invalid child; DOM ' + 'elements are not valid children of React components.') : invariant(!children || children.nodeType !== 1));
        for (var key in children) {
          if (children.hasOwnProperty(key)) {
            nextName = (nameSoFar + (nameSoFar ? SUBSEPARATOR : SEPARATOR) + wrapUserProvidedKey(key) + SUBSEPARATOR + getComponentKey(children[key], 0));
            nextIndex = indexSoFar + subtreeCount;
            subtreeCount += traverseAllChildrenImpl(children[key], nextName, nextIndex, callback, traverseContext);
          }
        }
      }
    }
    return subtreeCount;
  };
  function traverseAllChildren(children, callback, traverseContext) {
    if (children == null) {
      return 0;
    }
    return traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
  }
  module.exports = traverseAllChildren;
})(require("process"));
