/* */ 
(function(process) {
  "use strict";
  var invariant = require("./invariant");
  function monitorCodeUse(eventName, data) {
    ("production" !== process.env.NODE_ENV ? invariant(eventName && !/[^a-z0-9_]/.test(eventName), 'You must provide an eventName using only the characters [a-z0-9_]') : invariant(eventName && !/[^a-z0-9_]/.test(eventName)));
  }
  module.exports = monitorCodeUse;
})(require("process"));
