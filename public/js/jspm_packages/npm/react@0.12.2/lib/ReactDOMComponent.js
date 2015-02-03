/* */ 
(function(process) {
  "use strict";
  var CSSPropertyOperations = require("./CSSPropertyOperations");
  var DOMProperty = require("./DOMProperty");
  var DOMPropertyOperations = require("./DOMPropertyOperations");
  var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
  var ReactComponent = require("./ReactComponent");
  var ReactBrowserEventEmitter = require("./ReactBrowserEventEmitter");
  var ReactMount = require("./ReactMount");
  var ReactMultiChild = require("./ReactMultiChild");
  var ReactPerf = require("./ReactPerf");
  var assign = require("./Object.assign");
  var escapeTextForBrowser = require("./escapeTextForBrowser");
  var invariant = require("./invariant");
  var isEventSupported = require("./isEventSupported");
  var keyOf = require("./keyOf");
  var monitorCodeUse = require("./monitorCodeUse");
  var deleteListener = ReactBrowserEventEmitter.deleteListener;
  var listenTo = ReactBrowserEventEmitter.listenTo;
  var registrationNameModules = ReactBrowserEventEmitter.registrationNameModules;
  var CONTENT_TYPES = {
    'string': true,
    'number': true
  };
  var STYLE = keyOf({style: null});
  var ELEMENT_NODE_TYPE = 1;
  function assertValidProps(props) {
    if (!props) {
      return ;
    }
    ("production" !== process.env.NODE_ENV ? invariant(props.children == null || props.dangerouslySetInnerHTML == null, 'Can only set one of `children` or `props.dangerouslySetInnerHTML`.') : invariant(props.children == null || props.dangerouslySetInnerHTML == null));
    if ("production" !== process.env.NODE_ENV) {
      if (props.contentEditable && props.children != null) {
        console.warn('A component is `contentEditable` and contains `children` managed by ' + 'React. It is now your responsibility to guarantee that none of those ' + 'nodes are unexpectedly modified or duplicated. This is probably not ' + 'intentional.');
      }
    }
    ("production" !== process.env.NODE_ENV ? invariant(props.style == null || typeof props.style === 'object', 'The `style` prop expects a mapping from style properties to values, ' + 'not a string.') : invariant(props.style == null || typeof props.style === 'object'));
  }
  function putListener(id, registrationName, listener, transaction) {
    if ("production" !== process.env.NODE_ENV) {
      if (registrationName === 'onScroll' && !isEventSupported('scroll', true)) {
        monitorCodeUse('react_no_scroll_event');
        console.warn('This browser doesn\'t support the `onScroll` event');
      }
    }
    var container = ReactMount.findReactContainerForID(id);
    if (container) {
      var doc = container.nodeType === ELEMENT_NODE_TYPE ? container.ownerDocument : container;
      listenTo(registrationName, doc);
    }
    transaction.getPutListenerQueue().enqueuePutListener(id, registrationName, listener);
  }
  var omittedCloseTags = {
    'area': true,
    'base': true,
    'br': true,
    'col': true,
    'embed': true,
    'hr': true,
    'img': true,
    'input': true,
    'keygen': true,
    'link': true,
    'meta': true,
    'param': true,
    'source': true,
    'track': true,
    'wbr': true
  };
  var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/;
  var validatedTagCache = {};
  var hasOwnProperty = {}.hasOwnProperty;
  function validateDangerousTag(tag) {
    if (!hasOwnProperty.call(validatedTagCache, tag)) {
      ("production" !== process.env.NODE_ENV ? invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag) : invariant(VALID_TAG_REGEX.test(tag)));
      validatedTagCache[tag] = true;
    }
  }
  function ReactDOMComponent(tag) {
    validateDangerousTag(tag);
    this._tag = tag;
    this.tagName = tag.toUpperCase();
  }
  ReactDOMComponent.displayName = 'ReactDOMComponent';
  ReactDOMComponent.Mixin = {
    mountComponent: ReactPerf.measure('ReactDOMComponent', 'mountComponent', function(rootID, transaction, mountDepth) {
      ReactComponent.Mixin.mountComponent.call(this, rootID, transaction, mountDepth);
      assertValidProps(this.props);
      var closeTag = omittedCloseTags[this._tag] ? '' : '</' + this._tag + '>';
      return (this._createOpenTagMarkupAndPutListeners(transaction) + this._createContentMarkup(transaction) + closeTag);
    }),
    _createOpenTagMarkupAndPutListeners: function(transaction) {
      var props = this.props;
      var ret = '<' + this._tag;
      for (var propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
          continue;
        }
        var propValue = props[propKey];
        if (propValue == null) {
          continue;
        }
        if (registrationNameModules.hasOwnProperty(propKey)) {
          putListener(this._rootNodeID, propKey, propValue, transaction);
        } else {
          if (propKey === STYLE) {
            if (propValue) {
              propValue = props.style = assign({}, props.style);
            }
            propValue = CSSPropertyOperations.createMarkupForStyles(propValue);
          }
          var markup = DOMPropertyOperations.createMarkupForProperty(propKey, propValue);
          if (markup) {
            ret += ' ' + markup;
          }
        }
      }
      if (transaction.renderToStaticMarkup) {
        return ret + '>';
      }
      var markupForID = DOMPropertyOperations.createMarkupForID(this._rootNodeID);
      return ret + ' ' + markupForID + '>';
    },
    _createContentMarkup: function(transaction) {
      var innerHTML = this.props.dangerouslySetInnerHTML;
      if (innerHTML != null) {
        if (innerHTML.__html != null) {
          return innerHTML.__html;
        }
      } else {
        var contentToUse = CONTENT_TYPES[typeof this.props.children] ? this.props.children : null;
        var childrenToUse = contentToUse != null ? null : this.props.children;
        if (contentToUse != null) {
          return escapeTextForBrowser(contentToUse);
        } else if (childrenToUse != null) {
          var mountImages = this.mountChildren(childrenToUse, transaction);
          return mountImages.join('');
        }
      }
      return '';
    },
    receiveComponent: function(nextElement, transaction) {
      if (nextElement === this._currentElement && nextElement._owner != null) {
        return ;
      }
      ReactComponent.Mixin.receiveComponent.call(this, nextElement, transaction);
    },
    updateComponent: ReactPerf.measure('ReactDOMComponent', 'updateComponent', function(transaction, prevElement) {
      assertValidProps(this._currentElement.props);
      ReactComponent.Mixin.updateComponent.call(this, transaction, prevElement);
      this._updateDOMProperties(prevElement.props, transaction);
      this._updateDOMChildren(prevElement.props, transaction);
    }),
    _updateDOMProperties: function(lastProps, transaction) {
      var nextProps = this.props;
      var propKey;
      var styleName;
      var styleUpdates;
      for (propKey in lastProps) {
        if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)) {
          continue;
        }
        if (propKey === STYLE) {
          var lastStyle = lastProps[propKey];
          for (styleName in lastStyle) {
            if (lastStyle.hasOwnProperty(styleName)) {
              styleUpdates = styleUpdates || {};
              styleUpdates[styleName] = '';
            }
          }
        } else if (registrationNameModules.hasOwnProperty(propKey)) {
          deleteListener(this._rootNodeID, propKey);
        } else if (DOMProperty.isStandardName[propKey] || DOMProperty.isCustomAttribute(propKey)) {
          ReactComponent.BackendIDOperations.deletePropertyByID(this._rootNodeID, propKey);
        }
      }
      for (propKey in nextProps) {
        var nextProp = nextProps[propKey];
        var lastProp = lastProps[propKey];
        if (!nextProps.hasOwnProperty(propKey) || nextProp === lastProp) {
          continue;
        }
        if (propKey === STYLE) {
          if (nextProp) {
            nextProp = nextProps.style = assign({}, nextProp);
          }
          if (lastProp) {
            for (styleName in lastProp) {
              if (lastProp.hasOwnProperty(styleName) && (!nextProp || !nextProp.hasOwnProperty(styleName))) {
                styleUpdates = styleUpdates || {};
                styleUpdates[styleName] = '';
              }
            }
            for (styleName in nextProp) {
              if (nextProp.hasOwnProperty(styleName) && lastProp[styleName] !== nextProp[styleName]) {
                styleUpdates = styleUpdates || {};
                styleUpdates[styleName] = nextProp[styleName];
              }
            }
          } else {
            styleUpdates = nextProp;
          }
        } else if (registrationNameModules.hasOwnProperty(propKey)) {
          putListener(this._rootNodeID, propKey, nextProp, transaction);
        } else if (DOMProperty.isStandardName[propKey] || DOMProperty.isCustomAttribute(propKey)) {
          ReactComponent.BackendIDOperations.updatePropertyByID(this._rootNodeID, propKey, nextProp);
        }
      }
      if (styleUpdates) {
        ReactComponent.BackendIDOperations.updateStylesByID(this._rootNodeID, styleUpdates);
      }
    },
    _updateDOMChildren: function(lastProps, transaction) {
      var nextProps = this.props;
      var lastContent = CONTENT_TYPES[typeof lastProps.children] ? lastProps.children : null;
      var nextContent = CONTENT_TYPES[typeof nextProps.children] ? nextProps.children : null;
      var lastHtml = lastProps.dangerouslySetInnerHTML && lastProps.dangerouslySetInnerHTML.__html;
      var nextHtml = nextProps.dangerouslySetInnerHTML && nextProps.dangerouslySetInnerHTML.__html;
      var lastChildren = lastContent != null ? null : lastProps.children;
      var nextChildren = nextContent != null ? null : nextProps.children;
      var lastHasContentOrHtml = lastContent != null || lastHtml != null;
      var nextHasContentOrHtml = nextContent != null || nextHtml != null;
      if (lastChildren != null && nextChildren == null) {
        this.updateChildren(null, transaction);
      } else if (lastHasContentOrHtml && !nextHasContentOrHtml) {
        this.updateTextContent('');
      }
      if (nextContent != null) {
        if (lastContent !== nextContent) {
          this.updateTextContent('' + nextContent);
        }
      } else if (nextHtml != null) {
        if (lastHtml !== nextHtml) {
          ReactComponent.BackendIDOperations.updateInnerHTMLByID(this._rootNodeID, nextHtml);
        }
      } else if (nextChildren != null) {
        this.updateChildren(nextChildren, transaction);
      }
    },
    unmountComponent: function() {
      this.unmountChildren();
      ReactBrowserEventEmitter.deleteAllListeners(this._rootNodeID);
      ReactComponent.Mixin.unmountComponent.call(this);
    }
  };
  assign(ReactDOMComponent.prototype, ReactComponent.Mixin, ReactDOMComponent.Mixin, ReactMultiChild.Mixin, ReactBrowserComponentMixin);
  module.exports = ReactDOMComponent;
})(require("process"));
