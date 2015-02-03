/* */ 
"use strict";
var assign = require("./Object.assign");
var merge = function(one, two) {
  return assign({}, one, two);
};
module.exports = merge;
console.warn('react/lib/merge has been deprecated and will be removed in the ' + 'next version of React. All uses can be replaced with ' + 'Object.assign({}, a, b) or _.extend({}, a, b).');
