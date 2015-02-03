/* */ 
(function(process) {
  var React = require("react");
  var warning = require("react/lib/warning");
  var invariant = require("react/lib/invariant");
  var canUseDOM = require("react/lib/ExecutionEnvironment").canUseDOM;
  var ImitateBrowserBehavior = require("../behaviors/ImitateBrowserBehavior");
  var RouteHandler = require("../components/RouteHandler");
  var LocationActions = require("../actions/LocationActions");
  var HashLocation = require("../locations/HashLocation");
  var HistoryLocation = require("../locations/HistoryLocation");
  var RefreshLocation = require("../locations/RefreshLocation");
  var NavigationContext = require("../mixins/NavigationContext");
  var StateContext = require("../mixins/StateContext");
  var Scrolling = require("../mixins/Scrolling");
  var createRoutesFromChildren = require("./createRoutesFromChildren");
  var supportsHistory = require("./supportsHistory");
  var Transition = require("./Transition");
  var PropTypes = require("./PropTypes");
  var Redirect = require("./Redirect");
  var History = require("./History");
  var Cancellation = require("./Cancellation");
  var Path = require("./Path");
  var DEFAULT_LOCATION = canUseDOM ? HashLocation : '/';
  var DEFAULT_SCROLL_BEHAVIOR = canUseDOM ? ImitateBrowserBehavior : null;
  function defaultErrorHandler(error) {
    throw error;
  }
  function defaultAbortHandler(abortReason, location) {
    if (typeof location === 'string')
      throw new Error('Unhandled aborted transition! Reason: ' + abortReason);
    if (abortReason instanceof Cancellation) {
      return ;
    } else if (abortReason instanceof Redirect) {
      location.replace(this.makePath(abortReason.to, abortReason.params, abortReason.query));
    } else {
      location.pop();
    }
  }
  function findMatch(pathname, routes, defaultRoute, notFoundRoute) {
    var match,
        route,
        params;
    for (var i = 0,
        len = routes.length; i < len; ++i) {
      route = routes[i];
      match = findMatch(pathname, route.childRoutes, route.defaultRoute, route.notFoundRoute);
      if (match != null) {
        match.routes.unshift(route);
        return match;
      }
      params = Path.extractParams(route.path, pathname);
      if (params)
        return createMatch(route, params);
    }
    if (defaultRoute && (params = Path.extractParams(defaultRoute.path, pathname)))
      return createMatch(defaultRoute, params);
    if (notFoundRoute && (params = Path.extractParams(notFoundRoute.path, pathname)))
      return createMatch(notFoundRoute, params);
    return match;
  }
  function createMatch(route, params) {
    return {
      routes: [route],
      params: params
    };
  }
  function hasProperties(object, properties) {
    for (var propertyName in properties)
      if (properties.hasOwnProperty(propertyName) && object[propertyName] !== properties[propertyName])
        return false;
    return true;
  }
  function hasMatch(routes, route, prevParams, nextParams, prevQuery, nextQuery) {
    return routes.some(function(r) {
      if (r !== route)
        return false;
      var paramNames = route.paramNames;
      var paramName;
      for (var i = 0,
          len = paramNames.length; i < len; ++i) {
        paramName = paramNames[i];
        if (nextParams[paramName] !== prevParams[paramName])
          return false;
      }
      return hasProperties(prevQuery, nextQuery) && hasProperties(nextQuery, prevQuery);
    });
  }
  function createRouter(options) {
    options = options || {};
    if (typeof options === 'function') {
      options = {routes: options};
    } else if (Array.isArray(options)) {
      options = {routes: options};
    }
    var routes = [];
    var namedRoutes = {};
    var components = [];
    var location = options.location || DEFAULT_LOCATION;
    var scrollBehavior = options.scrollBehavior || DEFAULT_SCROLL_BEHAVIOR;
    var onError = options.onError || defaultErrorHandler;
    var onAbort = options.onAbort || defaultAbortHandler;
    var state = {};
    var nextState = {};
    var pendingTransition = null;
    function updateState() {
      state = nextState;
      nextState = {};
    }
    if (typeof location === 'string') {
      warning(!canUseDOM || process.env.NODE_ENV === 'test', 'You should not use a static location in a DOM environment because ' + 'the router will not be kept in sync with the current URL');
    } else {
      invariant(canUseDOM, 'You cannot use %s without a DOM', location);
    }
    if (location === HistoryLocation && !supportsHistory())
      location = RefreshLocation;
    var router = React.createClass({
      displayName: 'Router',
      mixins: [NavigationContext, StateContext, Scrolling],
      statics: {
        defaultRoute: null,
        notFoundRoute: null,
        addRoutes: function(children) {
          routes.push.apply(routes, createRoutesFromChildren(children, this, namedRoutes));
        },
        makePath: function(to, params, query) {
          var path;
          if (Path.isAbsolute(to)) {
            path = Path.normalize(to);
          } else {
            var route = namedRoutes[to];
            invariant(route, 'Unable to find <Route name="%s">', to);
            path = route.path;
          }
          return Path.withQuery(Path.injectParams(path, params), query);
        },
        makeHref: function(to, params, query) {
          var path = this.makePath(to, params, query);
          return (location === HashLocation) ? '#' + path : path;
        },
        transitionTo: function(to, params, query) {
          invariant(typeof location !== 'string', 'You cannot use transitionTo with a static location');
          var path = this.makePath(to, params, query);
          if (pendingTransition) {
            location.replace(path);
          } else {
            location.push(path);
          }
        },
        replaceWith: function(to, params, query) {
          invariant(typeof location !== 'string', 'You cannot use replaceWith with a static location');
          location.replace(this.makePath(to, params, query));
        },
        goBack: function() {
          invariant(typeof location !== 'string', 'You cannot use goBack with a static location');
          if (History.length > 1 || location === RefreshLocation) {
            location.pop();
            return true;
          }
          warning(false, 'goBack() was ignored because there is no router history');
          return false;
        },
        match: function(pathname) {
          return findMatch(pathname, routes, this.defaultRoute, this.notFoundRoute) || null;
        },
        dispatch: function(path, action, callback) {
          if (pendingTransition) {
            pendingTransition.abort(new Cancellation);
            pendingTransition = null;
          }
          var prevPath = state.path;
          if (prevPath === path)
            return ;
          if (prevPath && action !== LocationActions.REPLACE)
            this.recordScrollPosition(prevPath);
          var pathname = Path.withoutQuery(path);
          var match = this.match(pathname);
          warning(match != null, 'No route matches path "%s". Make sure you have <Route path="%s"> somewhere in your routes', path, path);
          if (match == null)
            match = {};
          var prevRoutes = state.routes || [];
          var prevParams = state.params || {};
          var prevQuery = state.query || {};
          var nextRoutes = match.routes || [];
          var nextParams = match.params || {};
          var nextQuery = Path.extractQuery(path) || {};
          var fromRoutes,
              toRoutes;
          if (prevRoutes.length) {
            fromRoutes = prevRoutes.filter(function(route) {
              return !hasMatch(nextRoutes, route, prevParams, nextParams, prevQuery, nextQuery);
            });
            toRoutes = nextRoutes.filter(function(route) {
              return !hasMatch(prevRoutes, route, prevParams, nextParams, prevQuery, nextQuery);
            });
          } else {
            fromRoutes = [];
            toRoutes = nextRoutes;
          }
          var transition = new Transition(path, this.replaceWith.bind(this, path));
          pendingTransition = transition;
          transition.from(fromRoutes, components, function(error) {
            if (error || transition.isAborted)
              return callback.call(router, error, transition);
            transition.to(toRoutes, nextParams, nextQuery, function(error) {
              if (error || transition.isAborted)
                return callback.call(router, error, transition);
              nextState.path = path;
              nextState.action = action;
              nextState.pathname = pathname;
              nextState.routes = nextRoutes;
              nextState.params = nextParams;
              nextState.query = nextQuery;
              callback.call(router, null, transition);
            });
          });
        },
        run: function(callback) {
          var dispatchHandler = function(error, transition) {
            pendingTransition = null;
            if (error) {
              onError.call(router, error);
            } else if (transition.isAborted) {
              onAbort.call(router, transition.abortReason, location);
            } else {
              callback.call(router, router, nextState);
            }
          };
          if (typeof location === 'string') {
            router.dispatch(location, null, dispatchHandler);
          } else {
            var changeListener = function(change) {
              router.dispatch(change.path, change.type, dispatchHandler);
            };
            if (location.addChangeListener)
              location.addChangeListener(changeListener);
            router.dispatch(location.getCurrentPath(), null, dispatchHandler);
          }
        },
        teardown: function() {
          location.removeChangeListener(this.changeListener);
        }
      },
      propTypes: {children: PropTypes.falsy},
      getLocation: function() {
        return location;
      },
      getScrollBehavior: function() {
        return scrollBehavior;
      },
      getRouteAtDepth: function(depth) {
        var routes = this.state.routes;
        return routes && routes[depth];
      },
      getRouteComponents: function() {
        return components;
      },
      getInitialState: function() {
        updateState();
        return state;
      },
      componentWillReceiveProps: function() {
        updateState();
        this.setState(state);
      },
      componentWillUnmount: function() {
        router.teardown();
      },
      render: function() {
        return this.getRouteAtDepth(0) ? React.createElement(RouteHandler, this.props) : null;
      },
      childContextTypes: {
        getRouteAtDepth: React.PropTypes.func.isRequired,
        getRouteComponents: React.PropTypes.func.isRequired,
        routeHandlers: React.PropTypes.array.isRequired
      },
      getChildContext: function() {
        return {
          getRouteComponents: this.getRouteComponents,
          getRouteAtDepth: this.getRouteAtDepth,
          routeHandlers: [this]
        };
      }
    });
    if (options.routes)
      router.addRoutes(options.routes);
    return router;
  }
  module.exports = createRouter;
})(require("process"));
