/* */ 
(function(process) {
  "use strict";
  var assign = require("./Object.assign");
  var emptyFunction = require("./emptyFunction");
  var invariant = require("./invariant");
  var joinClasses = require("./joinClasses");
  var warning = require("./warning");
  var didWarn = false;
  function createTransferStrategy(mergeStrategy) {
    return function(props, key, value) {
      if (!props.hasOwnProperty(key)) {
        props[key] = value;
      } else {
        props[key] = mergeStrategy(props[key], value);
      }
    };
  }
  var transferStrategyMerge = createTransferStrategy(function(a, b) {
    return assign({}, b, a);
  });
  var TransferStrategies = {
    children: emptyFunction,
    className: createTransferStrategy(joinClasses),
    style: transferStrategyMerge
  };
  function transferInto(props, newProps) {
    for (var thisKey in newProps) {
      if (!newProps.hasOwnProperty(thisKey)) {
        continue;
      }
      var transferStrategy = TransferStrategies[thisKey];
      if (transferStrategy && TransferStrategies.hasOwnProperty(thisKey)) {
        transferStrategy(props, thisKey, newProps[thisKey]);
      } else if (!props.hasOwnProperty(thisKey)) {
        props[thisKey] = newProps[thisKey];
      }
    }
    return props;
  }
  var ReactPropTransferer = {
    TransferStrategies: TransferStrategies,
    mergeProps: function(oldProps, newProps) {
      return transferInto(assign({}, oldProps), newProps);
    },
    Mixin: {transferPropsTo: function(element) {
        ("production" !== process.env.NODE_ENV ? invariant(element._owner === this, '%s: You can\'t call transferPropsTo() on a component that you ' + 'don\'t own, %s. This usually means you are calling ' + 'transferPropsTo() on a component passed in as props or children.', this.constructor.displayName, typeof element.type === 'string' ? element.type : element.type.displayName) : invariant(element._owner === this));
        if ("production" !== process.env.NODE_ENV) {
          if (!didWarn) {
            didWarn = true;
            ("production" !== process.env.NODE_ENV ? warning(false, 'transferPropsTo is deprecated. ' + 'See http://fb.me/react-transferpropsto for more information.') : null);
          }
        }
        transferInto(element.props, this.props);
        return element;
      }}
  };
  module.exports = ReactPropTransferer;
})(require("process"));
