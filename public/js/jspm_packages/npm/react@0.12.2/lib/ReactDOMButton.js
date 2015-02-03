/* */ 
"use strict";
var AutoFocusMixin = require("./AutoFocusMixin");
var ReactBrowserComponentMixin = require("./ReactBrowserComponentMixin");
var ReactCompositeComponent = require("./ReactCompositeComponent");
var ReactElement = require("./ReactElement");
var ReactDOM = require("./ReactDOM");
var keyMirror = require("./keyMirror");
var button = ReactElement.createFactory(ReactDOM.button.type);
var mouseListenerNames = keyMirror({
  onClick: true,
  onDoubleClick: true,
  onMouseDown: true,
  onMouseMove: true,
  onMouseUp: true,
  onClickCapture: true,
  onDoubleClickCapture: true,
  onMouseDownCapture: true,
  onMouseMoveCapture: true,
  onMouseUpCapture: true
});
var ReactDOMButton = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMButton',
  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],
  render: function() {
    var props = {};
    for (var key in this.props) {
      if (this.props.hasOwnProperty(key) && (!this.props.disabled || !mouseListenerNames[key])) {
        props[key] = this.props[key];
      }
    }
    return button(props, this.props.children);
  }
});
module.exports = ReactDOMButton;
