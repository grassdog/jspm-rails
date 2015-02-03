/* */ 
"use strict";
var DOMPropertyOperations = require("./DOMPropertyOperations");
var ReactComponent = require("./ReactComponent");
var ReactElement = require("./ReactElement");
var assign = require("./Object.assign");
var escapeTextForBrowser = require("./escapeTextForBrowser");
var ReactTextComponent = function(props) {};
assign(ReactTextComponent.prototype, ReactComponent.Mixin, {
  mountComponent: function(rootID, transaction, mountDepth) {
    ReactComponent.Mixin.mountComponent.call(this, rootID, transaction, mountDepth);
    var escapedText = escapeTextForBrowser(this.props);
    if (transaction.renderToStaticMarkup) {
      return escapedText;
    }
    return ('<span ' + DOMPropertyOperations.createMarkupForID(rootID) + '>' + escapedText + '</span>');
  },
  receiveComponent: function(nextComponent, transaction) {
    var nextProps = nextComponent.props;
    if (nextProps !== this.props) {
      this.props = nextProps;
      ReactComponent.BackendIDOperations.updateTextContentByID(this._rootNodeID, nextProps);
    }
  }
});
var ReactTextComponentFactory = function(text) {
  return new ReactElement(ReactTextComponent, null, null, null, null, text);
};
ReactTextComponentFactory.type = ReactTextComponent;
module.exports = ReactTextComponentFactory;
