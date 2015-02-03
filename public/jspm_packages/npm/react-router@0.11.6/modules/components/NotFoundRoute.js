/* */ 
var React = require("react");
var FakeNode = require("../mixins/FakeNode");
var PropTypes = require("../utils/PropTypes");
var NotFoundRoute = React.createClass({
  displayName: 'NotFoundRoute',
  mixins: [FakeNode],
  propTypes: {
    name: React.PropTypes.string,
    path: PropTypes.falsy,
    handler: React.PropTypes.func.isRequired
  }
});
module.exports = NotFoundRoute;
