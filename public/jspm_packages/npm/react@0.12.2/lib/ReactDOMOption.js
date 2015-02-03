/* */ 
(function(process) {
  "use strict";
  var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
  var ReactCompositeComponent = require("./ReactCompositeComponent");
  var ReactElement = require("./ReactElement");
  var ReactDOM = require("./ReactDOM");
  var warning = require("./warning");
  var option = ReactElement.createFactory(ReactDOM.option.type);
  var ReactDOMOption = ReactCompositeComponent.createClass({
    displayName: 'ReactDOMOption',
    mixins: [ReactBrowserComponentMixin],
    componentWillMount: function() {
      if ("production" !== process.env.NODE_ENV) {
        ("production" !== process.env.NODE_ENV ? warning(this.props.selected == null, 'Use the `defaultValue` or `value` props on <select> instead of ' + 'setting `selected` on <option>.') : null);
      }
    },
    render: function() {
      return option(this.props, this.props.children);
    }
  });
  module.exports = ReactDOMOption;
})(require("process"));
