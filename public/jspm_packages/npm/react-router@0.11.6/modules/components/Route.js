/* */ 
var React = require("react");
var FakeNode = require("../mixins/FakeNode");
var Route = React.createClass({
  displayName: 'Route',
  mixins: [FakeNode],
  propTypes: {
    name: React.PropTypes.string,
    path: React.PropTypes.string,
    handler: React.PropTypes.func.isRequired,
    ignoreScrollBehavior: React.PropTypes.bool
  }
});
module.exports = Route;
