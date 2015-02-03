/* */ 
var React = require("react");
var classSet = require("react/lib/cx");
var assign = require("react/lib/Object.assign");
var Navigation = require("../mixins/Navigation");
var State = require("../mixins/State");
function isLeftClickEvent(event) {
  return event.button === 0;
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
var Link = React.createClass({
  displayName: 'Link',
  mixins: [Navigation, State],
  propTypes: {
    activeClassName: React.PropTypes.string.isRequired,
    to: React.PropTypes.string.isRequired,
    params: React.PropTypes.object,
    query: React.PropTypes.object,
    onClick: React.PropTypes.func
  },
  getDefaultProps: function() {
    return {activeClassName: 'active'};
  },
  handleClick: function(event) {
    var allowTransition = true;
    var clickResult;
    if (this.props.onClick)
      clickResult = this.props.onClick(event);
    if (isModifiedEvent(event) || !isLeftClickEvent(event))
      return ;
    if (clickResult === false || event.defaultPrevented === true)
      allowTransition = false;
    event.preventDefault();
    if (allowTransition)
      this.transitionTo(this.props.to, this.props.params, this.props.query);
  },
  getHref: function() {
    return this.makeHref(this.props.to, this.props.params, this.props.query);
  },
  getClassName: function() {
    var classNames = {};
    if (this.props.className)
      classNames[this.props.className] = true;
    if (this.isActive(this.props.to, this.props.params, this.props.query))
      classNames[this.props.activeClassName] = true;
    return classSet(classNames);
  },
  render: function() {
    var props = assign({}, this.props, {
      href: this.getHref(),
      className: this.getClassName(),
      onClick: this.handleClick
    });
    return React.DOM.a(props, this.props.children);
  }
});
module.exports = Link;
