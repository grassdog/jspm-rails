/* */ 
(function(process) {
  'use strict';
  var monitorCodeUse = require("./monitorCodeUse");
  function shouldUpdateReactComponent(prevElement, nextElement) {
    if (prevElement != null && nextElement != null) {
      var prevType = typeof prevElement;
      var nextType = typeof nextElement;
      if (prevType === 'string' || prevType === 'number') {
        return (nextType === 'string' || nextType === 'number');
      } else {
        if (nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key) {
          var ownersMatch = prevElement._owner === nextElement._owner;
          var prevName = null;
          var nextName = null;
          var nextDisplayName = null;
          if ("production" !== process.env.NODE_ENV) {
            if (!ownersMatch) {
              if (prevElement._owner != null && prevElement._owner.getPublicInstance() != null && prevElement._owner.getPublicInstance().constructor != null) {
                prevName = prevElement._owner.getPublicInstance().constructor.displayName;
              }
              if (nextElement._owner != null && nextElement._owner.getPublicInstance() != null && nextElement._owner.getPublicInstance().constructor != null) {
                nextName = nextElement._owner.getPublicInstance().constructor.displayName;
              }
              if (nextElement.type != null && nextElement.type.displayName != null) {
                nextDisplayName = nextElement.type.displayName;
              }
              monitorCodeUse('react_should_update_owner_is_useful', {
                key: prevElement.key,
                prevOwner: prevName,
                nextOwner: nextName,
                nextDisplayName: nextDisplayName
              });
            }
          }
          return ownersMatch;
        }
      }
    }
    return false;
  }
  module.exports = shouldUpdateReactComponent;
})(require("process"));
