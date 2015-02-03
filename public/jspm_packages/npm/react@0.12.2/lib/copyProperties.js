/* */ 
(function(process) {
  function copyProperties(obj, a, b, c, d, e, f) {
    obj = obj || {};
    if ("production" !== process.env.NODE_ENV) {
      if (f) {
        throw new Error('Too many arguments passed to copyProperties');
      }
    }
    var args = [a, b, c, d, e];
    var ii = 0,
        v;
    while (args[ii]) {
      v = args[ii++];
      for (var k in v) {
        obj[k] = v[k];
      }
      if (v.hasOwnProperty && v.hasOwnProperty('toString') && (typeof v.toString != 'undefined') && (obj.toString !== v.toString)) {
        obj.toString = v.toString;
      }
    }
    return obj;
  }
  module.exports = copyProperties;
  console.warn('react/lib/copyProperties has been deprecated and will be removed in the ' + 'next version of React. All uses can be replaced with ' + 'Object.assign(obj, a, b, ...) or _.extend(obj, a, b, ...).');
})(require("process"));
