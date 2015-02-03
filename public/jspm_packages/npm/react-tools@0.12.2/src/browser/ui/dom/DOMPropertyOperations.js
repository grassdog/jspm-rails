/* */ 
(function(process) {
  "use strict";
  var DOMProperty = require("DOMProperty");
  var escapeTextForBrowser = require("escapeTextForBrowser");
  var memoizeStringOnly = require("memoizeStringOnly");
  var warning = require("warning");
  function shouldIgnoreValue(name, value) {
    return value == null || (DOMProperty.hasBooleanValue[name] && !value) || (DOMProperty.hasNumericValue[name] && isNaN(value)) || (DOMProperty.hasPositiveNumericValue[name] && (value < 1)) || (DOMProperty.hasOverloadedBooleanValue[name] && value === false);
  }
  var processAttributeNameAndPrefix = memoizeStringOnly(function(name) {
    return escapeTextForBrowser(name) + '="';
  });
  if (__DEV__) {
    var reactProps = {
      children: true,
      dangerouslySetInnerHTML: true,
      key: true,
      ref: true
    };
    var warnedProperties = {};
    var warnUnknownProperty = function(name) {
      if (reactProps.hasOwnProperty(name) && reactProps[name] || warnedProperties.hasOwnProperty(name) && warnedProperties[name]) {
        return ;
      }
      warnedProperties[name] = true;
      var lowerCasedName = name.toLowerCase();
      var standardName = (DOMProperty.isCustomAttribute(lowerCasedName) ? lowerCasedName : DOMProperty.getPossibleStandardName.hasOwnProperty(lowerCasedName) ? DOMProperty.getPossibleStandardName[lowerCasedName] : null);
      warning(standardName == null, 'Unknown DOM property ' + name + '. Did you mean ' + standardName + '?');
    };
  }
  var DOMPropertyOperations = {
    createMarkupForID: function(id) {
      return processAttributeNameAndPrefix(DOMProperty.ID_ATTRIBUTE_NAME) + escapeTextForBrowser(id) + '"';
    },
    createMarkupForProperty: function(name, value) {
      if (DOMProperty.isStandardName.hasOwnProperty(name) && DOMProperty.isStandardName[name]) {
        if (shouldIgnoreValue(name, value)) {
          return '';
        }
        var attributeName = DOMProperty.getAttributeName[name];
        if (DOMProperty.hasBooleanValue[name] || (DOMProperty.hasOverloadedBooleanValue[name] && value === true)) {
          return escapeTextForBrowser(attributeName);
        }
        return processAttributeNameAndPrefix(attributeName) + escapeTextForBrowser(value) + '"';
      } else if (DOMProperty.isCustomAttribute(name)) {
        if (value == null) {
          return '';
        }
        return processAttributeNameAndPrefix(name) + escapeTextForBrowser(value) + '"';
      } else if (__DEV__) {
        warnUnknownProperty(name);
      }
      return null;
    },
    setValueForProperty: function(node, name, value) {
      if (DOMProperty.isStandardName.hasOwnProperty(name) && DOMProperty.isStandardName[name]) {
        var mutationMethod = DOMProperty.getMutationMethod[name];
        if (mutationMethod) {
          mutationMethod(node, value);
        } else if (shouldIgnoreValue(name, value)) {
          this.deleteValueForProperty(node, name);
        } else if (DOMProperty.mustUseAttribute[name]) {
          node.setAttribute(DOMProperty.getAttributeName[name], '' + value);
        } else {
          var propName = DOMProperty.getPropertyName[name];
          if (!DOMProperty.hasSideEffects[name] || ('' + node[propName]) !== ('' + value)) {
            node[propName] = value;
          }
        }
      } else if (DOMProperty.isCustomAttribute(name)) {
        if (value == null) {
          node.removeAttribute(name);
        } else {
          node.setAttribute(name, '' + value);
        }
      } else if (__DEV__) {
        warnUnknownProperty(name);
      }
    },
    deleteValueForProperty: function(node, name) {
      if (DOMProperty.isStandardName.hasOwnProperty(name) && DOMProperty.isStandardName[name]) {
        var mutationMethod = DOMProperty.getMutationMethod[name];
        if (mutationMethod) {
          mutationMethod(node, undefined);
        } else if (DOMProperty.mustUseAttribute[name]) {
          node.removeAttribute(DOMProperty.getAttributeName[name]);
        } else {
          var propName = DOMProperty.getPropertyName[name];
          var defaultValue = DOMProperty.getDefaultValueForProperty(node.nodeName, propName);
          if (!DOMProperty.hasSideEffects[name] || ('' + node[propName]) !== defaultValue) {
            node[propName] = defaultValue;
          }
        }
      } else if (DOMProperty.isCustomAttribute(name)) {
        node.removeAttribute(name);
      } else if (__DEV__) {
        warnUnknownProperty(name);
      }
    }
  };
  module.exports = DOMPropertyOperations;
})(require("process"));
