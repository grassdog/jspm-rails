/* */ 
var assert = require("assert");
var sourceMap = require("source-map");
var printComments = require("./comments").printComments;
var linesModule = require("./lines");
var fromString = linesModule.fromString;
var concat = linesModule.concat;
var normalizeOptions = require("./options").normalize;
var getReprinter = require("./patcher").getReprinter;
var types = require("./types");
var namedTypes = types.namedTypes;
var isString = types.builtInTypes.string;
var isObject = types.builtInTypes.object;
var FastPath = require("./fast-path");
var util = require("./util");
function PrintResult(code, sourceMap) {
  assert.ok(this instanceof PrintResult);
  isString.assert(code);
  this.code = code;
  if (sourceMap) {
    isObject.assert(sourceMap);
    this.map = sourceMap;
  }
}
var PRp = PrintResult.prototype;
var warnedAboutToString = false;
PRp.toString = function() {
  if (!warnedAboutToString) {
    console.warn("Deprecation warning: recast.print now returns an object with " + "a .code property. You appear to be treating the object as a " + "string, which might still work but is strongly discouraged.");
    warnedAboutToString = true;
  }
  return this.code;
};
var emptyPrintResult = new PrintResult("");
function Printer(originalOptions) {
  assert.ok(this instanceof Printer);
  var explicitTabWidth = originalOptions && originalOptions.tabWidth;
  var options = normalizeOptions(originalOptions);
  assert.notStrictEqual(options, originalOptions);
  options.sourceFileName = null;
  function printWithComments(path) {
    assert.ok(path instanceof FastPath);
    return printComments(path.getNode().comments, print(path), options);
  }
  function print(path, includeComments) {
    if (includeComments)
      return printWithComments(path);
    assert.ok(path instanceof FastPath);
    if (!explicitTabWidth) {
      var oldTabWidth = options.tabWidth;
      var loc = path.getNode().loc;
      if (loc && loc.lines && loc.lines.guessTabWidth) {
        options.tabWidth = loc.lines.guessTabWidth();
        var lines = maybeReprint(path);
        options.tabWidth = oldTabWidth;
        return lines;
      }
    }
    return maybeReprint(path);
  }
  function maybeReprint(path) {
    var reprinter = getReprinter(path);
    if (reprinter)
      return maybeAddParens(path, reprinter(maybeReprint));
    return printRootGenerically(path);
  }
  function printRootGenerically(path) {
    return genericPrint(path, options, printWithComments);
  }
  function printGenerically(path) {
    return genericPrint(path, options, printGenerically);
  }
  this.print = function(ast) {
    if (!ast) {
      return emptyPrintResult;
    }
    var lines = print(FastPath.from(ast), true);
    return new PrintResult(lines.toString(options), util.composeSourceMaps(options.inputSourceMap, lines.getSourceMap(options.sourceMapName, options.sourceRoot)));
  };
  this.printGenerically = function(ast) {
    if (!ast) {
      return emptyPrintResult;
    }
    var path = FastPath.from(ast);
    var oldReuseWhitespace = options.reuseWhitespace;
    options.reuseWhitespace = false;
    var pr = new PrintResult(printGenerically(path).toString(options));
    options.reuseWhitespace = oldReuseWhitespace;
    return pr;
  };
}
exports.Printer = Printer;
function maybeAddParens(path, lines) {
  return path.needsParens() ? concat(["(", lines, ")"]) : lines;
}
function genericPrint(path, options, printPath) {
  assert.ok(path instanceof FastPath);
  return maybeAddParens(path, genericPrintNoParens(path, options, printPath));
}
function genericPrintNoParens(path, options, print) {
  var n = path.getValue();
  if (!n) {
    return fromString("");
  }
  if (typeof n === "string") {
    return fromString(n, options);
  }
  namedTypes.Node.assert(n);
  switch (n.type) {
    case "File":
      return path.call(print, "program");
    case "Program":
      return maybeAddSemicolon(path.call(function(bodyPath) {
        return printStatementSequence(bodyPath, options, print);
      }, "body"));
    case "EmptyStatement":
      return fromString("");
    case "ExpressionStatement":
      return concat([path.call(print, "expression"), ";"]);
    case "BinaryExpression":
    case "LogicalExpression":
    case "AssignmentExpression":
      return fromString(" ").join([path.call(print, "left"), n.operator, path.call(print, "right")]);
    case "MemberExpression":
      var parts = [path.call(print, "object")];
      if (n.computed)
        parts.push("[", path.call(print, "property"), "]");
      else
        parts.push(".", path.call(print, "property"));
      return concat(parts);
    case "Path":
      return fromString(".").join(n.body);
    case "Identifier":
      return fromString(n.name, options);
    case "SpreadElement":
    case "SpreadElementPattern":
    case "SpreadProperty":
    case "SpreadPropertyPattern":
      return concat(["...", path.call(print, "argument")]);
    case "FunctionDeclaration":
    case "FunctionExpression":
      var parts = [];
      if (n.async)
        parts.push("async ");
      parts.push("function");
      if (n.generator)
        parts.push("*");
      if (n.id)
        parts.push(" ", path.call(print, "id"));
      parts.push("(", printFunctionParams(path, options, print), ") ", path.call(print, "body"));
      return concat(parts);
    case "ArrowFunctionExpression":
      var parts = [];
      if (n.async)
        parts.push("async ");
      if (n.params.length === 1) {
        parts.push(path.call(print, "params", 0));
      } else {
        parts.push("(", printFunctionParams(path, options, print), ")");
      }
      parts.push(" => ", path.call(print, "body"));
      return concat(parts);
    case "MethodDefinition":
      var parts = [];
      if (n.static) {
        parts.push("static ");
      }
      parts.push(printMethod(path, options, print));
      return concat(parts);
    case "YieldExpression":
      var parts = ["yield"];
      if (n.delegate)
        parts.push("*");
      if (n.argument)
        parts.push(" ", path.call(print, "argument"));
      return concat(parts);
    case "AwaitExpression":
      var parts = ["await"];
      if (n.all)
        parts.push("*");
      if (n.argument)
        parts.push(" ", path.call(print, "argument"));
      return concat(parts);
    case "ModuleDeclaration":
      var parts = ["module", path.call(print, "id")];
      if (n.source) {
        assert.ok(!n.body);
        parts.push("from", path.call(print, "source"));
      } else {
        parts.push(path.call(print, "body"));
      }
      return fromString(" ").join(parts);
    case "ImportSpecifier":
    case "ExportSpecifier":
      var parts = [path.call(print, "id")];
      if (n.name)
        parts.push(" as ", path.call(print, "name"));
      return concat(parts);
    case "ExportBatchSpecifier":
      return fromString("*");
    case "ImportNamespaceSpecifier":
      return concat(["* as ", path.call(print, "id")]);
    case "ImportDefaultSpecifier":
      return path.call(print, "id");
    case "ExportDeclaration":
      var parts = ["export"];
      if (n["default"]) {
        parts.push(" default");
      } else if (n.specifiers && n.specifiers.length > 0) {
        if (n.specifiers.length === 1 && n.specifiers[0].type === "ExportBatchSpecifier") {
          parts.push(" *");
        } else {
          parts.push(" { ", fromString(", ").join(path.map(print, "specifiers")), " }");
        }
        if (n.source)
          parts.push(" from ", path.call(print, "source"));
        parts.push(";");
        return concat(parts);
      }
      if (n.declaration) {
        if (!namedTypes.Node.check(n.declaration)) {
          console.log(JSON.stringify(n, null, 2));
        }
        var decLines = path.call(print, "declaration");
        parts.push(" ", decLines);
        if (lastNonSpaceCharacter(decLines) !== ";") {
          parts.push(";");
        }
      }
      return concat(parts);
    case "ImportDeclaration":
      var parts = ["import "];
      if (n.specifiers && n.specifiers.length > 0) {
        var foundImportSpecifier = false;
        path.each(function(specifierPath) {
          var i = specifierPath.getName();
          if (i > 0) {
            parts.push(", ");
          }
          var value = specifierPath.getValue();
          if (namedTypes.ImportDefaultSpecifier.check(value) || namedTypes.ImportNamespaceSpecifier.check(value)) {
            assert.strictEqual(foundImportSpecifier, false);
          } else {
            namedTypes.ImportSpecifier.assert(value);
            if (!foundImportSpecifier) {
              foundImportSpecifier = true;
              parts.push("{");
            }
          }
          parts.push(print(specifierPath));
        }, "specifiers");
        if (foundImportSpecifier) {
          parts.push("}");
        }
        parts.push(" from ");
      }
      parts.push(path.call(print, "source"), ";");
      return concat(parts);
    case "BlockStatement":
      var naked = path.call(function(bodyPath) {
        return printStatementSequence(bodyPath, options, print);
      }, "body");
      if (naked.isEmpty()) {
        return fromString("{}");
      }
      return concat(["{\n", naked.indent(options.tabWidth), "\n}"]);
    case "ReturnStatement":
      var parts = ["return"];
      if (n.argument) {
        var argLines = path.call(print, "argument");
        if (argLines.length > 1 && namedTypes.XJSElement && namedTypes.XJSElement.check(n.argument)) {
          parts.push(" (\n", argLines.indent(options.tabWidth), "\n)");
        } else {
          parts.push(" ", argLines);
        }
      }
      parts.push(";");
      return concat(parts);
    case "CallExpression":
      return concat([path.call(print, "callee"), printArgumentsList(path, options, print)]);
    case "ObjectExpression":
    case "ObjectPattern":
      var allowBreak = false,
          len = n.properties.length,
          parts = [len > 0 ? "{\n" : "{"];
      path.map(function(childPath) {
        var i = childPath.getName();
        var prop = childPath.getValue();
        var lines = print(childPath).indent(options.tabWidth);
        var multiLine = lines.length > 1;
        if (multiLine && allowBreak) {
          parts.push("\n");
        }
        parts.push(lines);
        if (i < len - 1) {
          parts.push(multiLine ? ",\n\n" : ",\n");
          allowBreak = !multiLine;
        }
      }, "properties");
      parts.push(len > 0 ? "\n}" : "}");
      return concat(parts);
    case "PropertyPattern":
      return concat([path.call(print, "key"), ": ", path.call(print, "pattern")]);
    case "Property":
      if (n.method || n.kind === "get" || n.kind === "set") {
        return printMethod(path, options, print);
      }
      if (n.shorthand) {
        return path.call(print, "key");
      }
      return concat([path.call(print, "key"), ": ", path.call(print, "value")]);
    case "ArrayExpression":
    case "ArrayPattern":
      var elems = n.elements,
          len = elems.length,
          parts = ["["];
      path.each(function(elemPath) {
        var i = elemPath.getName();
        var elem = elemPath.getValue();
        if (!elem) {
          parts.push(",");
        } else {
          if (i > 0)
            parts.push(" ");
          parts.push(print(elemPath));
          if (i < len - 1)
            parts.push(",");
        }
      }, "elements");
      parts.push("]");
      return concat(parts);
    case "SequenceExpression":
      return fromString(", ").join(path.map(print, "expressions"));
    case "ThisExpression":
      return fromString("this");
    case "Literal":
      if (typeof n.value !== "string")
        return fromString(n.value, options);
    case "ModuleSpecifier":
      return fromString(nodeStr(n), options);
    case "UnaryExpression":
      var parts = [n.operator];
      if (/[a-z]$/.test(n.operator))
        parts.push(" ");
      parts.push(path.call(print, "argument"));
      return concat(parts);
    case "UpdateExpression":
      var parts = [path.call(print, "argument"), n.operator];
      if (n.prefix)
        parts.reverse();
      return concat(parts);
    case "ConditionalExpression":
      return concat(["(", path.call(print, "test"), " ? ", path.call(print, "consequent"), " : ", path.call(print, "alternate"), ")"]);
    case "NewExpression":
      var parts = ["new ", path.call(print, "callee")];
      var args = n.arguments;
      if (args) {
        parts.push(printArgumentsList(path, options, print));
      }
      return concat(parts);
    case "VariableDeclaration":
      var parts = [n.kind, " "];
      var maxLen = 0;
      var printed = path.map(function(childPath) {
        var lines = print(childPath);
        maxLen = Math.max(lines.length, maxLen);
        return lines;
      }, "declarations");
      if (maxLen === 1) {
        parts.push(fromString(", ").join(printed));
      } else if (printed.length > 1) {
        parts.push(fromString(",\n").join(printed).indentTail(n.kind.length + 1));
      } else {
        parts.push(printed[0]);
      }
      var parentNode = path.getParentNode();
      if (!namedTypes.ForStatement.check(parentNode) && !namedTypes.ForInStatement.check(parentNode) && !(namedTypes.ForOfStatement && namedTypes.ForOfStatement.check(parentNode))) {
        parts.push(";");
      }
      return concat(parts);
    case "VariableDeclarator":
      return n.init ? fromString(" = ").join([path.call(print, "id"), path.call(print, "init")]) : path.call(print, "id");
    case "WithStatement":
      return concat(["with (", path.call(print, "object"), ") ", path.call(print, "body")]);
    case "IfStatement":
      var con = adjustClause(path.call(print, "consequent"), options),
          parts = ["if (", path.call(print, "test"), ")", con];
      if (n.alternate)
        parts.push(endsWithBrace(con) ? " else" : "\nelse", adjustClause(path.call(print, "alternate"), options));
      return concat(parts);
    case "ForStatement":
      var init = path.call(print, "init"),
          sep = init.length > 1 ? ";\n" : "; ",
          forParen = "for (",
          indented = fromString(sep).join([init, path.call(print, "test"), path.call(print, "update")]).indentTail(forParen.length),
          head = concat([forParen, indented, ")"]),
          clause = adjustClause(path.call(print, "body"), options),
          parts = [head];
      if (head.length > 1) {
        parts.push("\n");
        clause = clause.trimLeft();
      }
      parts.push(clause);
      return concat(parts);
    case "WhileStatement":
      return concat(["while (", path.call(print, "test"), ")", adjustClause(path.call(print, "body"), options)]);
    case "ForInStatement":
      return concat([n.each ? "for each (" : "for (", path.call(print, "left"), " in ", path.call(print, "right"), ")", adjustClause(path.call(print, "body"), options)]);
    case "ForOfStatement":
      return concat(["for (", path.call(print, "left"), " of ", path.call(print, "right"), ")", adjustClause(path.call(print, "body"), options)]);
    case "DoWhileStatement":
      var doBody = concat(["do", adjustClause(path.call(print, "body"), options)]),
          parts = [doBody];
      if (endsWithBrace(doBody))
        parts.push(" while");
      else
        parts.push("\nwhile");
      parts.push(" (", path.call(print, "test"), ");");
      return concat(parts);
    case "BreakStatement":
      var parts = ["break"];
      if (n.label)
        parts.push(" ", path.call(print, "label"));
      parts.push(";");
      return concat(parts);
    case "ContinueStatement":
      var parts = ["continue"];
      if (n.label)
        parts.push(" ", path.call(print, "label"));
      parts.push(";");
      return concat(parts);
    case "LabeledStatement":
      return concat([path.call(print, "label"), ":\n", path.call(print, "body")]);
    case "TryStatement":
      var parts = ["try ", path.call(print, "block")];
      path.each(function(handlerPath) {
        parts.push(" ", print(handlerPath));
      }, "handlers");
      if (n.finalizer)
        parts.push(" finally ", path.call(print, "finalizer"));
      return concat(parts);
    case "CatchClause":
      var parts = ["catch (", path.call(print, "param")];
      if (n.guard)
        parts.push(" if ", path.call(print, "guard"));
      parts.push(") ", path.call(print, "body"));
      return concat(parts);
    case "ThrowStatement":
      return concat(["throw ", path.call(print, "argument"), ";"]);
    case "SwitchStatement":
      return concat(["switch (", path.call(print, "discriminant"), ") {\n", fromString("\n").join(path.map(print, "cases")), "\n}"]);
    case "SwitchCase":
      var parts = [];
      if (n.test)
        parts.push("case ", path.call(print, "test"), ":");
      else
        parts.push("default:");
      if (n.consequent.length > 0) {
        parts.push("\n", path.call(function(consequentPath) {
          return printStatementSequence(consequentPath, options, print);
        }, "consequent").indent(options.tabWidth));
      }
      return concat(parts);
    case "DebuggerStatement":
      return fromString("debugger;");
    case "XJSAttribute":
      var parts = [path.call(print, "name")];
      if (n.value)
        parts.push("=", path.call(print, "value"));
      return concat(parts);
    case "XJSIdentifier":
      return fromString(n.name, options);
    case "XJSNamespacedName":
      return fromString(":").join([path.call(print, "namespace"), path.call(print, "name")]);
    case "XJSMemberExpression":
      return fromString(".").join([path.call(print, "object"), path.call(print, "property")]);
    case "XJSSpreadAttribute":
      return concat(["{...", path.call(print, "argument"), "}"]);
    case "XJSExpressionContainer":
      return concat(["{", path.call(print, "expression"), "}"]);
    case "XJSElement":
      var openingLines = path.call(print, "openingElement");
      if (n.openingElement.selfClosing) {
        assert.ok(!n.closingElement);
        return openingLines;
      }
      var childLines = concat(path.map(function(childPath) {
        var child = childPath.getValue();
        if (namedTypes.Literal.check(child) && typeof child.value === "string") {
          if (/\S/.test(child.value)) {
            return child.value.replace(/^\s+|\s+$/g, "");
          } else if (/\n/.test(child.value)) {
            return "\n";
          }
        }
        return print(childPath);
      }, "children")).indentTail(options.tabWidth);
      var closingLines = path.call(print, "closingElement");
      return concat([openingLines, childLines, closingLines]);
    case "XJSOpeningElement":
      var parts = ["<", path.call(print, "name")];
      var attrParts = [];
      path.each(function(attrPath) {
        attrParts.push(" ", print(attrPath));
      }, "attributes");
      var attrLines = concat(attrParts);
      var needLineWrap = (attrLines.length > 1 || attrLines.getLineLength(1) > options.wrapColumn);
      if (needLineWrap) {
        attrParts.forEach(function(part, i) {
          if (part === " ") {
            assert.strictEqual(i % 2, 0);
            attrParts[i] = "\n";
          }
        });
        attrLines = concat(attrParts).indentTail(options.tabWidth);
      }
      parts.push(attrLines, n.selfClosing ? " />" : ">");
      return concat(parts);
    case "XJSClosingElement":
      return concat(["</", path.call(print, "name"), ">"]);
    case "XJSText":
      return fromString(n.value, options);
    case "XJSEmptyExpression":
      return fromString("");
    case "TypeAnnotatedIdentifier":
      return concat([path.call(print, "annotation"), " ", path.call(print, "identifier")]);
    case "ClassBody":
      if (n.body.length === 0) {
        return fromString("{}");
      }
      return concat(["{\n", path.call(function(bodyPath) {
        return printStatementSequence(bodyPath, options, print);
      }, "body").indent(options.tabWidth), "\n}"]);
    case "ClassPropertyDefinition":
      var parts = ["static ", path.call(print, "definition")];
      if (!namedTypes.MethodDefinition.check(n.definition))
        parts.push(";");
      return concat(parts);
    case "ClassProperty":
      return concat([path.call(print, "id"), ";"]);
    case "ClassDeclaration":
    case "ClassExpression":
      var parts = ["class"];
      if (n.id)
        parts.push(" ", path.call(print, "id"));
      if (n.superClass)
        parts.push(" extends ", path.call(print, "superClass"));
      parts.push(" ", path.call(print, "body"));
      return concat(parts);
    case "Node":
    case "Printable":
    case "SourceLocation":
    case "Position":
    case "Statement":
    case "Function":
    case "Pattern":
    case "Expression":
    case "Declaration":
    case "Specifier":
    case "NamedSpecifier":
    case "Block":
    case "Line":
      throw new Error("unprintable type: " + JSON.stringify(n.type));
    case "ClassHeritage":
    case "ComprehensionBlock":
    case "ComprehensionExpression":
    case "Glob":
    case "TaggedTemplateExpression":
    case "TemplateElement":
    case "TemplateLiteral":
    case "GeneratorExpression":
    case "LetStatement":
    case "LetExpression":
    case "GraphExpression":
    case "GraphIndexExpression":
    case "AnyTypeAnnotation":
    case "BooleanTypeAnnotation":
    case "ClassImplements":
    case "DeclareClass":
    case "DeclareFunction":
    case "DeclareModule":
    case "DeclareVariable":
    case "FunctionTypeAnnotation":
    case "FunctionTypeParam":
    case "GenericTypeAnnotation":
    case "InterfaceDeclaration":
    case "InterfaceExtends":
    case "IntersectionTypeAnnotation":
    case "MemberTypeAnnotation":
    case "NullableTypeAnnotation":
    case "NumberTypeAnnotation":
    case "ObjectTypeAnnotation":
    case "ObjectTypeCallProperty":
    case "ObjectTypeIndexer":
    case "ObjectTypeProperty":
    case "QualifiedTypeIdentifier":
    case "StringLiteralTypeAnnotation":
    case "StringTypeAnnotation":
    case "TupleTypeAnnotation":
    case "Type":
    case "TypeAlias":
    case "TypeAnnotation":
    case "TypeParameterDeclaration":
    case "TypeParameterInstantiation":
    case "TypeofTypeAnnotation":
    case "UnionTypeAnnotation":
    case "VoidTypeAnnotation":
    case "XMLDefaultDeclaration":
    case "XMLAnyName":
    case "XMLQualifiedIdentifier":
    case "XMLFunctionQualifiedIdentifier":
    case "XMLAttributeSelector":
    case "XMLFilterExpression":
    case "XML":
    case "XMLElement":
    case "XMLList":
    case "XMLEscape":
    case "XMLText":
    case "XMLStartTag":
    case "XMLEndTag":
    case "XMLPointTag":
    case "XMLName":
    case "XMLAttribute":
    case "XMLCdata":
    case "XMLComment":
    case "XMLProcessingInstruction":
    default:
      debugger;
      throw new Error("unknown type: " + JSON.stringify(n.type));
  }
  return p;
}
function printStatementSequence(path, options, print) {
  var inClassBody = namedTypes.ClassBody && namedTypes.ClassBody.check(path.getParentNode());
  var filtered = [];
  path.each(function(stmtPath) {
    var i = stmtPath.getName();
    var stmt = stmtPath.getValue();
    if (!stmt) {
      return ;
    }
    if (stmt.type === "EmptyStatement") {
      return ;
    }
    if (!inClassBody) {
      namedTypes.Statement.assert(stmt);
    }
    filtered.push({
      node: stmt,
      printed: print(stmtPath)
    });
  });
  var prevTrailingSpace = null;
  var len = filtered.length;
  var parts = [];
  filtered.forEach(function(info, i) {
    var printed = info.printed;
    var stmt = info.node;
    var needSemicolon = true;
    var multiLine = printed.length > 1;
    var notFirst = i > 0;
    var notLast = i < len - 1;
    var leadingSpace;
    var trailingSpace;
    if (inClassBody) {
      if (namedTypes.MethodDefinition.check(stmt) || (namedTypes.ClassPropertyDefinition.check(stmt) && namedTypes.MethodDefinition.check(stmt.definition))) {
        needSemicolon = false;
      }
    }
    if (needSemicolon) {
      printed = maybeAddSemicolon(printed);
    }
    var trueLoc = options.reuseWhitespace && getTrueLoc(stmt);
    var lines = trueLoc && trueLoc.lines;
    if (notFirst) {
      if (lines) {
        var beforeStart = lines.skipSpaces(trueLoc.start, true);
        var beforeStartLine = beforeStart ? beforeStart.line : 1;
        var leadingGap = trueLoc.start.line - beforeStartLine;
        leadingSpace = Array(leadingGap + 1).join("\n");
      } else {
        leadingSpace = multiLine ? "\n\n" : "\n";
      }
    } else {
      leadingSpace = "";
    }
    if (notLast) {
      if (lines) {
        var afterEnd = lines.skipSpaces(trueLoc.end);
        var afterEndLine = afterEnd ? afterEnd.line : lines.length;
        var trailingGap = afterEndLine - trueLoc.end.line;
        trailingSpace = Array(trailingGap + 1).join("\n");
      } else {
        trailingSpace = multiLine ? "\n\n" : "\n";
      }
    } else {
      trailingSpace = "";
    }
    parts.push(maxSpace(prevTrailingSpace, leadingSpace), printed);
    if (notLast) {
      prevTrailingSpace = trailingSpace;
    } else if (trailingSpace) {
      parts.push(trailingSpace);
    }
  });
  return concat(parts);
}
function getTrueLoc(node) {
  if (!node.loc) {
    return null;
  }
  if (!node.comments) {
    return node.loc;
  }
  var start = node.loc.start;
  var end = node.loc.end;
  node.comments.forEach(function(comment) {
    if (comment.loc) {
      if (util.comparePos(comment.loc.start, start) < 0) {
        start = comment.loc.start;
      }
      if (util.comparePos(end, comment.loc.end) < 0) {
        end = comment.loc.end;
      }
    }
  });
  return {
    lines: node.loc.lines,
    start: start,
    end: end
  };
}
function maxSpace(s1, s2) {
  if (!s1 && !s2) {
    return fromString("");
  }
  if (!s1) {
    return fromString(s2);
  }
  if (!s2) {
    return fromString(s1);
  }
  var spaceLines1 = fromString(s1);
  var spaceLines2 = fromString(s2);
  if (spaceLines2.length > spaceLines1.length) {
    return spaceLines2;
  }
  return spaceLines1;
}
function printMethod(path, options, print) {
  var node = path.getNode();
  var kind = node.kind;
  var parts = [];
  namedTypes.FunctionExpression.assert(node.value);
  if (node.value.async) {
    parts.push("async ");
  }
  if (!kind || kind === "init") {
    if (node.value.generator) {
      parts.push("*");
    }
  } else {
    assert.ok(kind === "get" || kind === "set");
    parts.push(kind, " ");
  }
  parts.push(path.call(print, "key"), "(", path.call(function(valuePath) {
    return printFunctionParams(valuePath, options, print);
  }, "value"), ") ", path.call(print, "value", "body"));
  return concat(parts);
}
function printArgumentsList(path, options, print) {
  var printed = path.map(print, "arguments");
  var joined = fromString(", ").join(printed);
  if (joined.getLineLength(1) > options.wrapColumn) {
    joined = fromString(",\n").join(printed);
    return concat(["(\n", joined.indent(options.tabWidth), "\n)"]);
  }
  return concat(["(", joined, ")"]);
}
function printFunctionParams(path, options, print) {
  var fun = path.getValue();
  namedTypes.Function.assert(fun);
  var printed = path.map(print, "params");
  if (fun.defaults) {
    path.each(function(defExprPath) {
      var i = defExprPath.getName();
      var p = printed[i];
      if (p && defExprPath.getValue()) {
        printed[i] = concat([p, "=", print(defExprPath)]);
      }
    }, "defaults");
  }
  if (fun.rest) {
    printed.push(concat(["...", path.call(print, "rest")]));
  }
  var joined = fromString(", ").join(printed);
  if (joined.length > 1 || joined.getLineLength(1) > options.wrapColumn) {
    joined = fromString(",\n").join(printed);
    return concat(["\n", joined.indent(options.tabWidth)]);
  }
  return joined;
}
function adjustClause(clause, options) {
  if (clause.length > 1)
    return concat([" ", clause]);
  return concat(["\n", maybeAddSemicolon(clause).indent(options.tabWidth)]);
}
function lastNonSpaceCharacter(lines) {
  var pos = lines.lastPos();
  do {
    var ch = lines.charAt(pos);
    if (/\S/.test(ch))
      return ch;
  } while (lines.prevPos(pos));
}
function endsWithBrace(lines) {
  return lastNonSpaceCharacter(lines) === "}";
}
function nodeStr(n) {
  namedTypes.Literal.assert(n);
  isString.assert(n.value);
  return JSON.stringify(n.value);
}
function maybeAddSemicolon(lines) {
  var eoc = lastNonSpaceCharacter(lines);
  if (!eoc || "\n};".indexOf(eoc) < 0)
    return concat([lines, ";"]);
  return lines;
}
