/* */ 
"use strict";
var EventConstants = require("./EventConstants");
var LocalEventTrapMixin = require("./LocalEventTrapMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactElement = require("./ReactElement");
var ReactDOM = require("./ReactDOM");
var img = ReactElement.createFactory(ReactDOM.img.type);
var ReactDOMImg = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMImg',
  tagName: 'IMG',
  mixins: [ReactBrowserComponentMixin, LocalEventTrapMixin],
  render: function() {
    return img(this.props);
  },
  componentDidMount: function() {
    this.trapBubbledEvent(EventConstants.topLevelTypes.topLoad, 'load');
    this.trapBubbledEvent(EventConstants.topLevelTypes.topError, 'error');
  }
});
module.exports = ReactDOMImg;
