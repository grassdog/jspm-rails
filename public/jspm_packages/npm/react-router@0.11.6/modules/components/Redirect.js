/* */ 
var React = require("react");
var FakeNode = require("../mixins/FakeNode");
var PropTypes = require("../utils/PropTypes");
var Redirect = React.createClass({
  displayName: 'Redirect',
  mixins: [FakeNode],
  propTypes: {
    path: React.PropTypes.string,
    from: React.PropTypes.string,
    to: React.PropTypes.string,
    handler: PropTypes.falsy
  }
});
module.exports = Redirect;
