/* */ 
var Syntax = require("esprima-fb").Syntax;
var utils = require("../src/utils");
var restFunction = '(function(source, exclusion) {' + 'var rest = {};' + 'var hasOwn = Object.prototype.hasOwnProperty;' + 'if (source == null) {' + 'throw new TypeError();' + '}' + 'for (var key in source) {' + 'if (hasOwn.call(source, key) && !hasOwn.call(exclusion, key)) {' + 'rest[key] = source[key];' + '}' + '}' + 'return rest;' + '})';
function getPropertyNames(properties) {
  var names = [];
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    if (property.type === Syntax.SpreadProperty) {
      continue;
    }
    if (property.type === Syntax.Identifier) {
      names.push(property.name);
    } else {
      names.push(property.key.name);
    }
  }
  return names;
}
function getRestFunctionCall(source, exclusion) {
  return restFunction + '(' + source + ',' + exclusion + ')';
}
function getSimpleShallowCopy(accessorExpression) {
  return getRestFunctionCall(accessorExpression, '{}');
}
function renderRestExpression(accessorExpression, excludedProperties) {
  var excludedNames = getPropertyNames(excludedProperties);
  if (!excludedNames.length) {
    return getSimpleShallowCopy(accessorExpression);
  }
  return getRestFunctionCall(accessorExpression, '{' + excludedNames.join(':1,') + ':1}');
}
exports.renderRestExpression = renderRestExpression;
