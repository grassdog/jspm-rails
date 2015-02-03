/* */ 
(function(process) {
  "use strict";
  var ReactLifeCycle = require("./ReactLifeCycle");
  var ReactCurrentOwner = require("./ReactCurrentOwner");
  var ReactElement = require("./ReactElement");
  var ReactInstanceMap = require("./ReactInstanceMap");
  var ReactUpdates = require("./ReactUpdates");
  var assign = require("./Object.assign");
  var invariant = require("./invariant");
  function enqueueUpdate(internalInstance) {
    if (internalInstance !== ReactLifeCycle.currentlyMountingInstance) {
      ReactUpdates.enqueueUpdate(internalInstance);
    }
  }
  function getInternalInstanceReadyForUpdate(publicInstance, callerName) {
    ("production" !== process.env.NODE_ENV ? invariant(ReactCurrentOwner.current == null, '%s(...): Cannot update during an existing state transition ' + '(such as within `render`). Render methods should be a pure function ' + 'of props and state.', callerName) : invariant(ReactCurrentOwner.current == null));
    var internalInstance = ReactInstanceMap.get(publicInstance);
    ("production" !== process.env.NODE_ENV ? invariant(internalInstance, '%s(...): Can only update a mounted or mounting component. ' + 'This usually means you called %s() on an unmounted ' + 'component.', callerName, callerName) : invariant(internalInstance));
    ("production" !== process.env.NODE_ENV ? invariant(internalInstance !== ReactLifeCycle.currentlyUnmountingInstance, '%s(...): Cannot call %s() on an unmounting component.', callerName, callerName) : invariant(internalInstance !== ReactLifeCycle.currentlyUnmountingInstance));
    return internalInstance;
  }
  var ReactUpdateQueue = {
    enqueueCallback: function(publicInstance, callback) {
      ("production" !== process.env.NODE_ENV ? invariant(typeof callback === 'function', 'enqueueCallback(...): You called `setProps`, `replaceProps`, ' + '`setState`, `replaceState`, or `forceUpdate` with a callback that ' + 'isn\'t callable.') : invariant(typeof callback === 'function'));
      var internalInstance = ReactInstanceMap.get(publicInstance);
      ("production" !== process.env.NODE_ENV ? invariant(internalInstance, 'Cannot enqueue a callback on an instance that is unmounted.') : invariant(internalInstance));
      if (internalInstance === ReactLifeCycle.currentlyMountingInstance) {
        return ;
      }
      if (internalInstance._pendingCallbacks) {
        internalInstance._pendingCallbacks.push(callback);
      } else {
        internalInstance._pendingCallbacks = [callback];
      }
      enqueueUpdate(internalInstance);
    },
    enqueueCallbackInternal: function(internalInstance, callback) {
      ("production" !== process.env.NODE_ENV ? invariant(typeof callback === "function", 'enqueueCallback(...): You called `setProps`, `replaceProps`, ' + '`setState`, `replaceState`, or `forceUpdate` with a callback that ' + 'isn\'t callable.') : invariant(typeof callback === "function"));
      if (internalInstance._pendingCallbacks) {
        internalInstance._pendingCallbacks.push(callback);
      } else {
        internalInstance._pendingCallbacks = [callback];
      }
    },
    enqueueForceUpdate: function(publicInstance) {
      var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'forceUpdate');
      internalInstance._pendingForceUpdate = true;
      enqueueUpdate(internalInstance);
    },
    enqueueReplaceState: function(publicInstance, completeState) {
      var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'replaceState');
      internalInstance._pendingState = completeState;
      enqueueUpdate(internalInstance);
    },
    enqueueSetState: function(publicInstance, partialState) {
      var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'setState');
      internalInstance._pendingState = assign({}, internalInstance._pendingState || internalInstance._instance.state, partialState);
      enqueueUpdate(internalInstance);
    },
    enqueueSetProps: function(publicInstance, partialProps) {
      var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'setProps');
      ("production" !== process.env.NODE_ENV ? invariant(internalInstance._isTopLevel, 'setProps(...): You called `setProps` on a ' + 'component with a parent. This is an anti-pattern since props will ' + 'get reactively updated when rendered. Instead, change the owner\'s ' + '`render` method to pass the correct value as props to the component ' + 'where it is created.') : invariant(internalInstance._isTopLevel));
      var element = internalInstance._pendingElement || internalInstance._currentElement;
      var props = assign({}, element.props, partialProps);
      internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(element, props);
      enqueueUpdate(internalInstance);
    },
    enqueueReplaceProps: function(publicInstance, props) {
      var internalInstance = getInternalInstanceReadyForUpdate(publicInstance, 'replaceProps');
      ("production" !== process.env.NODE_ENV ? invariant(internalInstance._isTopLevel, 'replaceProps(...): You called `replaceProps` on a ' + 'component with a parent. This is an anti-pattern since props will ' + 'get reactively updated when rendered. Instead, change the owner\'s ' + '`render` method to pass the correct value as props to the component ' + 'where it is created.') : invariant(internalInstance._isTopLevel));
      var element = internalInstance._pendingElement || internalInstance._currentElement;
      internalInstance._pendingElement = ReactElement.cloneAndReplaceProps(element, props);
      enqueueUpdate(internalInstance);
    },
    enqueueElementInternal: function(internalInstance, newElement) {
      internalInstance._pendingElement = newElement;
      enqueueUpdate(internalInstance);
    }
  };
  module.exports = ReactUpdateQueue;
})(require("process"));
