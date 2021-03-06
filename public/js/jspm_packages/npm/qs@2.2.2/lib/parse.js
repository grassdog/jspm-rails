/* */ 
var Utils = require("./utils");
var internals = {
  delimiter: '&',
  depth: 5,
  arrayLimit: 20,
  parameterLimit: 1000
};
internals.parseValues = function(str, options) {
  var obj = {};
  var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);
  for (var i = 0,
      il = parts.length; i < il; ++i) {
    var part = parts[i];
    var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;
    if (pos === -1) {
      obj[Utils.decode(part)] = '';
    } else {
      var key = Utils.decode(part.slice(0, pos));
      var val = Utils.decode(part.slice(pos + 1));
      if (!obj[key]) {
        obj[key] = val;
      } else {
        obj[key] = [].concat(obj[key]).concat(val);
      }
    }
  }
  return obj;
};
internals.parseObject = function(chain, val, options) {
  if (!chain.length) {
    return val;
  }
  var root = chain.shift();
  var obj = {};
  if (root === '[]') {
    obj = [];
    obj = obj.concat(internals.parseObject(chain, val, options));
  } else {
    var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
    var index = parseInt(cleanRoot, 10);
    if (!isNaN(index) && root !== cleanRoot && index <= options.arrayLimit) {
      obj = [];
      obj[index] = internals.parseObject(chain, val, options);
    } else {
      obj[cleanRoot] = internals.parseObject(chain, val, options);
    }
  }
  return obj;
};
internals.parseKeys = function(key, val, options) {
  if (!key) {
    return ;
  }
  var parent = /^([^\[\]]*)/;
  var child = /(\[[^\[\]]*\])/g;
  var segment = parent.exec(key);
  if (Object.prototype.hasOwnProperty(segment[1])) {
    return ;
  }
  var keys = [];
  if (segment[1]) {
    keys.push(segment[1]);
  }
  var i = 0;
  while ((segment = child.exec(key)) !== null && i < options.depth) {
    ++i;
    if (!Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
      keys.push(segment[1]);
    }
  }
  if (segment) {
    keys.push('[' + key.slice(segment.index) + ']');
  }
  return internals.parseObject(keys, val, options);
};
module.exports = function(str, options) {
  if (str === '' || str === null || typeof str === 'undefined') {
    return {};
  }
  options = options || {};
  options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
  options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
  options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
  options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
  var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
  var obj = {};
  var keys = Object.keys(tempObj);
  for (var i = 0,
      il = keys.length; i < il; ++i) {
    var key = keys[i];
    var newObj = internals.parseKeys(key, tempObj[key], options);
    obj = Utils.merge(obj, newObj);
  }
  return Utils.compact(obj);
};
