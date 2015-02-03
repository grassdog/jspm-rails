/* */ 
var React = require("react");
var assign = require("react/lib/Object.assign");
var Path = require("../utils/Path");
function routeIsActive(activeRoutes, routeName) {
  return activeRoutes.some(function(route) {
    return route.name === routeName;
  });
}
function paramsAreActive(activeParams, params) {
  for (var property in params)
    if (String(activeParams[property]) !== String(params[property]))
      return false;
  return true;
}
function queryIsActive(activeQuery, query) {
  for (var property in query)
    if (String(activeQuery[property]) !== String(query[property]))
      return false;
  return true;
}
var StateContext = {
  getCurrentPath: function() {
    return this.state.path;
  },
  getCurrentRoutes: function() {
    return this.state.routes.slice(0);
  },
  getCurrentPathname: function() {
    return this.state.pathname;
  },
  getCurrentParams: function() {
    return assign({}, this.state.params);
  },
  getCurrentQuery: function() {
    return assign({}, this.state.query);
  },
  isActive: function(to, params, query) {
    if (Path.isAbsolute(to))
      return to === this.state.path;
    return routeIsActive(this.state.routes, to) && paramsAreActive(this.state.params, params) && (query == null || queryIsActive(this.state.query, query));
  },
  childContextTypes: {
    getCurrentPath: React.PropTypes.func.isRequired,
    getCurrentRoutes: React.PropTypes.func.isRequired,
    getCurrentPathname: React.PropTypes.func.isRequired,
    getCurrentParams: React.PropTypes.func.isRequired,
    getCurrentQuery: React.PropTypes.func.isRequired,
    isActive: React.PropTypes.func.isRequired
  },
  getChildContext: function() {
    return {
      getCurrentPath: this.getCurrentPath,
      getCurrentRoutes: this.getCurrentRoutes,
      getCurrentPathname: this.getCurrentPathname,
      getCurrentParams: this.getCurrentParams,
      getCurrentQuery: this.getCurrentQuery,
      isActive: this.isActive
    };
  }
};
module.exports = StateContext;
