/* */ 
(function(process) {
  "use strict";
  var ReactContext = require("./ReactContext");
  var ReactCurrentOwner = require("./ReactCurrentOwner");
  var warning = require("./warning");
  var RESERVED_PROPS = {
    key: true,
    ref: true
  };
  function defineWarningProperty(object, key) {
    Object.defineProperty(object, key, {
      configurable: false,
      enumerable: true,
      get: function() {
        if (!this._store) {
          return null;
        }
        return this._store[key];
      },
      set: function(value) {
        ("production" !== process.env.NODE_ENV ? warning(false, 'Don\'t set the ' + key + ' property of the component. ' + 'Mutate the existing props object instead.') : null);
        this._store[key] = value;
      }
    });
  }
  var useMutationMembrane = false;
  function defineMutationMembrane(prototype) {
    try {
      var pseudoFrozenProperties = {props: true};
      for (var key in pseudoFrozenProperties) {
        defineWarningProperty(prototype, key);
      }
      useMutationMembrane = true;
    } catch (x) {}
  }
  var ReactElement = function(type, key, ref, owner, context, props) {
    this.type = type;
    this.key = key;
    this.ref = ref;
    this._owner = owner;
    this._context = context;
    if ("production" !== process.env.NODE_ENV) {
      this._store = {
        validated: false,
        props: props
      };
      if (useMutationMembrane) {
        Object.freeze(this);
        return ;
      }
    }
    this.props = props;
  };
  ReactElement.prototype = {_isReactElement: true};
  if ("production" !== process.env.NODE_ENV) {
    defineMutationMembrane(ReactElement.prototype);
  }
  ReactElement.createElement = function(type, config, children) {
    var propName;
    var props = {};
    var key = null;
    var ref = null;
    if (config != null) {
      ref = config.ref === undefined ? null : config.ref;
      if ("production" !== process.env.NODE_ENV) {
        ("production" !== process.env.NODE_ENV ? warning(config.key !== null, 'createElement(...): Encountered component with a `key` of null. In ' + 'a future version, this will be treated as equivalent to the string ' + '\'null\'; instead, provide an explicit key or use undefined.') : null);
      }
      key = config.key == null ? null : '' + config.key;
      for (propName in config) {
        if (config.hasOwnProperty(propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
          props[propName] = config[propName];
        }
      }
    }
    var childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      var childArray = Array(childrenLength);
      for (var i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
      }
      props.children = childArray;
    }
    if (type && type.defaultProps) {
      var defaultProps = type.defaultProps;
      for (propName in defaultProps) {
        if (typeof props[propName] === 'undefined') {
          props[propName] = defaultProps[propName];
        }
      }
    }
    return new ReactElement(type, key, ref, ReactCurrentOwner.current, ReactContext.current, props);
  };
  ReactElement.createFactory = function(type) {
    var factory = ReactElement.createElement.bind(null, type);
    factory.type = type;
    return factory;
  };
  ReactElement.cloneAndReplaceProps = function(oldElement, newProps) {
    var newElement = new ReactElement(oldElement.type, oldElement.key, oldElement.ref, oldElement._owner, oldElement._context, newProps);
    if ("production" !== process.env.NODE_ENV) {
      newElement._store.validated = oldElement._store.validated;
    }
    return newElement;
  };
  ReactElement.isValidElement = function(object) {
    var isElement = !!(object && object._isReactElement);
    return isElement;
  };
  module.exports = ReactElement;
})(require("process"));
