/* */ 
"use strict";
var EventConstants = require("./EventConstants");
var LocalEventTrapMixin = require("./LocalEventTrapMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactElement = require("./ReactElement");
var ReactDOM = require("./ReactDOM");
var form = ReactElement.createFactory(ReactDOM.form.type);
var ReactDOMForm = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMForm',
  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],
  render: function() {
    return form(this.props);
  },
  componentDidMount: function() {
    this.trapBubbledEvent(EventConstants.topLevelTypes.topReset, 'reset');
    this.trapBubbledEvent(EventConstants.topLevelTypes.topSubmit, 'submit');
  }
});
module.exports = ReactDOMForm;
