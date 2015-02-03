/* */ 
(function(process) {
  "use strict";
  var assign = require("./Object.assign");
  var invariant = require("./invariant");
  var genericComponentClass = null;
  var tagToComponentClass = {};
  var ReactNativeComponentInjection = {
    injectGenericComponentClass: function(componentClass) {
      genericComponentClass = componentClass;
    },
    injectComponentClasses: function(componentClasses) {
      assign(tagToComponentClass, componentClasses);
    }
  };
  function createInstanceForTag(tag, props, parentType) {
    var componentClass = tagToComponentClass[tag];
    if (componentClass == null) {
      ("production" !== process.env.NODE_ENV ? invariant(genericComponentClass, 'There is no registered component for the tag %s', tag) : invariant(genericComponentClass));
      return new genericComponentClass(tag, props);
    }
    if (parentType === tag) {
      ("production" !== process.env.NODE_ENV ? invariant(genericComponentClass, 'There is no registered component for the tag %s', tag) : invariant(genericComponentClass));
      return new genericComponentClass(tag, props);
    }
    return new componentClass.type(props);
  }
  var ReactNativeComponent = {
    createInstanceForTag: createInstanceForTag,
    injection: ReactNativeComponentInjection
  };
  module.exports = ReactNativeComponent;
})(require("process"));
