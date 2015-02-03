/* */ 
(function(process) {
  "use strict";
  var DOMProperty = require("DOMProperty");
  var ReactBrowserEventEmitter = require("ReactBrowserEventEmitter");
  var ReactCurrentOwner = require("ReactCurrentOwner");
  var ReactElement = require("ReactElement");
  var ReactLegacyElement = require("ReactLegacyElement");
  var ReactInstanceHandles = require("ReactInstanceHandles");
  var ReactPerf = require("ReactPerf");
  var containsNode = require("containsNode");
  var deprecated = require("deprecated");
  var getReactRootElementInContainer = require("getReactRootElementInContainer");
  var instantiateReactComponent = require("instantiateReactComponent");
  var invariant = require("invariant");
  var shouldUpdateReactComponent = require("shouldUpdateReactComponent");
  var warning = require("warning");
  var createElement = ReactLegacyElement.wrapCreateElement(ReactElement.createElement);
  var SEPARATOR = ReactInstanceHandles.SEPARATOR;
  var ATTR_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
  var nodeCache = {};
  var ELEMENT_NODE_TYPE = 1;
  var DOC_NODE_TYPE = 9;
  var instancesByReactRootID = {};
  var containersByReactRootID = {};
  if (__DEV__) {
    var rootElementsByReactRootID = {};
  }
  var findComponentRootReusableArray = [];
  function getReactRootID(container) {
    var rootElement = getReactRootElementInContainer(container);
    return rootElement && ReactMount.getID(rootElement);
  }
  function getID(node) {
    var id = internalGetID(node);
    if (id) {
      if (nodeCache.hasOwnProperty(id)) {
        var cached = nodeCache[id];
        if (cached !== node) {
          invariant(!isValid(cached, id), 'ReactMount: Two valid but unequal nodes with the same `%s`: %s', ATTR_NAME, id);
          nodeCache[id] = node;
        }
      } else {
        nodeCache[id] = node;
      }
    }
    return id;
  }
  function internalGetID(node) {
    return node && node.getAttribute && node.getAttribute(ATTR_NAME) || '';
  }
  function setID(node, id) {
    var oldID = internalGetID(node);
    if (oldID !== id) {
      delete nodeCache[oldID];
    }
    node.setAttribute(ATTR_NAME, id);
    nodeCache[id] = node;
  }
  function getNode(id) {
    if (!nodeCache.hasOwnProperty(id) || !isValid(nodeCache[id], id)) {
      nodeCache[id] = ReactMount.findReactNodeByID(id);
    }
    return nodeCache[id];
  }
  function isValid(node, id) {
    if (node) {
      invariant(internalGetID(node) === id, 'ReactMount: Unexpected modification of `%s`', ATTR_NAME);
      var container = ReactMount.findReactContainerForID(id);
      if (container && containsNode(container, node)) {
        return true;
      }
    }
    return false;
  }
  function purgeID(id) {
    delete nodeCache[id];
  }
  var deepestNodeSoFar = null;
  function findDeepestCachedAncestorImpl(ancestorID) {
    var ancestor = nodeCache[ancestorID];
    if (ancestor && isValid(ancestor, ancestorID)) {
      deepestNodeSoFar = ancestor;
    } else {
      return false;
    }
  }
  function findDeepestCachedAncestor(targetID) {
    deepestNodeSoFar = null;
    ReactInstanceHandles.traverseAncestors(targetID, findDeepestCachedAncestorImpl);
    var foundNode = deepestNodeSoFar;
    deepestNodeSoFar = null;
    return foundNode;
  }
  var ReactMount = {
    _instancesByReactRootID: instancesByReactRootID,
    scrollMonitor: function(container, renderCallback) {
      renderCallback();
    },
    _updateRootComponent: function(prevComponent, nextComponent, container, callback) {
      var nextProps = nextComponent.props;
      ReactMount.scrollMonitor(container, function() {
        prevComponent.replaceProps(nextProps, callback);
      });
      if (__DEV__) {
        rootElementsByReactRootID[getReactRootID(container)] = getReactRootElementInContainer(container);
      }
      return prevComponent;
    },
    _registerComponent: function(nextComponent, container) {
      invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE), '_registerComponent(...): Target container is not a DOM element.');
      ReactBrowserEventEmitter.ensureScrollValueMonitoring();
      var reactRootID = ReactMount.registerContainer(container);
      instancesByReactRootID[reactRootID] = nextComponent;
      return reactRootID;
    },
    _renderNewRootComponent: ReactPerf.measure('ReactMount', '_renderNewRootComponent', function(nextComponent, container, shouldReuseMarkup) {
      warning(ReactCurrentOwner.current == null, '_renderNewRootComponent(): Render methods should be a pure function ' + 'of props and state; triggering nested component updates from ' + 'render is not allowed. If necessary, trigger nested updates in ' + 'componentDidUpdate.');
      var componentInstance = instantiateReactComponent(nextComponent, null);
      var reactRootID = ReactMount._registerComponent(componentInstance, container);
      componentInstance.mountComponentIntoNode(reactRootID, container, shouldReuseMarkup);
      if (__DEV__) {
        rootElementsByReactRootID[reactRootID] = getReactRootElementInContainer(container);
      }
      return componentInstance;
    }),
    render: function(nextElement, container, callback) {
      invariant(ReactElement.isValidElement(nextElement), 'renderComponent(): Invalid component element.%s', (typeof nextElement === 'string' ? ' Instead of passing an element string, make sure to instantiate ' + 'it by passing it to React.createElement.' : ReactLegacyElement.isValidFactory(nextElement) ? ' Instead of passing a component class, make sure to instantiate ' + 'it by passing it to React.createElement.' : typeof nextElement.props !== "undefined" ? ' This may be caused by unintentionally loading two independent ' + 'copies of React.' : ''));
      var prevComponent = instancesByReactRootID[getReactRootID(container)];
      if (prevComponent) {
        var prevElement = prevComponent._currentElement;
        if (shouldUpdateReactComponent(prevElement, nextElement)) {
          return ReactMount._updateRootComponent(prevComponent, nextElement, container, callback);
        } else {
          ReactMount.unmountComponentAtNode(container);
        }
      }
      var reactRootElement = getReactRootElementInContainer(container);
      var containerHasReactMarkup = reactRootElement && ReactMount.isRenderedByReact(reactRootElement);
      var shouldReuseMarkup = containerHasReactMarkup && !prevComponent;
      var component = ReactMount._renderNewRootComponent(nextElement, container, shouldReuseMarkup);
      callback && callback.call(component);
      return component;
    },
    constructAndRenderComponent: function(constructor, props, container) {
      var element = createElement(constructor, props);
      return ReactMount.render(element, container);
    },
    constructAndRenderComponentByID: function(constructor, props, id) {
      var domNode = document.getElementById(id);
      invariant(domNode, 'Tried to get element with id of "%s" but it is not present on the page.', id);
      return ReactMount.constructAndRenderComponent(constructor, props, domNode);
    },
    registerContainer: function(container) {
      var reactRootID = getReactRootID(container);
      if (reactRootID) {
        reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(reactRootID);
      }
      if (!reactRootID) {
        reactRootID = ReactInstanceHandles.createReactRootID();
      }
      containersByReactRootID[reactRootID] = container;
      return reactRootID;
    },
    unmountComponentAtNode: function(container) {
      warning(ReactCurrentOwner.current == null, 'unmountComponentAtNode(): Render methods should be a pure function of ' + 'props and state; triggering nested component updates from render is ' + 'not allowed. If necessary, trigger nested updates in ' + 'componentDidUpdate.');
      var reactRootID = getReactRootID(container);
      var component = instancesByReactRootID[reactRootID];
      if (!component) {
        return false;
      }
      ReactMount.unmountComponentFromNode(component, container);
      delete instancesByReactRootID[reactRootID];
      delete containersByReactRootID[reactRootID];
      if (__DEV__) {
        delete rootElementsByReactRootID[reactRootID];
      }
      return true;
    },
    unmountComponentFromNode: function(instance, container) {
      instance.unmountComponent();
      if (container.nodeType === DOC_NODE_TYPE) {
        container = container.documentElement;
      }
      while (container.lastChild) {
        container.removeChild(container.lastChild);
      }
    },
    findReactContainerForID: function(id) {
      var reactRootID = ReactInstanceHandles.getReactRootIDFromNodeID(id);
      var container = containersByReactRootID[reactRootID];
      if (__DEV__) {
        var rootElement = rootElementsByReactRootID[reactRootID];
        if (rootElement && rootElement.parentNode !== container) {
          invariant(internalGetID(rootElement) === reactRootID, 'ReactMount: Root element ID differed from reactRootID.');
          var containerChild = container.firstChild;
          if (containerChild && reactRootID === internalGetID(containerChild)) {
            rootElementsByReactRootID[reactRootID] = containerChild;
          } else {
            console.warn('ReactMount: Root element has been removed from its original ' + 'container. New container:', rootElement.parentNode);
          }
        }
      }
      return container;
    },
    findReactNodeByID: function(id) {
      var reactRoot = ReactMount.findReactContainerForID(id);
      return ReactMount.findComponentRoot(reactRoot, id);
    },
    isRenderedByReact: function(node) {
      if (node.nodeType !== 1) {
        return false;
      }
      var id = ReactMount.getID(node);
      return id ? id.charAt(0) === SEPARATOR : false;
    },
    getFirstReactDOM: function(node) {
      var current = node;
      while (current && current.parentNode !== current) {
        if (ReactMount.isRenderedByReact(current)) {
          return current;
        }
        current = current.parentNode;
      }
      return null;
    },
    findComponentRoot: function(ancestorNode, targetID) {
      var firstChildren = findComponentRootReusableArray;
      var childIndex = 0;
      var deepestAncestor = findDeepestCachedAncestor(targetID) || ancestorNode;
      firstChildren[0] = deepestAncestor.firstChild;
      firstChildren.length = 1;
      while (childIndex < firstChildren.length) {
        var child = firstChildren[childIndex++];
        var targetChild;
        while (child) {
          var childID = ReactMount.getID(child);
          if (childID) {
            if (targetID === childID) {
              targetChild = child;
            } else if (ReactInstanceHandles.isAncestorIDOf(childID, targetID)) {
              firstChildren.length = childIndex = 0;
              firstChildren.push(child.firstChild);
            }
          } else {
            firstChildren.push(child.firstChild);
          }
          child = child.nextSibling;
        }
        if (targetChild) {
          firstChildren.length = 0;
          return targetChild;
        }
      }
      firstChildren.length = 0;
      invariant(false, 'findComponentRoot(..., %s): Unable to find element. This probably ' + 'means the DOM was unexpectedly mutated (e.g., by the browser), ' + 'usually due to forgetting a <tbody> when using tables, nesting tags ' + 'like <form>, <p>, or <a>, or using non-SVG elements in an <svg> ' + 'parent. ' + 'Try inspecting the child nodes of the element with React ID `%s`.', targetID, ReactMount.getID(ancestorNode));
    },
    getReactRootID: getReactRootID,
    getID: getID,
    setID: setID,
    getNode: getNode,
    purgeID: purgeID
  };
  ReactMount.renderComponent = deprecated('ReactMount', 'renderComponent', 'render', this, ReactMount.render);
  module.exports = ReactMount;
})(require("process"));
