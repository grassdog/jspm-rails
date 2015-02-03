/* */ 
(function(process) {
  "use strict";
  var CSSPropertyOperations = require("CSSPropertyOperations");
  var DOMChildrenOperations = require("DOMChildrenOperations");
  var DOMPropertyOperations = require("DOMPropertyOperations");
  var ReactMount = require("ReactMount");
  var ReactPerf = require("ReactPerf");
  var invariant = require("invariant");
  var setInnerHTML = require("setInnerHTML");
  var INVALID_PROPERTY_ERRORS = {
    dangerouslySetInnerHTML: '`dangerouslySetInnerHTML` must be set using `updateInnerHTMLByID()`.',
    style: '`style` must be set using `updateStylesByID()`.'
  };
  var ReactDOMIDOperations = {
    updatePropertyByID: ReactPerf.measure('ReactDOMIDOperations', 'updatePropertyByID', function(id, name, value) {
      var node = ReactMount.getNode(id);
      invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name), 'updatePropertyByID(...): %s', INVALID_PROPERTY_ERRORS[name]);
      if (value != null) {
        DOMPropertyOperations.setValueForProperty(node, name, value);
      } else {
        DOMPropertyOperations.deleteValueForProperty(node, name);
      }
    }),
    deletePropertyByID: ReactPerf.measure('ReactDOMIDOperations', 'deletePropertyByID', function(id, name, value) {
      var node = ReactMount.getNode(id);
      invariant(!INVALID_PROPERTY_ERRORS.hasOwnProperty(name), 'updatePropertyByID(...): %s', INVALID_PROPERTY_ERRORS[name]);
      DOMPropertyOperations.deleteValueForProperty(node, name, value);
    }),
    updateStylesByID: ReactPerf.measure('ReactDOMIDOperations', 'updateStylesByID', function(id, styles) {
      var node = ReactMount.getNode(id);
      CSSPropertyOperations.setValueForStyles(node, styles);
    }),
    updateInnerHTMLByID: ReactPerf.measure('ReactDOMIDOperations', 'updateInnerHTMLByID', function(id, html) {
      var node = ReactMount.getNode(id);
      setInnerHTML(node, html);
    }),
    updateTextContentByID: ReactPerf.measure('ReactDOMIDOperations', 'updateTextContentByID', function(id, content) {
      var node = ReactMount.getNode(id);
      DOMChildrenOperations.updateTextContent(node, content);
    }),
    dangerouslyReplaceNodeWithMarkupByID: ReactPerf.measure('ReactDOMIDOperations', 'dangerouslyReplaceNodeWithMarkupByID', function(id, markup) {
      var node = ReactMount.getNode(id);
      DOMChildrenOperations.dangerouslyReplaceNodeWithMarkup(node, markup);
    }),
    dangerouslyProcessChildrenUpdates: ReactPerf.measure('ReactDOMIDOperations', 'dangerouslyProcessChildrenUpdates', function(updates, markup) {
      for (var i = 0; i < updates.length; i++) {
        updates[i].parentNode = ReactMount.getNode(updates[i].parentID);
      }
      DOMChildrenOperations.processUpdates(updates, markup);
    })
  };
  module.exports = ReactDOMIDOperations;
})(require("process"));
