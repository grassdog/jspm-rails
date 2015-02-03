/* */ 
"use strict";
var assign = require("./Object.assign");
var ReactContext = {
  current: {},
  withContext: function(newContext, scopedCallback) {
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
