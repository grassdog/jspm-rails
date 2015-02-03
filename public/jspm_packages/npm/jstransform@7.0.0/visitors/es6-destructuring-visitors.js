/* */ 
var Syntax = require("esprima-fb").Syntax;
var utils = require("../src/utils");
var reservedWordsHelper = require("./reserved-words-helper");
var restParamVisitors = require("./es6-rest-param-visitors");
var restPropertyHelpers = require("./es7-rest-property-helpers");
function visitStructuredVariable(traverse, node, path, state) {
  utils.append(getTmpVar(state.localScope.tempVarIndex) + '=', state);
  utils.catchupWhiteSpace(node.init.range[0], state);
  traverse(node.init, path, state);
  utils.catchup(node.init.range[1], state);
  utils.append(',' + getDestructuredComponents(node.id, state), state);
  state.localScope.tempVarIndex++;
  return false;
}
visitStructuredVariable.test = function(node, path, state) {
  return node.type === Syntax.VariableDeclarator && isStructuredPattern(node.id);
};
function isStructuredPattern(node) {
  return node.type === Syntax.ObjectPattern || node.type === Syntax.ArrayPattern;
}
function getDestructuredComponents(node, state) {
  var tmpIndex = state.localScope.tempVarIndex;
  var components = [];
  var patternItems = getPatternItems(node);
  for (var idx = 0; idx < patternItems.length; idx++) {
    var item = patternItems[idx];
    if (!item) {
      continue;
    }
    if (item.type === Syntax.SpreadElement) {
      components.push(item.argument.name + '=Array.prototype.slice.call(' + getTmpVar(tmpIndex) + ',' + idx + ')');
      continue;
    }
    if (item.type === Syntax.SpreadProperty) {
      var restExpression = restPropertyHelpers.renderRestExpression(getTmpVar(tmpIndex), patternItems);
      components.push(item.argument.name + '=' + restExpression);
      continue;
    }
    var accessor = getPatternItemAccessor(node, item, tmpIndex, idx);
    var value = getPatternItemValue(node, item);
    if (value.type === Syntax.Identifier) {
      components.push(value.name + '=' + accessor);
    } else {
      components.push(getInitialValue(++state.localScope.tempVarIndex, accessor) + ',' + getDestructuredComponents(value, state));
    }
  }
  return components.join(',');
}
function getPatternItems(node) {
  return node.properties || node.elements;
}
function getPatternItemAccessor(node, patternItem, tmpIndex, idx) {
  var tmpName = getTmpVar(tmpIndex);
  if (node.type === Syntax.ObjectPattern) {
    if (reservedWordsHelper.isReservedWord(patternItem.key.name)) {
      return tmpName + '["' + patternItem.key.name + '"]';
    } else {
      return tmpName + '.' + patternItem.key.name;
    }
  } else {
    return tmpName + '[' + idx + ']';
  }
}
function getPatternItemValue(node, patternItem) {
  return node.type === Syntax.ObjectPattern ? patternItem.value : patternItem;
}
function getInitialValue(index, value) {
  return getTmpVar(index) + '=' + value;
}
function getTmpVar(index) {
  return '$__' + index;
}
function visitStructuredAssignment(traverse, node, path, state) {
  var exprNode = node.expression;
  utils.append('var ' + getTmpVar(state.localScope.tempVarIndex) + '=', state);
  utils.catchupWhiteSpace(exprNode.right.range[0], state);
  traverse(exprNode.right, path, state);
  utils.catchup(exprNode.right.range[1], state);
  utils.append(',' + getDestructuredComponents(exprNode.left, state) + ';', state);
  utils.catchupWhiteSpace(node.range[1], state);
  state.localScope.tempVarIndex++;
  return false;
}
visitStructuredAssignment.test = function(node, path, state) {
  return node.type === Syntax.ExpressionStatement && node.expression.type === Syntax.AssignmentExpression && isStructuredPattern(node.expression.left);
};
function visitStructuredParameter(traverse, node, path, state) {
  utils.append(getTmpVar(getParamIndex(node, path)), state);
  utils.catchupWhiteSpace(node.range[1], state);
  return true;
}
function getParamIndex(paramNode, path) {
  var funcNode = path[0];
  var tmpIndex = 0;
  for (var k = 0; k < funcNode.params.length; k++) {
    var param = funcNode.params[k];
    if (param === paramNode) {
      break;
    }
    if (isStructuredPattern(param)) {
      tmpIndex++;
    }
  }
  return tmpIndex;
}
visitStructuredParameter.test = function(node, path, state) {
  return isStructuredPattern(node) && isFunctionNode(path[0]);
};
function isFunctionNode(node) {
  return (node.type == Syntax.FunctionDeclaration || node.type == Syntax.FunctionExpression || node.type == Syntax.MethodDefinition || node.type == Syntax.ArrowFunctionExpression);
}
function visitFunctionBodyForStructuredParameter(traverse, node, path, state) {
  var funcNode = path[0];
  utils.catchup(funcNode.body.range[0] + 1, state);
  renderDestructuredComponents(funcNode, state);
  if (funcNode.rest) {
    utils.append(restParamVisitors.renderRestParamSetup(funcNode), state);
  }
  return true;
}
function renderDestructuredComponents(funcNode, state) {
  var destructuredComponents = [];
  for (var k = 0; k < funcNode.params.length; k++) {
    var param = funcNode.params[k];
    if (isStructuredPattern(param)) {
      destructuredComponents.push(getDestructuredComponents(param, state));
      state.localScope.tempVarIndex++;
    }
  }
  if (destructuredComponents.length) {
    utils.append('var ' + destructuredComponents.join(',') + ';', state);
  }
}
visitFunctionBodyForStructuredParameter.test = function(node, path, state) {
  return node.type === Syntax.BlockStatement && isFunctionNode(path[0]);
};
exports.visitorList = [visitStructuredVariable, visitStructuredAssignment, visitStructuredParameter, visitFunctionBodyForStructuredParameter];
exports.renderDestructuredComponents = renderDestructuredComponents;
