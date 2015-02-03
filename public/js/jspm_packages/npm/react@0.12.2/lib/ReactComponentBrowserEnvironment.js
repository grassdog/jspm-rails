/* */ 
(function(process) {
  "use strict";
  var ReactDOMIDOperations = require("./ReactDOMIDOperations");
  var ReactMarkupChecksum = require("./ReactMarkupChecksum");
  var ReactMount = require("./ReactMount");
  var ReactPerf = require("./ReactPerf");
  var ReactReconcileTransaction = require("./ReactReconcileTransaction");
  var getReactRootElementInContainer = require("./getReactRootElementInContainer");
  var invariant = require("./invariant");
  var setInnerHTML = require("./setInnerHTML");
  var ELEMENT_NODE_TYPE = 1;
  var DOC_NODE_TYPE = 9;
  var ReactComponentBrowserEnvironment = {
    ReactReconcileTransaction: ReactReconcileTransaction,
    BackendIDOperations: ReactDOMIDOperations,
    unmountIDFromEnvironment: function(rootNodeID) {
      ReactMount.purgeID(rootNodeID);
    },
    mountImageIntoNode: ReactPerf.measure('ReactComponentBrowserEnvironment', 'mountImageIntoNode', function(markup, container, shouldReuseMarkup) {
      ("production" !== process.env.NODE_ENV ? invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE), 'mountComponentIntoNode(...): Target container is not valid.') : invariant(container && (container.nodeType === ELEMENT_NODE_TYPE || container.nodeType === DOC_NODE_TYPE)));
      if (shouldReuseMarkup) {
        if (ReactMarkupChecksum.canReuseMarkup(markup, getReactRootElementInContainer(container))) {
          return ;
        } else {
          ("production" !== process.env.NODE_ENV ? invariant(container.nodeType !== DOC_NODE_TYPE, 'You\'re trying to render a component to the document using ' + 'server rendering but the checksum was invalid. This usually ' + 'means you rendered a different component type or props on ' + 'the client from the one on the server, or your render() ' + 'methods are impure. React cannot handle this case due to ' + 'cross-browser quirks by rendering at the document root. You ' + 'should look for environment dependent code in your components ' + 'and ensure the props are the same client and server side.') : invariant(container.nodeType !== DOC_NODE_TYPE));
          if ("production" !== process.env.NODE_ENV) {
            console.warn('React attempted to use reuse markup in a container but the ' + 'checksum was invalid. This generally means that you are ' + 'using server rendering and the markup generated on the ' + 'server was not what the client was expecting. React injected ' + 'new markup to compensate which works but you have lost many ' + 'of the benefits of server rendering. Instead, figure out ' + 'why the markup being generated is different on the client ' + 'or server.');
          }
        }
      }
      ("production" !== process.env.NODE_ENV ? invariant(container.nodeType !== DOC_NODE_TYPE, 'You\'re trying to render a component to the document but ' + 'you didn\'t use server rendering. We can\'t do this ' + 'without using server rendering due to cross-browser quirks. ' + 'See renderComponentToString() for server rendering.') : invariant(container.nodeType !== DOC_NODE_TYPE));
      setInnerHTML(container, markup);
    })
  };
  module.exports = ReactComponentBrowserEnvironment;
})(require("process"));
