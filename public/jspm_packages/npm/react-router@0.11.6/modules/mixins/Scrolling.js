/* */ 
var invariant = require("react/lib/invariant");
var canUseDOM = require("react/lib/ExecutionEnvironment").canUseDOM;
var getWindowScrollPosition = require("../utils/getWindowScrollPosition");
function shouldUpdateScroll(state, prevState) {
  if (!prevState)
    return true;
  if (state.pathname === prevState.pathname)
    return false;
  var routes = state.routes;
  var prevRoutes = prevState.routes;
  var sharedAncestorRoutes = routes.filter(function(route) {
    return prevRoutes.indexOf(route) !== -1;
  });
  return !sharedAncestorRoutes.some(function(route) {
    return route.ignoreScrollBehavior;
  });
}
var Scrolling = {
  statics: {
    recordScrollPosition: function(path) {
      if (!this.scrollHistory)
        this.scrollHistory = {};
      this.scrollHistory[path] = getWindowScrollPosition();
    },
    getScrollPosition: function(path) {
      if (!this.scrollHistory)
        this.scrollHistory = {};
      return this.scrollHistory[path] || null;
    }
  },
  componentWillMount: function() {
    invariant(this.getScrollBehavior() == null || canUseDOM, 'Cannot use scroll behavior without a DOM');
  },
  componentDidMount: function() {
    this._updateScroll();
  },
  componentDidUpdate: function(prevProps, prevState) {
    this._updateScroll(prevState);
  },
  _updateScroll: function(prevState) {
    if (!shouldUpdateScroll(this.state, prevState))
      return ;
    var scrollBehavior = this.getScrollBehavior();
    if (scrollBehavior)
      scrollBehavior.updateScrollPosition(this.constructor.getScrollPosition(this.state.path), this.state.action);
  }
};
module.exports = Scrolling;
