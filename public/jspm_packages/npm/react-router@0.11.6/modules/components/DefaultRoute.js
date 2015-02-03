/* */ 
var React = require("react");
var FakeNode = require("../mixins/FakeNode");
var PropTypes = require("../utils/PropTypes");
var DefaultRoute = React.createClass({
  displayName: 'DefaultRoute',
  mixins: [FakeNode],
  propTypes: {
    name: React.PropTypes.string,
    path: PropTypes.falsy,
    handler: React.PropTypes.func.isRequired
  }
});
module.exports = DefaultRoute;
