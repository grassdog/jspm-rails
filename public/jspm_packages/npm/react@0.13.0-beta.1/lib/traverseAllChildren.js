/* */ 
(function(process) {
  'use strict';
  var ReactElement = require("./ReactElement");
  var ReactInstanceHandles = require("./ReactInstanceHandles");
  var getIteratorFn = require("./getIteratorFn");
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
  function traverseAllChildrenImpl(children, nameSoFar, indexSoFar, callback, traverseContext) {
    var type = typeof children;
    if (type === 'undefined' || type === 'boolean') {
      children = null;
    }
    if (children === null || type === 'string' || type === 'number' || ReactElement.isValidElement(children)) {
      callback(traverseContext, children, nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar, indexSoFar);
      return 1;
    }
    var child,
        nextName,
        nextIndex;
    var subtreeCount = 0;
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        child = children[i];
        nextName = ((nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) + getComponentKey(child, i));
        nextIndex = indexSoFar + subtreeCount;
        subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);
      }
    } else {
      var iteratorFn = getIteratorFn(children);
      if (iteratorFn) {
        var iterator = iteratorFn.call(children);
        var step;
        if (iteratorFn !== children.entries) {
          var ii = 0;
          while (!(step = iterator.next()).done) {
            child = step.value;
            nextName = ((nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) + getComponentKey(child, ii++));
            nextIndex = indexSoFar + subtreeCount;
            subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);
          }
        } else {
          while (!(step = iterator.next()).done) {
            var entry = step.value;
            if (entry) {
              child = entry[1];
              nextName = ((nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) + wrapUserProvidedKey(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0));
              nextIndex = indexSoFar + subtreeCount;
              subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);
            }
          }
        }
      } else if (type === 'object') {
        ("production" !== process.env.NODE_ENV ? invariant(children.nodeType !== 1, 'traverseAllChildren(...): Encountered an invalid child; DOM ' + 'elements are not valid children of React components.') : invariant(children.nodeType !== 1));
        for (var key in children) {
          if (children.hasOwnProperty(key)) {
            child = children[key];
            nextName = ((nameSoFar !== '' ? nameSoFar + SUBSEPARATOR : SEPARATOR) + wrapUserProvidedKey(key) + SUBSEPARATOR + getComponentKey(child, 0));
            nextIndex = indexSoFar + subtreeCount;
            subtreeCount += traverseAllChildrenImpl(child, nextName, nextIndex, callback, traverseContext);
          }
        }
      }
    }
    return subtreeCount;
  }
  function traverseAllChildren(children, callback, traverseContext) {
    if (children == null) {
      return 0;
    }
    return traverseAllChildrenImpl(children, '', 0, callback, traverseContext);
  }
  module.exports = traverseAllChildren;
})(require("process"));
