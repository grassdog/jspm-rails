/* */ 
'use strict';
var assign = require("./Object.assign");
var emptyObject = require("./emptyObject");
var monitorCodeUse = require("./monitorCodeUse");
var ReactContext = {
  current: emptyObject,
  withContext: function(newContext, scopedCallback) {
    monitorCodeUse('react_with_context', {newContext: newContext});
    var result;
    var previousContext = ReactContext.current;
    ReactContext.current = assign({}, previousContext, newContext);
    try {
      result = scopedCallback();
    } finally {
      ReactContext.current = previousContext;
    }
    return result;
  }
};
module.exports = ReactContext;
