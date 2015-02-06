/* */ 
(function(process) {
  "use strict";
  var CSSProperty = require("CSSProperty");
  var ExecutionEnvironment = require("ExecutionEnvironment");
  var camelizeStyleName = require("camelizeStyleName");
  var dangerousStyleValue = require("dangerousStyleValue");
  var hyphenateStyleName = require("hyphenateStyleName");
  var memoizeStringOnly = require("memoizeStringOnly");
  var warning = require("warning");
  var processStyleName = memoizeStringOnly(function(styleName) {
    return hyphenateStyleName(styleName);
  });
  var styleFloatAccessor = 'cssFloat';
  if (ExecutionEnvironment.canUseDOM) {
    if (document.documentElement.style.cssFloat === undefined) {
      styleFloatAccessor = 'styleFloat';
    }
  }
  if (__DEV__) {
    var warnedStyleNames = {};
    var warnHyphenatedStyleName = function(name) {
      if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
        return ;
      }
      warnedStyleNames[name] = true;
      warning(false, 'Unsupported style property ' + name + '. Did you mean ' + camelizeStyleName(name) + '?');
    };
  }
  var CSSPropertyOperations = {
    createMarkupForStyles: function(styles) {
      var serialized = '';
      for (var styleName in styles) {
        if (!styles.hasOwnProperty(styleName)) {
          continue;
        }
        if (__DEV__) {
          if (styleName.indexOf('-') > -1) {
            warnHyphenatedStyleName(styleName);
          }
        }
        var styleValue = styles[styleName];
        if (styleValue != null) {
          serialized += processStyleName(styleName) + ':';
          serialized += dangerousStyleValue(styleName, styleValue) + ';';
        }
      }
      return serialized || null;
    },
    setValueForStyles: function(node, styles) {
      var style = node.style;
      for (var styleName in styles) {
        if (!styles.hasOwnProperty(styleName)) {
          continue;
        }
        if (__DEV__) {
          if (styleName.indexOf('-') > -1) {
            warnHyphenatedStyleName(styleName);
          }
        }
        var styleValue = dangerousStyleValue(styleName, styles[styleName]);
        if (styleName === 'float') {
          styleName = styleFloatAccessor;
        }
        if (styleValue) {
          style[styleName] = styleValue;
        } else {
          var expansion = CSSProperty.shorthandPropertyExpansions[styleName];
          if (expansion) {
            for (var individualStyleName in expansion) {
              style[individualStyleName] = '';
            }
          } else {
            style[styleName] = '';
          }
        }
      }
    }
  };
  module.exports = CSSPropertyOperations;
})(require("process"));
