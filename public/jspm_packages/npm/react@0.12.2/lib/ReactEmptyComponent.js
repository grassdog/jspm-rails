/* */ 
(function(process) {
  "use strict";
  var ReactElement = require("./ReactElement");
  var invariant = require("./invariant");
  var component;
  var nullComponentIdsRegistry = {};
  var ReactEmptyComponentInjection = {injectEmptyComponent: function(emptyComponent) {
      component = ReactElement.createFactory(emptyComponent);
    }};
  function getEmptyComponent() {
    ("production" !== process.env.NODE_ENV ? invariant(component, 'Trying to return null from a render, but no null placeholder component ' + 'was injected.') : invariant(component));
    return component();
  }
  function registerNullComponentID(id) {
    nullComponentIdsRegistry[id] = true;
  }
  function deregisterNullComponentID(id) {
    delete nullComponentIdsRegistry[id];
  }
  function isNullComponentID(id) {
    return nullComponentIdsRegistry[id];
  }
  var ReactEmptyComponent = {
    deregisterNullComponentID: deregisterNullComponentID,
    getEmptyComponent: getEmptyComponent,
    injection: ReactEmptyComponentInjection,
    isNullComponentID: isNullComponentID,
    registerNullComponentID: registerNullComponentID
  };
  module.exports = ReactEmptyComponent;
})(require("process"));
