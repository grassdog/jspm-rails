/* */ 
(function(process) {
  "use strict";
  var React = require("./React");
  var CSSCore = require("./CSSCore");
  var ReactTransitionEvents = require("./ReactTransitionEvents");
  var onlyChild = require("./onlyChild");
  var TICK = 17;
  var NO_EVENT_TIMEOUT = 5000;
  var noEventListener = null;
  if ("production" !== process.env.NODE_ENV) {
    noEventListener = function() {
      console.warn('transition(): tried to perform an animation without ' + 'an animationend or transitionend event after timeout (' + NO_EVENT_TIMEOUT + 'ms). You should either disable this ' + 'transition in JS or add a CSS animation/transition.');
    };
  }
  var ReactCSSTransitionGroupChild = React.createClass({
    displayName: 'ReactCSSTransitionGroupChild',
    transition: function(animationType, finishCallback) {
      var node = this.getDOMNode();
      var className = this.props.name + '-' + animationType;
      var activeClassName = className + '-active';
      var noEventTimeout = null;
      var endListener = function(e) {
        if (e && e.target !== node) {
          return ;
        }
        if ("production" !== process.env.NODE_ENV) {
          clearTimeout(noEventTimeout);
        }
        CSSCore.removeClass(node, className);
        CSSCore.removeClass(node, activeClassName);
        ReactTransitionEvents.removeEndEventListener(node, endListener);
        finishCallback && finishCallback();
      };
      ReactTransitionEvents.addEndEventListener(node, endListener);
      CSSCore.addClass(node, className);
      this.queueClass(activeClassName);
      if ("production" !== process.env.NODE_ENV) {
        noEventTimeout = setTimeout(noEventListener, NO_EVENT_TIMEOUT);
      }
    },
    queueClass: function(className) {
      this.classNameQueue.push(className);
      if (!this.timeout) {
        this.timeout = setTimeout(this.flushClassNameQueue, TICK);
      }
    },
    flushClassNameQueue: function() {
      if (this.isMounted()) {
        this.classNameQueue.forEach(CSSCore.addClass.bind(CSSCore, this.getDOMNode()));
      }
      this.classNameQueue.length = 0;
      this.timeout = null;
    },
    componentWillMount: function() {
      this.classNameQueue = [];
    },
    componentWillUnmount: function() {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
    },
    componentWillEnter: function(done) {
      if (this.props.enter) {
        this.transition('enter', done);
      } else {
        done();
      }
    },
    componentWillLeave: function(done) {
      if (this.props.leave) {
        this.transition('leave', done);
      } else {
        done();
      }
    },
    render: function() {
      return onlyChild(this.props.children);
    }
  });
  module.exports = ReactCSSTransitionGroupChild;
})(require("process"));
