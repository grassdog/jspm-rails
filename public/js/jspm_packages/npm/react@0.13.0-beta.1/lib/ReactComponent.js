/* */ 
(function(process) {
  'use strict';
  var ReactUpdateQueue = require("./ReactUpdateQueue");
  var invariant = require("./invariant");
  var warning = require("./warning");
  function ReactComponent(props, context) {
    this.props = props;
    this.context = context;
  }
  ReactComponent.prototype.setState = function(partialState, callback) {
    ("production" !== process.env.NODE_ENV ? invariant(typeof partialState === 'object' || partialState == null, 'setState(...): takes an object of state variables to update.') : invariant(typeof partialState === 'object' || partialState == null));
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(partialState != null, 'setState(...): You passed an undefined or null state object; ' + 'instead, use forceUpdate().') : null);
    }
    ReactUpdateQueue.enqueueSetState(this, partialState);
    if (callback) {
      ReactUpdateQueue.enqueueCallback(this, callback);
    }
  };
  ReactComponent.prototype.forceUpdate = function(callback) {
    ReactUpdateQueue.enqueueForceUpdate(this);
    if (callback) {
      ReactUpdateQueue.enqueueCallback(this, callback);
    }
  };
  if ("production" !== process.env.NODE_ENV) {
    if (Object.defineProperty) {
      var deprecatedAPIs = {
        getDOMNode: 'getDOMNode',
        isMounted: 'isMounted',
        replaceState: 'replaceState',
        setProps: 'setProps'
      };
      var defineDeprecationWarning = function(methodName, displayName) {
        Object.defineProperty(ReactComponent.prototype, methodName, {get: function() {
            ("production" !== process.env.NODE_ENV ? warning(false, '%s(...) is deprecated in plain JavaScript React classes.', displayName) : null);
            return undefined;
          }});
      };
      for (var methodName in deprecatedAPIs) {
        if (deprecatedAPIs.hasOwnProperty(methodName)) {
          defineDeprecationWarning(methodName, deprecatedAPIs[methodName]);
        }
      }
    }
  }
  module.exports = ReactComponent;
})(require("process"));
