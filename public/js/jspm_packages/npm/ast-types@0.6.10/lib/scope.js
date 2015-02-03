/* */ 
var assert = require("assert");
var types = require("./types");
var Type = types.Type;
var namedTypes = types.namedTypes;
var Node = namedTypes.Node;
var Expression = namedTypes.Expression;
var isArray = types.builtInTypes.array;
var hasOwn = Object.prototype.hasOwnProperty;
var b = types.builders;
function Scope(path, parentScope) {
  assert.ok(this instanceof Scope);
  assert.ok(path instanceof require("./node-path"));
  ScopeType.assert(path.value);
  var depth;
  if (parentScope) {
    assert.ok(parentScope instanceof Scope);
    depth = parentScope.depth + 1;
  } else {
    parentScope = null;
    depth = 0;
  }
  Object.defineProperties(this, {
    path: {value: path},
    node: {value: path.value},
    isGlobal: {
      value: !parentScope,
      enumerable: true
    },
    depth: {value: depth},
    parent: {value: parentScope},
    bindings: {value: {}}
  });
}
var scopeTypes = [namedTypes.Program, namedTypes.Function, namedTypes.CatchClause];
var ScopeType = Type.or.apply(Type, scopeTypes);
Scope.isEstablishedBy = function(node) {
  return ScopeType.check(node);
};
var Sp = Scope.prototype;
Sp.didScan = false;
Sp.declares = function(name) {
  this.scan();
  return hasOwn.call(this.bindings, name);
};
Sp.declareTemporary = function(prefix) {
  if (prefix) {
    assert.ok(/^[a-z$_]/i.test(prefix), prefix);
  } else {
    prefix = "t$";
  }
  prefix += this.depth.toString(36) + "$";
  this.scan();
  var index = 0;
  while (this.declares(prefix + index)) {
    ++index;
  }
  var name = prefix + index;
  return this.bindings[name] = types.builders.identifier(name);
};
Sp.injectTemporary = function(identifier, init) {
  identifier || (identifier = this.declareTemporary());
  var bodyPath = this.path.get("body");
  if (namedTypes.BlockStatement.check(bodyPath.value)) {
    bodyPath = bodyPath.get("body");
  }
  bodyPath.unshift(b.variableDeclaration("var", [b.variableDeclarator(identifier, init || null)]));
  return identifier;
};
Sp.scan = function(force) {
  if (force || !this.didScan) {
    for (var name in this.bindings) {
      delete this.bindings[name];
    }
    scanScope(this.path, this.bindings);
    this.didScan = true;
  }
};
Sp.getBindings = function() {
  this.scan();
  return this.bindings;
};
function scanScope(path, bindings) {
  var node = path.value;
  ScopeType.assert(node);
  if (namedTypes.CatchClause.check(node)) {
    addPattern(path.get("param"), bindings);
  } else {
    recursiveScanScope(path, bindings);
  }
}
function recursiveScanScope(path, bindings) {
  var node = path.value;
  if (path.parent && namedTypes.FunctionExpression.check(path.parent.node) && path.parent.node.id) {
    addPattern(path.parent.get("id"), bindings);
  }
  if (!node) {} else if (isArray.check(node)) {
    path.each(function(childPath) {
      recursiveScanChild(childPath, bindings);
    });
  } else if (namedTypes.Function.check(node)) {
    path.get("params").each(function(paramPath) {
      addPattern(paramPath, bindings);
    });
    recursiveScanChild(path.get("body"), bindings);
  } else if (namedTypes.VariableDeclarator.check(node)) {
    addPattern(path.get("id"), bindings);
    recursiveScanChild(path.get("init"), bindings);
  } else if (node.type === "ImportSpecifier" || node.type === "ImportNamespaceSpecifier" || node.type === "ImportDefaultSpecifier") {
    addPattern(node.name ? path.get("name") : path.get("id"), bindings);
  } else if (Node.check(node) && !Expression.check(node)) {
    types.eachField(node, function(name, child) {
      var childPath = path.get(name);
      assert.strictEqual(childPath.value, child);
      recursiveScanChild(childPath, bindings);
    });
  }
}
function recursiveScanChild(path, bindings) {
  var node = path.value;
  if (!node || Expression.check(node)) {} else if (namedTypes.FunctionDeclaration.check(node)) {
    addPattern(path.get("id"), bindings);
  } else if (namedTypes.ClassDeclaration && namedTypes.ClassDeclaration.check(node)) {
    addPattern(path.get("id"), bindings);
  } else if (ScopeType.check(node)) {
    if (namedTypes.CatchClause.check(node)) {
      var catchParamName = node.param.name;
      var hadBinding = hasOwn.call(bindings, catchParamName);
      recursiveScanScope(path.get("body"), bindings);
      if (!hadBinding) {
        delete bindings[catchParamName];
      }
    }
  } else {
    recursiveScanScope(path, bindings);
  }
}
function addPattern(patternPath, bindings) {
  var pattern = patternPath.value;
  namedTypes.Pattern.assert(pattern);
  if (namedTypes.Identifier.check(pattern)) {
    if (hasOwn.call(bindings, pattern.name)) {
      bindings[pattern.name].push(patternPath);
    } else {
      bindings[pattern.name] = [patternPath];
    }
  } else if (namedTypes.SpreadElement && namedTypes.SpreadElement.check(pattern)) {
    addPattern(patternPath.get("argument"), bindings);
  }
}
Sp.lookup = function(name) {
  for (var scope = this; scope; scope = scope.parent)
    if (scope.declares(name))
      break;
  return scope;
};
Sp.getGlobalScope = function() {
  var scope = this;
  while (!scope.isGlobal)
    scope = scope.parent;
  return scope;
};
module.exports = Scope;
