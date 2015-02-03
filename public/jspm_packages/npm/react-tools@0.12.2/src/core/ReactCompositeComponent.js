/* */ 
(function(process) {
  "use strict";
  var ReactComponent = require("ReactComponent");
  var ReactContext = require("ReactContext");
  var ReactCurrentOwner = require("ReactCurrentOwner");
  var ReactElement = require("ReactElement");
  var ReactElementValidator = require("ReactElementValidator");
  var ReactEmptyComponent = require("ReactEmptyComponent");
  var ReactErrorUtils = require("ReactErrorUtils");
  var ReactLegacyElement = require("ReactLegacyElement");
  var ReactOwner = require("ReactOwner");
  var ReactPerf = require("ReactPerf");
  var ReactPropTransferer = require("ReactPropTransferer");
  var ReactPropTypeLocations = require("ReactPropTypeLocations");
  var ReactPropTypeLocationNames = require("ReactPropTypeLocationNames");
  var ReactUpdates = require("ReactUpdates");
  var assign = require("Object.assign");
  var instantiateReactComponent = require("instantiateReactComponent");
  var invariant = require("invariant");
  var keyMirror = require("keyMirror");
  var keyOf = require("keyOf");
  var monitorCodeUse = require("monitorCodeUse");
  var mapObject = require("mapObject");
  var shouldUpdateReactComponent = require("shouldUpdateReactComponent");
  var warning = require("warning");
  var MIXINS_KEY = keyOf({mixins: null});
  var SpecPolicy = keyMirror({
    DEFINE_ONCE: null,
    DEFINE_MANY: null,
    OVERRIDE_BASE: null,
    DEFINE_MANY_MERGED: null
  });
  var injectedMixins = [];
  var ReactCompositeComponentInterface = {
    mixins: SpecPolicy.DEFINE_MANY,
    statics: SpecPolicy.DEFINE_MANY,
    propTypes: SpecPolicy.DEFINE_MANY,
    contextTypes: SpecPolicy.DEFINE_MANY,
    childContextTypes: SpecPolicy.DEFINE_MANY,
    getDefaultProps: SpecPolicy.DEFINE_MANY_MERGED,
    getInitialState: SpecPolicy.DEFINE_MANY_MERGED,
    getChildContext: SpecPolicy.DEFINE_MANY_MERGED,
    render: SpecPolicy.DEFINE_ONCE,
    componentWillMount: SpecPolicy.DEFINE_MANY,
    componentDidMount: SpecPolicy.DEFINE_MANY,
    componentWillReceiveProps: SpecPolicy.DEFINE_MANY,
    shouldComponentUpdate: SpecPolicy.DEFINE_ONCE,
    componentWillUpdate: SpecPolicy.DEFINE_MANY,
    componentDidUpdate: SpecPolicy.DEFINE_MANY,
    componentWillUnmount: SpecPolicy.DEFINE_MANY,
    updateComponent: SpecPolicy.OVERRIDE_BASE
  };
  var RESERVED_SPEC_KEYS = {
    displayName: function(Constructor, displayName) {
      Constructor.displayName = displayName;
    },
    mixins: function(Constructor, mixins) {
      if (mixins) {
        for (var i = 0; i < mixins.length; i++) {
          mixSpecIntoComponent(Constructor, mixins[i]);
        }
      }
    },
    childContextTypes: function(Constructor, childContextTypes) {
      validateTypeDef(Constructor, childContextTypes, ReactPropTypeLocations.childContext);
      Constructor.childContextTypes = assign({}, Constructor.childContextTypes, childContextTypes);
    },
    contextTypes: function(Constructor, contextTypes) {
      validateTypeDef(Constructor, contextTypes, ReactPropTypeLocations.context);
      Constructor.contextTypes = assign({}, Constructor.contextTypes, contextTypes);
    },
    getDefaultProps: function(Constructor, getDefaultProps) {
      if (Constructor.getDefaultProps) {
        Constructor.getDefaultProps = createMergedResultFunction(Constructor.getDefaultProps, getDefaultProps);
      } else {
        Constructor.getDefaultProps = getDefaultProps;
      }
    },
    propTypes: function(Constructor, propTypes) {
      validateTypeDef(Constructor, propTypes, ReactPropTypeLocations.prop);
      Constructor.propTypes = assign({}, Constructor.propTypes, propTypes);
    },
    statics: function(Constructor, statics) {
      mixStaticSpecIntoComponent(Constructor, statics);
    }
  };
  function getDeclarationErrorAddendum(component) {
    var owner = component._owner || null;
    if (owner && owner.constructor && owner.constructor.displayName) {
      return ' Check the render method of `' + owner.constructor.displayName + '`.';
    }
    return '';
  }
  function validateTypeDef(Constructor, typeDef, location) {
    for (var propName in typeDef) {
      if (typeDef.hasOwnProperty(propName)) {
        invariant(typeof typeDef[propName] == 'function', '%s: %s type `%s` is invalid; it must be a function, usually from ' + 'React.PropTypes.', Constructor.displayName || 'ReactCompositeComponent', ReactPropTypeLocationNames[location], propName);
      }
    }
  }
  function validateMethodOverride(proto, name) {
    var specPolicy = ReactCompositeComponentInterface.hasOwnProperty(name) ? ReactCompositeComponentInterface[name] : null;
    if (ReactCompositeComponentMixin.hasOwnProperty(name)) {
      invariant(specPolicy === SpecPolicy.OVERRIDE_BASE, 'ReactCompositeComponentInterface: You are attempting to override ' + '`%s` from your class specification. Ensure that your method names ' + 'do not overlap with React methods.', name);
    }
    if (proto.hasOwnProperty(name)) {
      invariant(specPolicy === SpecPolicy.DEFINE_MANY || specPolicy === SpecPolicy.DEFINE_MANY_MERGED, 'ReactCompositeComponentInterface: You are attempting to define ' + '`%s` on your component more than once. This conflict may be due ' + 'to a mixin.', name);
    }
  }
  function validateLifeCycleOnReplaceState(instance) {
    var compositeLifeCycleState = instance._compositeLifeCycleState;
    invariant(instance.isMounted() || compositeLifeCycleState === CompositeLifeCycle.MOUNTING, 'replaceState(...): Can only update a mounted or mounting component.');
    invariant(ReactCurrentOwner.current == null, 'replaceState(...): Cannot update during an existing state transition ' + '(such as within `render`). Render methods should be a pure function ' + 'of props and state.');
    invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING, 'replaceState(...): Cannot update while unmounting component. This ' + 'usually means you called setState() on an unmounted component.');
  }
  function mixSpecIntoComponent(Constructor, spec) {
    if (!spec) {
      return ;
    }
    invariant(!ReactLegacyElement.isValidFactory(spec), 'ReactCompositeComponent: You\'re attempting to ' + 'use a component class as a mixin. Instead, just use a regular object.');
    invariant(!ReactElement.isValidElement(spec), 'ReactCompositeComponent: You\'re attempting to ' + 'use a component as a mixin. Instead, just use a regular object.');
    var proto = Constructor.prototype;
    if (spec.hasOwnProperty(MIXINS_KEY)) {
      RESERVED_SPEC_KEYS.mixins(Constructor, spec.mixins);
    }
    for (var name in spec) {
      if (!spec.hasOwnProperty(name)) {
        continue;
      }
      if (name === MIXINS_KEY) {
        continue;
      }
      var property = spec[name];
      validateMethodOverride(proto, name);
      if (RESERVED_SPEC_KEYS.hasOwnProperty(name)) {
        RESERVED_SPEC_KEYS[name](Constructor, property);
      } else {
        var isCompositeComponentMethod = ReactCompositeComponentInterface.hasOwnProperty(name);
        var isAlreadyDefined = proto.hasOwnProperty(name);
        var markedDontBind = property && property.__reactDontBind;
        var isFunction = typeof property === 'function';
        var shouldAutoBind = isFunction && !isCompositeComponentMethod && !isAlreadyDefined && !markedDontBind;
        if (shouldAutoBind) {
          if (!proto.__reactAutoBindMap) {
            proto.__reactAutoBindMap = {};
          }
          proto.__reactAutoBindMap[name] = property;
          proto[name] = property;
        } else {
          if (isAlreadyDefined) {
            var specPolicy = ReactCompositeComponentInterface[name];
            invariant(isCompositeComponentMethod && (specPolicy === SpecPolicy.DEFINE_MANY_MERGED || specPolicy === SpecPolicy.DEFINE_MANY), 'ReactCompositeComponent: Unexpected spec policy %s for key %s ' + 'when mixing in component specs.', specPolicy, name);
            if (specPolicy === SpecPolicy.DEFINE_MANY_MERGED) {
              proto[name] = createMergedResultFunction(proto[name], property);
            } else if (specPolicy === SpecPolicy.DEFINE_MANY) {
              proto[name] = createChainedFunction(proto[name], property);
            }
          } else {
            proto[name] = property;
            if (__DEV__) {
              if (typeof property === 'function' && spec.displayName) {
                proto[name].displayName = spec.displayName + '_' + name;
              }
            }
          }
        }
      }
    }
  }
  function mixStaticSpecIntoComponent(Constructor, statics) {
    if (!statics) {
      return ;
    }
    for (var name in statics) {
      var property = statics[name];
      if (!statics.hasOwnProperty(name)) {
        continue;
      }
      var isReserved = name in RESERVED_SPEC_KEYS;
      invariant(!isReserved, 'ReactCompositeComponent: You are attempting to define a reserved ' + 'property, `%s`, that shouldn\'t be on the "statics" key. Define it ' + 'as an instance property instead; it will still be accessible on the ' + 'constructor.', name);
      var isInherited = name in Constructor;
      invariant(!isInherited, 'ReactCompositeComponent: You are attempting to define ' + '`%s` on your component more than once. This conflict may be ' + 'due to a mixin.', name);
      Constructor[name] = property;
    }
  }
  function mergeObjectsWithNoDuplicateKeys(one, two) {
    invariant(one && two && typeof one === 'object' && typeof two === 'object', 'mergeObjectsWithNoDuplicateKeys(): Cannot merge non-objects');
    mapObject(two, function(value, key) {
      invariant(one[key] === undefined, 'mergeObjectsWithNoDuplicateKeys(): ' + 'Tried to merge two objects with the same key: `%s`. This conflict ' + 'may be due to a mixin; in particular, this may be caused by two ' + 'getInitialState() or getDefaultProps() methods returning objects ' + 'with clashing keys.', key);
      one[key] = value;
    });
    return one;
  }
  function createMergedResultFunction(one, two) {
    return function mergedResult() {
      var a = one.apply(this, arguments);
      var b = two.apply(this, arguments);
      if (a == null) {
        return b;
      } else if (b == null) {
        return a;
      }
      return mergeObjectsWithNoDuplicateKeys(a, b);
    };
  }
  function createChainedFunction(one, two) {
    return function chainedFunction() {
      one.apply(this, arguments);
      two.apply(this, arguments);
    };
  }
  var CompositeLifeCycle = keyMirror({
    MOUNTING: null,
    UNMOUNTING: null,
    RECEIVING_PROPS: null
  });
  var ReactCompositeComponentMixin = {
    construct: function(element) {
      ReactComponent.Mixin.construct.apply(this, arguments);
      ReactOwner.Mixin.construct.apply(this, arguments);
      this.state = null;
      this._pendingState = null;
      this.context = null;
      this._compositeLifeCycleState = null;
    },
    isMounted: function() {
      return ReactComponent.Mixin.isMounted.call(this) && this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING;
    },
    mountComponent: ReactPerf.measure('ReactCompositeComponent', 'mountComponent', function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(this, rootID, transaction, mountDepth);
      this._compositeLifeCycleState = CompositeLifeCycle.MOUNTING;
      if (this.__reactAutoBindMap) {
        this._bindAutoBindMethods();
      }
      this.context = this._processContext(this._currentElement._context);
      this.props = this._processProps(this.props);
      this.state = this.getInitialState ? this.getInitialState() : null;
      invariant(typeof this.state === 'object' && !Array.isArray(this.state), '%s.getInitialState(): must return an object or null', this.constructor.displayName || 'ReactCompositeComponent');
      this._pendingState = null;
      this._pendingForceUpdate = false;
      if (this.componentWillMount) {
        this.componentWillMount();
        if (this._pendingState) {
          this.state = this._pendingState;
          this._pendingState = null;
        }
      }
      this._renderedComponent = instantiateReactComponent(this._renderValidatedComponent(), this._currentElement.type);
      this._compositeLifeCycleState = null;
      var markup = this._renderedComponent.mountComponent(rootID, transaction, mountDepth + 1);
      if (this.componentDidMount) {
        transaction.getReactMountReady().enqueue(this.componentDidMount, this);
      }
      return markup;
    }),
    unmountComponent: function() {
      this._compositeLifeCycleState = CompositeLifeCycle.UNMOUNTING;
      if (this.componentWillUnmount) {
        this.componentWillUnmount();
      }
      this._compositeLifeCycleState = null;
      this._renderedComponent.unmountComponent();
      this._renderedComponent = null;
      ReactComponent.Mixin.unmountComponent.call(this);
    },
    setState: function(partialState, callback) {
      invariant(typeof partialState === 'object' || partialState == null, 'setState(...): takes an object of state variables to update.');
      if (__DEV__) {
        warning(partialState != null, 'setState(...): You passed an undefined or null state object; ' + 'instead, use forceUpdate().');
      }
      this.replaceState(assign({}, this._pendingState || this.state, partialState), callback);
    },
    replaceState: function(completeState, callback) {
      validateLifeCycleOnReplaceState(this);
      this._pendingState = completeState;
      if (this._compositeLifeCycleState !== CompositeLifeCycle.MOUNTING) {
        ReactUpdates.enqueueUpdate(this, callback);
      }
    },
    _processContext: function(context) {
      var maskedContext = null;
      var contextTypes = this.constructor.contextTypes;
      if (contextTypes) {
        maskedContext = {};
        for (var contextName in contextTypes) {
          maskedContext[contextName] = context[contextName];
        }
        if (__DEV__) {
          this._checkPropTypes(contextTypes, maskedContext, ReactPropTypeLocations.context);
        }
      }
      return maskedContext;
    },
    _processChildContext: function(currentContext) {
      var childContext = this.getChildContext && this.getChildContext();
      var displayName = this.constructor.displayName || 'ReactCompositeComponent';
      if (childContext) {
        invariant(typeof this.constructor.childContextTypes === 'object', '%s.getChildContext(): childContextTypes must be defined in order to ' + 'use getChildContext().', displayName);
        if (__DEV__) {
          this._checkPropTypes(this.constructor.childContextTypes, childContext, ReactPropTypeLocations.childContext);
        }
        for (var name in childContext) {
          invariant(name in this.constructor.childContextTypes, '%s.getChildContext(): key "%s" is not defined in childContextTypes.', displayName, name);
        }
        return assign({}, currentContext, childContext);
      }
      return currentContext;
    },
    _processProps: function(newProps) {
      if (__DEV__) {
        var propTypes = this.constructor.propTypes;
        if (propTypes) {
          this._checkPropTypes(propTypes, newProps, ReactPropTypeLocations.prop);
        }
      }
      return newProps;
    },
    _checkPropTypes: function(propTypes, props, location) {
      var componentName = this.constructor.displayName;
      for (var propName in propTypes) {
        if (propTypes.hasOwnProperty(propName)) {
          var error = propTypes[propName](props, propName, componentName, location);
          if (error instanceof Error) {
            var addendum = getDeclarationErrorAddendum(this);
            warning(false, error.message + addendum);
          }
        }
      }
    },
    performUpdateIfNecessary: function(transaction) {
      var compositeLifeCycleState = this._compositeLifeCycleState;
      if (compositeLifeCycleState === CompositeLifeCycle.MOUNTING || compositeLifeCycleState === CompositeLifeCycle.RECEIVING_PROPS) {
        return ;
      }
      if (this._pendingElement == null && this._pendingState == null && !this._pendingForceUpdate) {
        return ;
      }
      var nextContext = this.context;
      var nextProps = this.props;
      var nextElement = this._currentElement;
      if (this._pendingElement != null) {
        nextElement = this._pendingElement;
        nextContext = this._processContext(nextElement._context);
        nextProps = this._processProps(nextElement.props);
        this._pendingElement = null;
        this._compositeLifeCycleState = CompositeLifeCycle.RECEIVING_PROPS;
        if (this.componentWillReceiveProps) {
          this.componentWillReceiveProps(nextProps, nextContext);
        }
      }
      this._compositeLifeCycleState = null;
      var nextState = this._pendingState || this.state;
      this._pendingState = null;
      var shouldUpdate = this._pendingForceUpdate || !this.shouldComponentUpdate || this.shouldComponentUpdate(nextProps, nextState, nextContext);
      if (__DEV__) {
        if (typeof shouldUpdate === "undefined") {
          console.warn((this.constructor.displayName || 'ReactCompositeComponent') + '.shouldComponentUpdate(): Returned undefined instead of a ' + 'boolean value. Make sure to return true or false.');
        }
      }
      if (shouldUpdate) {
        this._pendingForceUpdate = false;
        this._performComponentUpdate(nextElement, nextProps, nextState, nextContext, transaction);
      } else {
        this._currentElement = nextElement;
        this.props = nextProps;
        this.state = nextState;
        this.context = nextContext;
        this._owner = nextElement._owner;
      }
    },
    _performComponentUpdate: function(nextElement, nextProps, nextState, nextContext, transaction) {
      var prevElement = this._currentElement;
      var prevProps = this.props;
      var prevState = this.state;
      var prevContext = this.context;
      if (this.componentWillUpdate) {
        this.componentWillUpdate(nextProps, nextState, nextContext);
      }
      this._currentElement = nextElement;
      this.props = nextProps;
      this.state = nextState;
      this.context = nextContext;
      this._owner = nextElement._owner;
      this.updateComponent(transaction, prevElement);
      if (this.componentDidUpdate) {
        transaction.getReactMountReady().enqueue(this.componentDidUpdate.bind(this, prevProps, prevState, prevContext), this);
      }
    },
    receiveComponent: function(nextElement, transaction) {
      if (nextElement === this._currentElement && nextElement._owner != null) {
        return ;
      }
      ReactComponent.Mixin.receiveComponent.call(this, nextElement, transaction);
    },
    updateComponent: ReactPerf.measure('ReactCompositeComponent', 'updateComponent', function(transaction, prevParentElement) {
      ReactComponent.Mixin.updateComponent.call(this, transaction, prevParentElement);
      var prevComponentInstance = this._renderedComponent;
      var prevElement = prevComponentInstance._currentElement;
      var nextElement = this._renderValidatedComponent();
      if (shouldUpdateReactComponent(prevElement, nextElement)) {
        prevComponentInstance.receiveComponent(nextElement, transaction);
      } else {
        var thisID = this._rootNodeID;
        var prevComponentID = prevComponentInstance._rootNodeID;
        prevComponentInstance.unmountComponent();
        this._renderedComponent = instantiateReactComponent(nextElement, this._currentElement.type);
        var nextMarkup = this._renderedComponent.mountComponent(thisID, transaction, this._mountDepth + 1);
        ReactComponent.BackendIDOperations.dangerouslyReplaceNodeWithMarkupByID(prevComponentID, nextMarkup);
      }
    }),
    forceUpdate: function(callback) {
      var compositeLifeCycleState = this._compositeLifeCycleState;
      invariant(this.isMounted() || compositeLifeCycleState === CompositeLifeCycle.MOUNTING, 'forceUpdate(...): Can only force an update on mounted or mounting ' + 'components.');
      invariant(compositeLifeCycleState !== CompositeLifeCycle.UNMOUNTING && ReactCurrentOwner.current == null, 'forceUpdate(...): Cannot force an update while unmounting component ' + 'or within a `render` function.');
      this._pendingForceUpdate = true;
      ReactUpdates.enqueueUpdate(this, callback);
    },
    _renderValidatedComponent: ReactPerf.measure('ReactCompositeComponent', '_renderValidatedComponent', function() {
      var renderedComponent;
      var previousContext = ReactContext.current;
      ReactContext.current = this._processChildContext(this._currentElement._context);
      ReactCurrentOwner.current = this;
      try {
        renderedComponent = this.render();
        if (renderedComponent === null || renderedComponent === false) {
          renderedComponent = ReactEmptyComponent.getEmptyComponent();
          ReactEmptyComponent.registerNullComponentID(this._rootNodeID);
        } else {
          ReactEmptyComponent.deregisterNullComponentID(this._rootNodeID);
        }
      } finally {
        ReactContext.current = previousContext;
        ReactCurrentOwner.current = null;
      }
      invariant(ReactElement.isValidElement(renderedComponent), '%s.render(): A valid ReactComponent must be returned. You may have ' + 'returned undefined, an array or some other invalid object.', this.constructor.displayName || 'ReactCompositeComponent');
      return renderedComponent;
    }),
    _bindAutoBindMethods: function() {
      for (var autoBindKey in this.__reactAutoBindMap) {
        if (!this.__reactAutoBindMap.hasOwnProperty(autoBindKey)) {
          continue;
        }
        var method = this.__reactAutoBindMap[autoBindKey];
        this[autoBindKey] = this._bindAutoBindMethod(ReactErrorUtils.guard(method, this.constructor.displayName + '.' + autoBindKey));
      }
    },
    _bindAutoBindMethod: function(method) {
      var component = this;
      var boundMethod = method.bind(component);
      if (__DEV__) {
        boundMethod.__reactBoundContext = component;
        boundMethod.__reactBoundMethod = method;
        boundMethod.__reactBoundArguments = null;
        var componentName = component.constructor.displayName;
        var _bind = boundMethod.bind;
        boundMethod.bind = function(newThis, ...args) {
          if (newThis !== component && newThis !== null) {
            monitorCodeUse('react_bind_warning', {component: componentName});
            console.warn('bind(): React component methods may only be bound to the ' + 'component instance. See ' + componentName);
          } else if (!args.length) {
            monitorCodeUse('react_bind_warning', {component: componentName});
            console.warn('bind(): You are binding a component method to the component. ' + 'React does this for you automatically in a high-performance ' + 'way, so you can safely remove this call. See ' + componentName);
            return boundMethod;
          }
          var reboundMethod = _bind.apply(boundMethod, arguments);
          reboundMethod.__reactBoundContext = component;
          reboundMethod.__reactBoundMethod = method;
          reboundMethod.__reactBoundArguments = args;
          return reboundMethod;
        };
      }
      return boundMethod;
    }
  };
  var ReactCompositeComponentBase = function() {};
  assign(ReactCompositeComponentBase.prototype, ReactComponent.Mixin, ReactOwner.Mixin, ReactPropTransferer.Mixin, ReactCompositeComponentMixin);
  var ReactCompositeComponent = {
    LifeCycle: CompositeLifeCycle,
    Base: ReactCompositeComponentBase,
    createClass: function(spec) {
      var Constructor = function(props) {};
      Constructor.prototype = new ReactCompositeComponentBase();
      Constructor.prototype.constructor = Constructor;
      injectedMixins.forEach(mixSpecIntoComponent.bind(null, Constructor));
      mixSpecIntoComponent(Constructor, spec);
      if (Constructor.getDefaultProps) {
        Constructor.defaultProps = Constructor.getDefaultProps();
      }
      invariant(Constructor.prototype.render, 'createClass(...): Class specification must implement a `render` method.');
      if (__DEV__) {
        if (Constructor.prototype.componentShouldUpdate) {
          monitorCodeUse('react_component_should_update_warning', {component: spec.displayName});
          console.warn((spec.displayName || 'A component') + ' has a method called ' + 'componentShouldUpdate(). Did you mean shouldComponentUpdate()? ' + 'The name is phrased as a question because the function is ' + 'expected to return a value.');
        }
      }
      for (var methodName in ReactCompositeComponentInterface) {
        if (!Constructor.prototype[methodName]) {
          Constructor.prototype[methodName] = null;
        }
      }
      if (__DEV__) {
        return ReactLegacyElement.wrapFactory(ReactElementValidator.createFactory(Constructor));
      }
      return ReactLegacyElement.wrapFactory(ReactElement.createFactory(Constructor));
    },
    injection: {injectMixin: function(mixin) {
        injectedMixins.push(mixin);
      }}
  };
  module.exports = ReactCompositeComponent;
})(require("process"));
