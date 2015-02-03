/* */ 
(function(process) {
  "use strict";
  var ReactEmptyComponent = require("./ReactEmptyComponent");
  var ReactMount = require("./ReactMount");
  var invariant = require("./invariant");
  var ReactBrowserComponentMixin = {getDOMNode: function() {
      ("production" !== process.env.NODE_ENV ? invariant(this.isMounted(), 'getDOMNode(): A component must be mounted to have a DOM node.') : invariant(this.isMounted()));
      if (ReactEmptyComponent.isNullComponentID(this._rootNodeID)) {
        return null;
      }
      return ReactMount.getNode(this._rootNodeID);
    }};
  module.exports = ReactBrowserComponentMixin;
})(require("process"));
