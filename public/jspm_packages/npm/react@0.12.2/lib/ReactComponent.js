/* */ 
(function(process) {
  "use strict";
  var ReactElement = require("./ReactElement");
  var ReactOwner = require("./ReactOwner");
  var ReactUpdates = require("./ReactUpdates");
  var assign = require("./Object.assign");
  var invariant = require("./invariant");
  var keyMirror = require("./keyMirror");
  var ComponentLifeCycle = keyMirror({
    MOUNTED: null,
    UNMOUNTED: null
  });
  var injected = false;
  var unmountIDFromEnvironment = null;
  var mountImageIntoNode = null;
  var ReactComponent = {
    injection: {injectEnvironment: function(ReactComponentEnvironment) {
        ("production" !== process.env.NODE_ENV ? invariant(!injected, 'ReactComponent: injectEnvironment() can only be called once.') : invariant(!injected));
        mountImageIntoNode = ReactComponentEnvironment.mountImageIntoNode;
        unmountIDFromEnvironment = ReactComponentEnvironment.unmountIDFromEnvironment;
        ReactComponent.BackendIDOperations = ReactComponentEnvironment.BackendIDOperations;
        injected = true;
      }},
    LifeCycle: ComponentLifeCycle,
    BackendIDOperations: null,
    Mixin: {
      isMounted: function() {
        return this._lifeCycleState === ComponentLifeCycle.MOUNTED;
      },
      setProps: function(partialProps, callback) {
        var element = this._pendingElement || this._currentElement;
        this.replaceProps(assign({}, element.props, partialProps), callback);
      },
      replaceProps: function(props, callback) {
        ("production" !== process.env.NODE_ENV ? invariant(this.isMounted(), 'replaceProps(...): Can only update a mounted component.') : invariant(this.isMounted()));
        ("production" !== process.env.NODE_ENV ? invariant(this._mountDepth === 0, 'replaceProps(...): You called `setProps` or `replaceProps` on a ' + 'component with a parent. This is an anti-pattern since props will ' + 'get reactively updated when rendered. Instead, change the owner\'s ' + '`render` method to pass the correct value as props to the component ' + 'where it is created.') : invariant(this._mountDepth === 0));
        this._pendingElement = ReactElement.cloneAndReplaceProps(this._pendingElement || this._currentElement, props);
        ReactUpdates.enqueueUpdate(this, callback);
      },
      _setPropsInternal: function(partialProps, callback) {
        var element = this._pendingElement || this._currentElement;
        this._pendingElement = ReactElement.cloneAndReplaceProps(element, assign({}, element.props, partialProps));
        ReactUpdates.enqueueUpdate(this, callback);
      },
      construct: function(element) {
        this.props = element.props;
        this._owner = element._owner;
        this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
        this._pendingCallbacks = null;
        this._currentElement = element;
        this._pendingElement = null;
      },
      mountComponent: function(rootID, transaction, mountDepth) {
        ("production" !== process.env.NODE_ENV ? invariant(!this.isMounted(), 'mountComponent(%s, ...): Can only mount an unmounted component. ' + 'Make sure to avoid storing components between renders or reusing a ' + 'single component instance in multiple places.', rootID) : invariant(!this.isMounted()));
        var ref = this._currentElement.ref;
        if (ref != null) {
          var owner = this._currentElement._owner;
          ReactOwner.addComponentAsRefTo(this, ref, owner);
        }
        this._rootNodeID = rootID;
        this._lifeCycleState = ComponentLifeCycle.MOUNTED;
        this._mountDepth = mountDepth;
      },
      unmountComponent: function() {
        ("production" !== process.env.NODE_ENV ? invariant(this.isMounted(), 'unmountComponent(): Can only unmount a mounted component.') : invariant(this.isMounted()));
        var ref = this._currentElement.ref;
        if (ref != null) {
          ReactOwner.removeComponentAsRefFrom(this, ref, this._owner);
        }
        unmountIDFromEnvironment(this._rootNodeID);
        this._rootNodeID = null;
        this._lifeCycleState = ComponentLifeCycle.UNMOUNTED;
      },
      receiveComponent: function(nextElement, transaction) {
        ("production" !== process.env.NODE_ENV ? invariant(this.isMounted(), 'receiveComponent(...): Can only update a mounted component.') : invariant(this.isMounted()));
        this._pendingElement = nextElement;
        this.performUpdateIfNecessary(transaction);
      },
      performUpdateIfNecessary: function(transaction) {
        if (this._pendingElement == null) {
          return ;
        }
        var prevElement = this._currentElement;
        var nextElement = this._pendingElement;
        this._currentElement = nextElement;
        this.props = nextElement.props;
        this._owner = nextElement._owner;
        this._pendingElement = null;
        this.updateComponent(transaction, prevElement);
      },
      updateComponent: function(transaction, prevElement) {
        var nextElement = this._currentElement;
        if (nextElement._owner !== prevElement._owner || nextElement.ref !== prevElement.ref) {
          if (prevElement.ref != null) {
            ReactOwner.removeComponentAsRefFrom(this, prevElement.ref, prevElement._owner);
          }
          if (nextElement.ref != null) {
            ReactOwner.addComponentAsRefTo(this, nextElement.ref, nextElement._owner);
          }
        }
      },
      mountComponentIntoNode: function(rootID, container, shouldReuseMarkup) {
        var transaction = ReactUpdates.ReactReconcileTransaction.getPooled();
        transaction.perform(this._mountComponentIntoNode, this, rootID, container, transaction, shouldReuseMarkup);
        ReactUpdates.ReactReconcileTransaction.release(transaction);
      },
      _mountComponentIntoNode: function(rootID, container, transaction, shouldReuseMarkup) {
        var markup = this.mountComponent(rootID, transaction, 0);
        mountImageIntoNode(markup, container, shouldReuseMarkup);
      },
      isOwnedBy: function(owner) {
        return this._owner === owner;
      },
      getSiblingByRef: function(ref) {
        var owner = this._owner;
        if (!owner || !owner.refs) {
          return null;
        }
        return owner.refs[ref];
      }
    }
  };
  module.exports = ReactComponent;
})(require("process"));
