/* */ 
(function(process) {
  "use strict";
  var warning = require("./warning");
  var ReactElement = require("./ReactElement");
  var ReactLegacyElement = require("./ReactLegacyElement");
  var ReactNativeComponent = require("./ReactNativeComponent");
  var ReactEmptyComponent = require("./ReactEmptyComponent");
  function instantiateReactComponent(element, parentCompositeType) {
    var instance;
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(element && (typeof element.type === 'function' || typeof element.type === 'string'), 'Only functions or strings can be mounted as React components.') : null);
      if (element.type._mockedReactClassConstructor) {
        ReactLegacyElement._isLegacyCallWarningEnabled = false;
        try {
          instance = new element.type._mockedReactClassConstructor(element.props);
        } finally {
          ReactLegacyElement._isLegacyCallWarningEnabled = true;
        }
        if (ReactElement.isValidElement(instance)) {
          instance = new instance.type(instance.props);
        }
        var render = instance.render;
        if (!render) {
          element = ReactEmptyComponent.getEmptyComponent();
        } else {
          if (render._isMockFunction && !render._getMockImplementation()) {
            render.mockImplementation(ReactEmptyComponent.getEmptyComponent);
          }
          instance.construct(element);
          return instance;
        }
      }
    }
    if (typeof element.type === 'string') {
      instance = ReactNativeComponent.createInstanceForTag(element.type, element.props, parentCompositeType);
    } else {
      instance = new element.type(element.props);
    }
    if ("production" !== process.env.NODE_ENV) {
      ("production" !== process.env.NODE_ENV ? warning(typeof instance.construct === 'function' && typeof instance.mountComponent === 'function' && typeof instance.receiveComponent === 'function', 'Only React Components can be mounted.') : null);
    }
    instance.construct(element);
    return instance;
  }
  module.exports = instantiateReactComponent;
})(require("process"));
