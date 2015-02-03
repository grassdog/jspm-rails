/* */ 
(function(process) {
  "use strict";
  var ReactCurrentOwner = require("./ReactCurrentOwner");
  var invariant = require("./invariant");
  var monitorCodeUse = require("./monitorCodeUse");
  var warning = require("./warning");
  var legacyFactoryLogs = {};
  function warnForLegacyFactoryCall() {
    if (!ReactLegacyElementFactory._isLegacyCallWarningEnabled) {
      return ;
    }
    var owner = ReactCurrentOwner.current;
    var name = owner && owner.constructor ? owner.constructor.displayName : '';
    if (!name) {
      name = 'Something';
    }
    if (legacyFactoryLogs.hasOwnProperty(name)) {
      return ;
    }
    legacyFactoryLogs[name] = true;
    ("production" !== process.env.NODE_ENV ? warning(false, name + ' is calling a React component directly. ' + 'Use a factory or JSX instead. See: http://fb.me/react-legacyfactory') : null);
    monitorCodeUse('react_legacy_factory_call', {
      version: 3,
      name: name
    });
  }
  function warnForPlainFunctionType(type) {
    var isReactClass = type.prototype && typeof type.prototype.mountComponent === 'function' && typeof type.prototype.receiveComponent === 'function';
    if (isReactClass) {
      ("production" !== process.env.NODE_ENV ? warning(false, 'Did not expect to get a React class here. Use `Component` instead ' + 'of `Component.type` or `this.constructor`.') : null);
    } else {
      if (!type._reactWarnedForThisType) {
        try {
          type._reactWarnedForThisType = true;
        } catch (x) {}
        monitorCodeUse('react_non_component_in_jsx', {
          version: 3,
          name: type.name
        });
      }
      ("production" !== process.env.NODE_ENV ? warning(false, 'This JSX uses a plain function. Only React components are ' + 'valid in React\'s JSX transform.') : null);
    }
  }
  function warnForNonLegacyFactory(type) {
    ("production" !== process.env.NODE_ENV ? warning(false, 'Do not pass React.DOM.' + type.type + ' to JSX or createFactory. ' + 'Use the string "' + type.type + '" instead.') : null);
  }
  function proxyStaticMethods(target, source) {
    if (typeof source !== 'function') {
      return ;
    }
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        var value = source[key];
        if (typeof value === 'function') {
          var bound = value.bind(source);
          for (var k in value) {
            if (value.hasOwnProperty(k)) {
              bound[k] = value[k];
            }
          }
          target[key] = bound;
        } else {
          target[key] = value;
        }
      }
    }
  }
  var LEGACY_MARKER = {};
  var NON_LEGACY_MARKER = {};
  var ReactLegacyElementFactory = {};
  ReactLegacyElementFactory.wrapCreateFactory = function(createFactory) {
    var legacyCreateFactory = function(type) {
      if (typeof type !== 'function') {
        return createFactory(type);
      }
      if (type.isReactNonLegacyFactory) {
        if ("production" !== process.env.NODE_ENV) {
          warnForNonLegacyFactory(type);
        }
        return createFactory(type.type);
      }
      if (type.isReactLegacyFactory) {
        return createFactory(type.type);
      }
      if ("production" !== process.env.NODE_ENV) {
        warnForPlainFunctionType(type);
      }
      return type;
    };
    return legacyCreateFactory;
  };
  ReactLegacyElementFactory.wrapCreateElement = function(createElement) {
    var legacyCreateElement = function(type, props, children) {
      if (typeof type !== 'function') {
        return createElement.apply(this, arguments);
      }
      var args;
      if (type.isReactNonLegacyFactory) {
        if ("production" !== process.env.NODE_ENV) {
          warnForNonLegacyFactory(type);
        }
        args = Array.prototype.slice.call(arguments, 0);
        args[0] = type.type;
        return createElement.apply(this, args);
      }
      if (type.isReactLegacyFactory) {
        if (type._isMockFunction) {
          type.type._mockedReactClassConstructor = type;
        }
        args = Array.prototype.slice.call(arguments, 0);
        args[0] = type.type;
        return createElement.apply(this, args);
      }
      if ("production" !== process.env.NODE_ENV) {
        warnForPlainFunctionType(type);
      }
      return type.apply(null, Array.prototype.slice.call(arguments, 1));
    };
    return legacyCreateElement;
  };
  ReactLegacyElementFactory.wrapFactory = function(factory) {
    ("production" !== process.env.NODE_ENV ? invariant(typeof factory === 'function', 'This is suppose to accept a element factory') : invariant(typeof factory === 'function'));
    var legacyElementFactory = function(config, children) {
      if ("production" !== process.env.NODE_ENV) {
        warnForLegacyFactoryCall();
      }
      return factory.apply(this, arguments);
    };
    proxyStaticMethods(legacyElementFactory, factory.type);
    legacyElementFactory.isReactLegacyFactory = LEGACY_MARKER;
    legacyElementFactory.type = factory.type;
    return legacyElementFactory;
  };
  ReactLegacyElementFactory.markNonLegacyFactory = function(factory) {
    factory.isReactNonLegacyFactory = NON_LEGACY_MARKER;
    return factory;
  };
  ReactLegacyElementFactory.isValidFactory = function(factory) {
    return typeof factory === 'function' && factory.isReactLegacyFactory === LEGACY_MARKER;
  };
  ReactLegacyElementFactory.isValidClass = function(factory) {
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(false, 'isValidClass is deprecated and will be removed in a future release. ' + 'Use a more specific validator instead.') : null);
    }
    return ReactLegacyElementFactory.isValidFactory(factory);
  };
  ReactLegacyElementFactory._isLegacyCallWarningEnabled = true;
  module.exports = ReactLegacyElementFactory;
})(require("process"));
