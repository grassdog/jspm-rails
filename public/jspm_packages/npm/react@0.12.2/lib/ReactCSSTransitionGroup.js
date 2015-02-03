/* */ 
"use strict";
var React = require("./React");
var assign = require("./Object.assign");
var ReactTransitionGroup = React.createFactory(require("./ReactTransitionGroup"));
var ReactCSSTransitionGroupChild = React.createFactory(require("./ReactCSSTransitionGroupChild"));
var ReactCSSTransitionGroup = React.createClass({
  displayName: 'ReactCSSTransitionGroup',
  propTypes: {
    transitionName: React.PropTypes.string.isRequired,
    transitionEnter: React.PropTypes.bool,
    transitionLeave: React.PropTypes.bool
  },
  getDefaultProps: function() {
    return {
      transitionEnter: true,
      transitionLeave: true
    };
  },
  _wrapChild: function(child) {
    return ReactCSSTransitionGroupChild({
      name: this.props.transitionName,
      enter: this.props.transitionEnter,
      leave: this.props.transitionLeave
    }, child);
  },
  render: function() {
    return (ReactTransitionGroup(assign({}, this.props, {childFactory: this._wrapChild})));
  }
});
module.exports = ReactCSSTransitionGroup;
