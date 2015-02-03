/* */ 
(function(process) {
  'use strict';
  var ReactInstanceMap = require("./ReactInstanceMap");
  var ReactMount = require("./ReactMount");
  var invariant = require("./invariant");
  var isNode = require("./isNode");
  function findDOMNode(componentOrElement) {
    if (componentOrElement == null) {
      return null;
    }
    if (isNode(componentOrElement)) {
      return componentOrElement;
    }
    if (ReactInstanceMap.has(componentOrElement)) {
      return ReactMount.getNodeFromInstance(componentOrElement);
    }
    ("production" !== process.env.NODE_ENV ? invariant(componentOrElement.render == null || typeof componentOrElement.render !== 'function', 'Component (with keys: %s) contains `render` method ' + 'but is not mounted in the DOM', Object.keys(componentOrElement)) : invariant(componentOrElement.render == null || typeof componentOrElement.render !== 'function'));
    ("production" !== process.env.NODE_ENV ? invariant(false, 'Element appears to be neither ReactComponent nor DOMNode (keys: %s)', Object.keys(componentOrElement)) : invariant(false));
  }
  module.exports = findDOMNode;
})(require("process"));
