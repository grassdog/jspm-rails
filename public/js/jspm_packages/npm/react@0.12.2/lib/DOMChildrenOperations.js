/* */ 
(function(process) {
  "use strict";
  var Danger = require("./Danger");
  var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");
  var getTextContentAccessor = require("./getTextContentAccessor");
  var invariant = require("./invariant");
  var textContentAccessor = getTextContentAccessor();
  function insertChildAt(parentNode, childNode, index) {
    parentNode.insertBefore(childNode, parentNode.childNodes[index] || null);
  }
  var updateTextContent;
  if (textContentAccessor === 'textContent') {
    updateTextContent = function(node, text) {
      node.textContent = text;
    };
  } else {
    updateTextContent = function(node, text) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
      if (text) {
        var doc = node.ownerDocument || document;
        node.appendChild(doc.createTextNode(text));
      }
    };
  }
  var DOMChildrenOperations = {
    dangerouslyReplaceNodeWithMarkup: Danger.dangerouslyReplaceNodeWithMarkup,
    updateTextContent: updateTextContent,
    processUpdates: function(updates, markupList) {
      var update;
      var initialChildren = null;
      var updatedChildren = null;
      for (var i = 0; update = updates[i]; i++) {
        if (update.type === ReactMultiChildUpdateTypes.MOVE_EXISTING || update.type === ReactMultiChildUpdateTypes.REMOVE_NODE) {
          var updatedIndex = update.fromIndex;
          var updatedChild = update.parentNode.childNodes[updatedIndex];
          var parentID = update.parentID;
          ("production" !== process.env.NODE_ENV ? invariant(updatedChild, 'processUpdates(): Unable to find child %s of element. This ' + 'probably means the DOM was unexpectedly mutated (e.g., by the ' + 'browser), usually due to forgetting a <tbody> when using tables, ' + 'nesting tags like <form>, <p>, or <a>, or using non-SVG elements ' + 'in an <svg> parent. Try inspecting the child nodes of the element ' + 'with React ID `%s`.', updatedIndex, parentID) : invariant(updatedChild));
          initialChildren = initialChildren || {};
          initialChildren[parentID] = initialChildren[parentID] || [];
          initialChildren[parentID][updatedIndex] = updatedChild;
          updatedChildren = updatedChildren || [];
          updatedChildren.push(updatedChild);
        }
      }
      var renderedMarkup = Danger.dangerouslyRenderMarkup(markupList);
      if (updatedChildren) {
        for (var j = 0; j < updatedChildren.length; j++) {
          updatedChildren[j].parentNode.removeChild(updatedChildren[j]);
        }
      }
      for (var k = 0; update = updates[k]; k++) {
        switch (update.type) {
          case ReactMultiChildUpdateTypes.INSERT_MARKUP:
            insertChildAt(update.parentNode, renderedMarkup[update.markupIndex], update.toIndex);
            break;
          case ReactMultiChildUpdateTypes.MOVE_EXISTING:
            insertChildAt(update.parentNode, initialChildren[update.parentID][update.fromIndex], update.toIndex);
            break;
          case ReactMultiChildUpdateTypes.TEXT_CONTENT:
            updateTextContent(update.parentNode, update.textContent);
            break;
          case ReactMultiChildUpdateTypes.REMOVE_NODE:
            break;
        }
      }
    }
  };
  module.exports = DOMChildrenOperations;
})(require("process"));
