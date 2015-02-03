/* */ 
"use strict";
var React = require("./React");
var ReactTransitionChildMapping = require("./ReactTransitionChildMapping");
var assign = require("./Object.assign");
var cloneWithProps = require("./cloneWithProps");
var emptyFunction = require("./emptyFunction");
var ReactTransitionGroup = React.createClass({
  displayName: 'ReactTransitionGroup',
  propTypes: {
    component: React.PropTypes.any,
    childFactory: React.PropTypes.func
  },
  getDefaultProps: function() {
    return {
      component: 'span',
      childFactory: emptyFunction.thatReturnsArgument
    };
  },
  getInitialState: function() {
    return {children: ReactTransitionChildMapping.getChildMapping(this.props.children)};
  },
  componentWillReceiveProps: function(nextProps) {
    var nextChildMapping = ReactTransitionChildMapping.getChildMapping(nextProps.children);
    var prevChildMapping = this.state.children;
    this.setState({children: ReactTransitionChildMapping.mergeChildMappings(prevChildMapping, nextChildMapping)});
    var key;
    for (key in nextChildMapping) {
      var hasPrev = prevChildMapping && prevChildMapping.hasOwnProperty(key);
      if (nextChildMapping[key] && !hasPrev && !this.currentlyTransitioningKeys[key]) {
        this.keysToEnter.push(key);
      }
    }
    for (key in prevChildMapping) {
      var hasNext = nextChildMapping && nextChildMapping.hasOwnProperty(key);
      if (prevChildMapping[key] && !hasNext && !this.currentlyTransitioningKeys[key]) {
        this.keysToLeave.push(key);
      }
    }
  },
  componentWillMount: function() {
    this.currentlyTransitioningKeys = {};
    this.keysToEnter = [];
    this.keysToLeave = [];
  },
  componentDidUpdate: function() {
    var keysToEnter = this.keysToEnter;
    this.keysToEnter = [];
    keysToEnter.forEach(this.performEnter);
    var keysToLeave = this.keysToLeave;
    this.keysToLeave = [];
    keysToLeave.forEach(this.performLeave);
  },
  performEnter: function(key) {
    this.currentlyTransitioningKeys[key] = true;
    var component = this.refs[key];
    if (component.componentWillEnter) {
      component.componentWillEnter(this._handleDoneEntering.bind(this, key));
    } else {
      this._handleDoneEntering(key);
    }
  },
  _handleDoneEntering: function(key) {
    var component = this.refs[key];
    if (component.componentDidEnter) {
      component.componentDidEnter();
    }
    delete this.currentlyTransitioningKeys[key];
    var currentChildMapping = ReactTransitionChildMapping.getChildMapping(this.props.children);
    if (!currentChildMapping || !currentChildMapping.hasOwnProperty(key)) {
      this.performLeave(key);
    }
  },
  performLeave: function(key) {
    this.currentlyTransitioningKeys[key] = true;
    var component = this.refs[key];
    if (component.componentWillLeave) {
      component.componentWillLeave(this._handleDoneLeaving.bind(this, key));
    } else {
      this._handleDoneLeaving(key);
    }
  },
  _handleDoneLeaving: function(key) {
    var component = this.refs[key];
    if (component.componentDidLeave) {
      component.componentDidLeave();
    }
    delete this.currentlyTransitioningKeys[key];
    var currentChildMapping = ReactTransitionChildMapping.getChildMapping(this.props.children);
    if (currentChildMapping && currentChildMapping.hasOwnProperty(key)) {
      this.performEnter(key);
    } else {
      var newChildren = assign({}, this.state.children);
      delete newChildren[key];
      this.setState({children: newChildren});
    }
  },
  render: function() {
    var childrenToRender = {};
    for (var key in this.state.children) {
      var child = this.state.children[key];
      if (child) {
        childrenToRender[key] = cloneWithProps(this.props.childFactory(child), {ref: key});
      }
    }
    return React.createElement(this.props.component, this.props, childrenToRender);
  }
});
module.exports = ReactTransitionGroup;
