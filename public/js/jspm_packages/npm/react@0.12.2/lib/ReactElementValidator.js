/* */ 
(function(process) {
  "use strict";
  var ReactElement = require("./ReactElement");
  var ReactPropTypeLocations = require("./ReactPropTypeLocations");
  var ReactCurrentOwner = require("./ReactCurrentOwner");
  var monitorCodeUse = require("./monitorCodeUse");
  var warning = require("./warning");
  var ownerHasKeyUseWarning = {
    'react_key_warning': {},
    'react_numeric_key_warning': {}
  };
  var ownerHasMonitoredObjectMap = {};
  var loggedTypeFailures = {};
  var NUMERIC_PROPERTY_REGEX = /^\d+$/;
  function getCurrentOwnerDisplayName() {
    var current = ReactCurrentOwner.current;
    return current && current.constructor.displayName || undefined;
  }
  function validateExplicitKey(component, parentType) {
    if (component._store.validated || component.key != null) {
      return ;
    }
    component._store.validated = true;
    warnAndMonitorForKeyUse('react_key_warning', 'Each child in an array should have a unique "key" prop.', component, parentType);
  }
  function validatePropertyKey(name, component, parentType) {
    if (!NUMERIC_PROPERTY_REGEX.test(name)) {
      return ;
    }
    warnAndMonitorForKeyUse('react_numeric_key_warning', 'Child objects should have non-numeric keys so ordering is preserved.', component, parentType);
  }
  function warnAndMonitorForKeyUse(warningID, message, component, parentType) {
    var ownerName = getCurrentOwnerDisplayName();
    var parentName = parentType.displayName;
    var useName = ownerName || parentName;
    var memoizer = ownerHasKeyUseWarning[warningID];
    if (memoizer.hasOwnProperty(useName)) {
      return ;
    }
    memoizer[useName] = true;
    message += ownerName ? (" Check the render method of " + ownerName + ".") : (" Check the renderComponent call using <" + parentName + ">.");
    var childOwnerName = null;
    if (component._owner && component._owner !== ReactCurrentOwner.current) {
      childOwnerName = component._owner.constructor.displayName;
      message += (" It was passed a child from " + childOwnerName + ".");
    }
    message += ' See http://fb.me/react-warning-keys for more information.';
    monitorCodeUse(warningID, {
      component: useName,
      componentOwner: childOwnerName
    });
    console.warn(message);
  }
  function monitorUseOfObjectMap() {
    var currentName = getCurrentOwnerDisplayName() || '';
    if (ownerHasMonitoredObjectMap.hasOwnProperty(currentName)) {
      return ;
    }
    ownerHasMonitoredObjectMap[currentName] = true;
    monitorCodeUse('react_object_map_children');
  }
  function validateChildKeys(component, parentType) {
    if (Array.isArray(component)) {
      for (var i = 0; i < component.length; i++) {
        var child = component[i];
        if (ReactElement.isValidElement(child)) {
          validateExplicitKey(child, parentType);
        }
      }
    } else if (ReactElement.isValidElement(component)) {
      component._store.validated = true;
    } else if (component && typeof component === 'object') {
      monitorUseOfObjectMap();
      for (var name in component) {
        validatePropertyKey(name, component[name], parentType);
      }
    }
  }
  function checkPropTypes(componentName, propTypes, props, location) {
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error;
        try {
          error = propTypes[propName](props, propName, componentName, location);
        } catch (ex) {
          error = ex;
        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          loggedTypeFailures[error.message] = true;
          monitorCodeUse('react_failed_descriptor_type_check', {message: error.message});
        }
      }
    }
  }
  var ReactElementValidator = {
    createElement: function(type, props, children) {
      ("production" !== process.env.NODE_ENV ? warning(type != null, 'React.createElement: type should not be null or undefined. It should ' + 'be a string (for DOM elements) or a ReactClass (for composite ' + 'components).') : null);
      var element = ReactElement.createElement.apply(this, arguments);
      if (element == null) {
        return element;
      }
      for (var i = 2; i < arguments.length; i++) {
        validateChildKeys(arguments[i], type);
      }
      if (type) {
        var name = type.displayName;
        if (type.propTypes) {
          checkPropTypes(name, type.propTypes, element.props, ReactPropTypeLocations.prop);
        }
        if (type.contextTypes) {
          checkPropTypes(name, type.contextTypes, element._context, ReactPropTypeLocations.context);
        }
      }
      return element;
    },
    createFactory: function(type) {
      var validatedFactory = ReactElementValidator.createElement.bind(null, type);
      validatedFactory.type = type;
      return validatedFactory;
    }
  };
  module.exports = ReactElementValidator;
})(require("process"));
