/* */ 
(function(process) {
  "use strict";
  var ReactComponent = require("./ReactComponent");
  var ReactMultiChildUpdateTypes = require("./ReactMultiChildUpdateTypes");
  var flattenChildren = require("./flattenChildren");
  var instantiateReactComponent = require("./instantiateReactComponent");
  var shouldUpdateReactComponent = require("./shouldUpdateReactComponent");
  var updateDepth = 0;
  var updateQueue = [];
  var markupQueue = [];
  function enqueueMarkup(parentID, markup, toIndex) {
    updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.INSERT_MARKUP,
      markupIndex: markupQueue.push(markup) - 1,
      textContent: null,
      fromIndex: null,
      toIndex: toIndex
    });
  }
  function enqueueMove(parentID, fromIndex, toIndex) {
    updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.MOVE_EXISTING,
      markupIndex: null,
      textContent: null,
      fromIndex: fromIndex,
      toIndex: toIndex
    });
  }
  function enqueueRemove(parentID, fromIndex) {
    updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.REMOVE_NODE,
      markupIndex: null,
      textContent: null,
      fromIndex: fromIndex,
      toIndex: null
    });
  }
  function enqueueTextContent(parentID, textContent) {
    updateQueue.push({
      parentID: parentID,
      parentNode: null,
      type: ReactMultiChildUpdateTypes.TEXT_CONTENT,
      markupIndex: null,
      textContent: textContent,
      fromIndex: null,
      toIndex: null
    });
  }
  function processQueue() {
    if (updateQueue.length) {
      ReactComponent.BackendIDOperations.dangerouslyProcessChildrenUpdates(updateQueue, markupQueue);
      clearQueue();
    }
  }
  function clearQueue() {
    updateQueue.length = 0;
    markupQueue.length = 0;
  }
  var ReactMultiChild = {Mixin: {
      mountChildren: function(nestedChildren, transaction) {
        var children = flattenChildren(nestedChildren);
        var mountImages = [];
        var index = 0;
        this._renderedChildren = children;
        for (var name in children) {
          var child = children[name];
          if (children.hasOwnProperty(name)) {
            var childInstance = instantiateReactComponent(child, null);
            children[name] = childInstance;
            var rootID = this._rootNodeID + name;
            var mountImage = childInstance.mountComponent(rootID, transaction, this._mountDepth + 1);
            childInstance._mountIndex = index;
            mountImages.push(mountImage);
            index++;
          }
        }
        return mountImages;
      },
      updateTextContent: function(nextContent) {
        updateDepth++;
        var errorThrown = true;
        try {
          var prevChildren = this._renderedChildren;
          for (var name in prevChildren) {
            if (prevChildren.hasOwnProperty(name)) {
              this._unmountChildByName(prevChildren[name], name);
            }
          }
          this.setTextContent(nextContent);
          errorThrown = false;
        } finally {
          updateDepth--;
          if (!updateDepth) {
            errorThrown ? clearQueue() : processQueue();
          }
        }
      },
      updateChildren: function(nextNestedChildren, transaction) {
        updateDepth++;
        var errorThrown = true;
        try {
          this._updateChildren(nextNestedChildren, transaction);
          errorThrown = false;
        } finally {
          updateDepth--;
          if (!updateDepth) {
            errorThrown ? clearQueue() : processQueue();
          }
        }
      },
      _updateChildren: function(nextNestedChildren, transaction) {
        var nextChildren = flattenChildren(nextNestedChildren);
        var prevChildren = this._renderedChildren;
        if (!nextChildren && !prevChildren) {
          return ;
        }
        var name;
        var lastIndex = 0;
        var nextIndex = 0;
        for (name in nextChildren) {
          if (!nextChildren.hasOwnProperty(name)) {
            continue;
          }
          var prevChild = prevChildren && prevChildren[name];
          var prevElement = prevChild && prevChild._currentElement;
          var nextElement = nextChildren[name];
          if (shouldUpdateReactComponent(prevElement, nextElement)) {
            this.moveChild(prevChild, nextIndex, lastIndex);
            lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            prevChild.receiveComponent(nextElement, transaction);
            prevChild._mountIndex = nextIndex;
          } else {
            if (prevChild) {
              lastIndex = Math.max(prevChild._mountIndex, lastIndex);
              this._unmountChildByName(prevChild, name);
            }
            var nextChildInstance = instantiateReactComponent(nextElement, null);
            this._mountChildByNameAtIndex(nextChildInstance, name, nextIndex, transaction);
          }
          nextIndex++;
        }
        for (name in prevChildren) {
          if (prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren[name])) {
            this._unmountChildByName(prevChildren[name], name);
          }
        }
      },
      unmountChildren: function() {
        var renderedChildren = this._renderedChildren;
        for (var name in renderedChildren) {
          var renderedChild = renderedChildren[name];
          if (renderedChild.unmountComponent) {
            renderedChild.unmountComponent();
          }
        }
        this._renderedChildren = null;
      },
      moveChild: function(child, toIndex, lastIndex) {
        if (child._mountIndex < lastIndex) {
          enqueueMove(this._rootNodeID, child._mountIndex, toIndex);
        }
      },
      createChild: function(child, mountImage) {
        enqueueMarkup(this._rootNodeID, mountImage, child._mountIndex);
      },
      removeChild: function(child) {
        enqueueRemove(this._rootNodeID, child._mountIndex);
      },
      setTextContent: function(textContent) {
        enqueueTextContent(this._rootNodeID, textContent);
      },
      _mountChildByNameAtIndex: function(child, name, index, transaction) {
        var rootID = this._rootNodeID + name;
        var mountImage = child.mountComponent(rootID, transaction, this._mountDepth + 1);
        child._mountIndex = index;
        this.createChild(child, mountImage);
        this._renderedChildren = this._renderedChildren || {};
        this._renderedChildren[name] = child;
      },
      _unmountChildByName: function(child, name) {
        this.removeChild(child);
        child._mountIndex = null;
        child.unmountComponent();
        delete this._renderedChildren[name];
      }
    }};
  module.exports = ReactMultiChild;
})(require("process"));
