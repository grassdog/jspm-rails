/* */ 
var React = require("react");
var RouteHandlerMixin = require("../mixins/RouteHandler");
var RouteHandler = React.createClass({
  displayName: 'RouteHandler',
  mixins: [RouteHandlerMixin],
  getDefaultProps: function() {
    return {ref: '__routeHandler__'};
  },
  render: function() {
    return this.getRouteHandler();
  }
});
module.exports = RouteHandler;
