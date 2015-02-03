/* */ 
"format cjs";
(function(Buffer, process) {
  !function(e) {
    if ("object" == typeof exports && "undefined" != typeof module)
      module.exports = e();
    else if ("function" == typeof define && define.amd)
      define([], e);
    else {
      var f;
      "undefined" != typeof window ? f = window : "undefined" != typeof global ? f = global : "undefined" != typeof self && (f = self), f.ReactRouter = e();
    }
  }(function() {
    var define,
        module,
        exports;
    return (function e(t, n, r) {
      function s(o, u) {
        if (!n[o]) {
          if (!t[o]) {
            var a = typeof require == "function" && require;
            if (!u && a)
              return a(o, !0);
            if (i)
              return i(o, !0);
            throw new Error("Cannot find module '" + o + "'");
          }
          var f = n[o] = {exports: {}};
          t[o][0].call(f.exports, function(e) {
            var n = t[o][1][e];
            return s(n ? n : e);
          }, f, f.exports, e, t, n, r);
        }
        return n[o].exports;
      }
      var i = typeof require == "function" && require;
      for (var o = 0; o < r.length; o++)
        s(r[o]);
      return s;
    })({
      1: [function(_dereq_, module, exports) {
        var LocationActions = {
          PUSH: 'push',
          REPLACE: 'replace',
          POP: 'pop'
        };
        module.exports = LocationActions;
      }, {}],
      2: [function(_dereq_, module, exports) {
        var LocationActions = _dereq_('../actions/LocationActions');
        var ImitateBrowserBehavior = {updateScrollPosition: function(position, actionType) {
            switch (actionType) {
              case LocationActions.PUSH:
              case LocationActions.REPLACE:
                window.scrollTo(0, 0);
                break;
              case LocationActions.POP:
                if (position) {
                  window.scrollTo(position.x, position.y);
                } else {
                  window.scrollTo(0, 0);
                }
                break;
            }
          }};
        module.exports = ImitateBrowserBehavior;
      }, {"../actions/LocationActions": 1}],
      3: [function(_dereq_, module, exports) {
        var ScrollToTopBehavior = {updateScrollPosition: function() {
            window.scrollTo(0, 0);
          }};
        module.exports = ScrollToTopBehavior;
      }, {}],
      4: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var FakeNode = _dereq_('../mixins/FakeNode');
        var PropTypes = _dereq_('../utils/PropTypes');
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
      }, {
        "../mixins/FakeNode": 14,
        "../utils/PropTypes": 25
      }],
      5: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var classSet = _dereq_('react/lib/cx');
        var assign = _dereq_('react/lib/Object.assign');
        var Navigation = _dereq_('../mixins/Navigation');
        var State = _dereq_('../mixins/State');
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
      }, {
        "../mixins/Navigation": 15,
        "../mixins/State": 19,
        "react/lib/Object.assign": 40,
        "react/lib/cx": 41
      }],
      6: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var FakeNode = _dereq_('../mixins/FakeNode');
        var PropTypes = _dereq_('../utils/PropTypes');
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
      }, {
        "../mixins/FakeNode": 14,
        "../utils/PropTypes": 25
      }],
      7: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var FakeNode = _dereq_('../mixins/FakeNode');
        var PropTypes = _dereq_('../utils/PropTypes');
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
      }, {
        "../mixins/FakeNode": 14,
        "../utils/PropTypes": 25
      }],
      8: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var FakeNode = _dereq_('../mixins/FakeNode');
        var Route = React.createClass({
          displayName: 'Route',
          mixins: [FakeNode],
          propTypes: {
            name: React.PropTypes.string,
            path: React.PropTypes.string,
            handler: React.PropTypes.func.isRequired,
            ignoreScrollBehavior: React.PropTypes.bool
          }
        });
        module.exports = Route;
      }, {"../mixins/FakeNode": 14}],
      9: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var RouteHandlerMixin = _dereq_('../mixins/RouteHandler');
        var RouteHandler = React.createClass({
          displayName: 'RouteHandler',
          mixins: [RouteHandlerMixin],
          getDefaultProps: function() {
            return {ref: '__routeHandler__'};
          },
          render: function() {
            return this.getRouteHandler();
          }
        });
        module.exports = RouteHandler;
      }, {"../mixins/RouteHandler": 17}],
      10: [function(_dereq_, module, exports) {
        exports.DefaultRoute = _dereq_('./components/DefaultRoute');
        exports.Link = _dereq_('./components/Link');
        exports.NotFoundRoute = _dereq_('./components/NotFoundRoute');
        exports.Redirect = _dereq_('./components/Redirect');
        exports.Route = _dereq_('./components/Route');
        exports.RouteHandler = _dereq_('./components/RouteHandler');
        exports.HashLocation = _dereq_('./locations/HashLocation');
        exports.HistoryLocation = _dereq_('./locations/HistoryLocation');
        exports.RefreshLocation = _dereq_('./locations/RefreshLocation');
        exports.ImitateBrowserBehavior = _dereq_('./behaviors/ImitateBrowserBehavior');
        exports.ScrollToTopBehavior = _dereq_('./behaviors/ScrollToTopBehavior');
        exports.Navigation = _dereq_('./mixins/Navigation');
        exports.State = _dereq_('./mixins/State');
        exports.create = _dereq_('./utils/createRouter');
        exports.run = _dereq_('./utils/runRouter');
        exports.History = _dereq_('./utils/History');
      }, {
        "./behaviors/ImitateBrowserBehavior": 2,
        "./behaviors/ScrollToTopBehavior": 3,
        "./components/DefaultRoute": 4,
        "./components/Link": 5,
        "./components/NotFoundRoute": 6,
        "./components/Redirect": 7,
        "./components/Route": 8,
        "./components/RouteHandler": 9,
        "./locations/HashLocation": 11,
        "./locations/HistoryLocation": 12,
        "./locations/RefreshLocation": 13,
        "./mixins/Navigation": 15,
        "./mixins/State": 19,
        "./utils/History": 22,
        "./utils/createRouter": 28,
        "./utils/runRouter": 32
      }],
      11: [function(_dereq_, module, exports) {
        var LocationActions = _dereq_('../actions/LocationActions');
        var History = _dereq_('../utils/History');
        var Path = _dereq_('../utils/Path');
        function getHashPath() {
          return Path.decode(window.location.href.split('#')[1] || '');
        }
        var _actionType;
        function ensureSlash() {
          var path = getHashPath();
          if (path.charAt(0) === '/')
            return true;
          HashLocation.replace('/' + path);
          return false;
        }
        var _changeListeners = [];
        function notifyChange(type) {
          if (type === LocationActions.PUSH)
            History.length += 1;
          var change = {
            path: getHashPath(),
            type: type
          };
          _changeListeners.forEach(function(listener) {
            listener(change);
          });
        }
        var _isListening = false;
        function onHashChange() {
          if (ensureSlash()) {
            notifyChange(_actionType || LocationActions.POP);
            _actionType = null;
          }
        }
        var HashLocation = {
          addChangeListener: function(listener) {
            _changeListeners.push(listener);
            ensureSlash();
            if (_isListening)
              return ;
            if (window.addEventListener) {
              window.addEventListener('hashchange', onHashChange, false);
            } else {
              window.attachEvent('onhashchange', onHashChange);
            }
            _isListening = true;
          },
          removeChangeListener: function(listener) {
            for (var i = 0,
                l = _changeListeners.length; i < l; i++) {
              if (_changeListeners[i] === listener) {
                _changeListeners.splice(i, 1);
                break;
              }
            }
            if (window.removeEventListener) {
              window.removeEventListener('hashchange', onHashChange, false);
            } else {
              window.removeEvent('onhashchange', onHashChange);
            }
            if (_changeListeners.length === 0)
              _isListening = false;
          },
          push: function(path) {
            _actionType = LocationActions.PUSH;
            window.location.hash = Path.encode(path);
          },
          replace: function(path) {
            _actionType = LocationActions.REPLACE;
            window.location.replace(window.location.pathname + '#' + Path.encode(path));
          },
          pop: function() {
            _actionType = LocationActions.POP;
            History.back();
          },
          getCurrentPath: getHashPath,
          toString: function() {
            return '<HashLocation>';
          }
        };
        module.exports = HashLocation;
      }, {
        "../actions/LocationActions": 1,
        "../utils/History": 22,
        "../utils/Path": 23
      }],
      12: [function(_dereq_, module, exports) {
        var LocationActions = _dereq_('../actions/LocationActions');
        var History = _dereq_('../utils/History');
        var Path = _dereq_('../utils/Path');
        function getWindowPath() {
          return Path.decode(window.location.pathname + window.location.search);
        }
        var _changeListeners = [];
        function notifyChange(type) {
          var change = {
            path: getWindowPath(),
            type: type
          };
          _changeListeners.forEach(function(listener) {
            listener(change);
          });
        }
        var _isListening = false;
        function onPopState() {
          notifyChange(LocationActions.POP);
        }
        var HistoryLocation = {
          addChangeListener: function(listener) {
            _changeListeners.push(listener);
            if (_isListening)
              return ;
            if (window.addEventListener) {
              window.addEventListener('popstate', onPopState, false);
            } else {
              window.attachEvent('popstate', onPopState);
            }
            _isListening = true;
          },
          removeChangeListener: function(listener) {
            for (var i = 0,
                l = _changeListeners.length; i < l; i++) {
              if (_changeListeners[i] === listener) {
                _changeListeners.splice(i, 1);
                break;
              }
            }
            if (window.addEventListener) {
              window.removeEventListener('popstate', onPopState);
            } else {
              window.removeEvent('popstate', onPopState);
            }
            if (_changeListeners.length === 0)
              _isListening = false;
          },
          push: function(path) {
            window.history.pushState({path: path}, '', Path.encode(path));
            History.length += 1;
            notifyChange(LocationActions.PUSH);
          },
          replace: function(path) {
            window.history.replaceState({path: path}, '', Path.encode(path));
            notifyChange(LocationActions.REPLACE);
          },
          pop: History.back,
          getCurrentPath: getWindowPath,
          toString: function() {
            return '<HistoryLocation>';
          }
        };
        module.exports = HistoryLocation;
      }, {
        "../actions/LocationActions": 1,
        "../utils/History": 22,
        "../utils/Path": 23
      }],
      13: [function(_dereq_, module, exports) {
        var HistoryLocation = _dereq_('./HistoryLocation');
        var History = _dereq_('../utils/History');
        var Path = _dereq_('../utils/Path');
        var RefreshLocation = {
          push: function(path) {
            window.location = Path.encode(path);
          },
          replace: function(path) {
            window.location.replace(Path.encode(path));
          },
          pop: History.back,
          getCurrentPath: HistoryLocation.getCurrentPath,
          toString: function() {
            return '<RefreshLocation>';
          }
        };
        module.exports = RefreshLocation;
      }, {
        "../utils/History": 22,
        "../utils/Path": 23,
        "./HistoryLocation": 12
      }],
      14: [function(_dereq_, module, exports) {
        var invariant = _dereq_('react/lib/invariant');
        var FakeNode = {render: function() {
            invariant(false, '%s elements should not be rendered', this.constructor.displayName);
          }};
        module.exports = FakeNode;
      }, {"react/lib/invariant": 43}],
      15: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var Navigation = {
          contextTypes: {
            makePath: React.PropTypes.func.isRequired,
            makeHref: React.PropTypes.func.isRequired,
            transitionTo: React.PropTypes.func.isRequired,
            replaceWith: React.PropTypes.func.isRequired,
            goBack: React.PropTypes.func.isRequired
          },
          makePath: function(to, params, query) {
            return this.context.makePath(to, params, query);
          },
          makeHref: function(to, params, query) {
            return this.context.makeHref(to, params, query);
          },
          transitionTo: function(to, params, query) {
            this.context.transitionTo(to, params, query);
          },
          replaceWith: function(to, params, query) {
            this.context.replaceWith(to, params, query);
          },
          goBack: function() {
            this.context.goBack();
          }
        };
        module.exports = Navigation;
      }, {}],
      16: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var NavigationContext = {
          childContextTypes: {
            makePath: React.PropTypes.func.isRequired,
            makeHref: React.PropTypes.func.isRequired,
            transitionTo: React.PropTypes.func.isRequired,
            replaceWith: React.PropTypes.func.isRequired,
            goBack: React.PropTypes.func.isRequired
          },
          getChildContext: function() {
            return {
              makePath: this.constructor.makePath,
              makeHref: this.constructor.makeHref,
              transitionTo: this.constructor.transitionTo,
              replaceWith: this.constructor.replaceWith,
              goBack: this.constructor.goBack
            };
          }
        };
        module.exports = NavigationContext;
      }, {}],
      17: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        module.exports = {
          contextTypes: {
            getRouteAtDepth: React.PropTypes.func.isRequired,
            getRouteComponents: React.PropTypes.func.isRequired,
            routeHandlers: React.PropTypes.array.isRequired
          },
          childContextTypes: {routeHandlers: React.PropTypes.array.isRequired},
          getChildContext: function() {
            return {routeHandlers: this.context.routeHandlers.concat([this])};
          },
          getRouteDepth: function() {
            return this.context.routeHandlers.length - 1;
          },
          componentDidMount: function() {
            this._updateRouteComponent();
          },
          componentDidUpdate: function() {
            this._updateRouteComponent();
          },
          _updateRouteComponent: function() {
            var depth = this.getRouteDepth();
            var components = this.context.getRouteComponents();
            components[depth] = this.refs[this.props.ref || '__routeHandler__'];
          },
          getRouteHandler: function(props) {
            var route = this.context.getRouteAtDepth(this.getRouteDepth());
            return route ? React.createElement(route.handler, props || this.props) : null;
          }
        };
      }, {}],
      18: [function(_dereq_, module, exports) {
        var invariant = _dereq_('react/lib/invariant');
        var canUseDOM = _dereq_('react/lib/ExecutionEnvironment').canUseDOM;
        var getWindowScrollPosition = _dereq_('../utils/getWindowScrollPosition');
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
      }, {
        "../utils/getWindowScrollPosition": 30,
        "react/lib/ExecutionEnvironment": 39,
        "react/lib/invariant": 43
      }],
      19: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var State = {
          contextTypes: {
            getCurrentPath: React.PropTypes.func.isRequired,
            getCurrentRoutes: React.PropTypes.func.isRequired,
            getCurrentPathname: React.PropTypes.func.isRequired,
            getCurrentParams: React.PropTypes.func.isRequired,
            getCurrentQuery: React.PropTypes.func.isRequired,
            isActive: React.PropTypes.func.isRequired
          },
          getPath: function() {
            return this.context.getCurrentPath();
          },
          getRoutes: function() {
            return this.context.getCurrentRoutes();
          },
          getPathname: function() {
            return this.context.getCurrentPathname();
          },
          getParams: function() {
            return this.context.getCurrentParams();
          },
          getQuery: function() {
            return this.context.getCurrentQuery();
          },
          isActive: function(to, params, query) {
            return this.context.isActive(to, params, query);
          }
        };
        module.exports = State;
      }, {}],
      20: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var assign = _dereq_('react/lib/Object.assign');
        var Path = _dereq_('../utils/Path');
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
      }, {
        "../utils/Path": 23,
        "react/lib/Object.assign": 40
      }],
      21: [function(_dereq_, module, exports) {
        function Cancellation() {}
        module.exports = Cancellation;
      }, {}],
      22: [function(_dereq_, module, exports) {
        var invariant = _dereq_('react/lib/invariant');
        var canUseDOM = _dereq_('react/lib/ExecutionEnvironment').canUseDOM;
        var History = {
          back: function() {
            invariant(canUseDOM, 'Cannot use History.back without a DOM');
            History.length -= 1;
            window.history.back();
          },
          length: 1
        };
        module.exports = History;
      }, {
        "react/lib/ExecutionEnvironment": 39,
        "react/lib/invariant": 43
      }],
      23: [function(_dereq_, module, exports) {
        var invariant = _dereq_('react/lib/invariant');
        var merge = _dereq_('qs/lib/utils').merge;
        var qs = _dereq_('qs');
        var paramCompileMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$]*)|[*.()\[\]\\+|{}^$]/g;
        var paramInjectMatcher = /:([a-zA-Z_$][a-zA-Z0-9_$?]*[?]?)|[*]/g;
        var paramInjectTrailingSlashMatcher = /\/\/\?|\/\?/g;
        var queryMatcher = /\?(.+)/;
        var _compiledPatterns = {};
        function compilePattern(pattern) {
          if (!(pattern in _compiledPatterns)) {
            var paramNames = [];
            var source = pattern.replace(paramCompileMatcher, function(match, paramName) {
              if (paramName) {
                paramNames.push(paramName);
                return '([^/?#]+)';
              } else if (match === '*') {
                paramNames.push('splat');
                return '(.*?)';
              } else {
                return '\\' + match;
              }
            });
            _compiledPatterns[pattern] = {
              matcher: new RegExp('^' + source + '$', 'i'),
              paramNames: paramNames
            };
          }
          return _compiledPatterns[pattern];
        }
        var Path = {
          decode: function(path) {
            return decodeURI(path.replace(/\+/g, ' '));
          },
          encode: function(path) {
            return encodeURI(path).replace(/%20/g, '+');
          },
          extractParamNames: function(pattern) {
            return compilePattern(pattern).paramNames;
          },
          extractParams: function(pattern, path) {
            var object = compilePattern(pattern);
            var match = path.match(object.matcher);
            if (!match)
              return null;
            var params = {};
            object.paramNames.forEach(function(paramName, index) {
              params[paramName] = match[index + 1];
            });
            return params;
          },
          injectParams: function(pattern, params) {
            params = params || {};
            var splatIndex = 0;
            return pattern.replace(paramInjectMatcher, function(match, paramName) {
              paramName = paramName || 'splat';
              if (paramName.slice(-1) !== '?') {
                invariant(params[paramName] != null, 'Missing "' + paramName + '" parameter for path "' + pattern + '"');
              } else {
                paramName = paramName.slice(0, -1);
                if (params[paramName] == null)
                  return '';
              }
              var segment;
              if (paramName === 'splat' && Array.isArray(params[paramName])) {
                segment = params[paramName][splatIndex++];
                invariant(segment != null, 'Missing splat # ' + splatIndex + ' for path "' + pattern + '"');
              } else {
                segment = params[paramName];
              }
              return segment;
            }).replace(paramInjectTrailingSlashMatcher, '/');
          },
          extractQuery: function(path) {
            var match = path.match(queryMatcher);
            return match && qs.parse(match[1]);
          },
          withoutQuery: function(path) {
            return path.replace(queryMatcher, '');
          },
          withQuery: function(path, query) {
            var existingQuery = Path.extractQuery(path);
            if (existingQuery)
              query = query ? merge(existingQuery, query) : existingQuery;
            var queryString = query && qs.stringify(query);
            if (queryString)
              return Path.withoutQuery(path) + '?' + queryString;
            return path;
          },
          isAbsolute: function(path) {
            return path.charAt(0) === '/';
          },
          normalize: function(path, parentRoute) {
            return path.replace(/^\/*/, '/');
          },
          join: function(a, b) {
            return a.replace(/\/*$/, '/') + b;
          }
        };
        module.exports = Path;
      }, {
        "qs": 34,
        "qs/lib/utils": 38,
        "react/lib/invariant": 43
      }],
      24: [function(_dereq_, module, exports) {
        var Promise = _dereq_('when/lib/Promise');
        module.exports = Promise;
      }, {"when/lib/Promise": 45}],
      25: [function(_dereq_, module, exports) {
        var PropTypes = {falsy: function(props, propName, componentName) {
            if (props[propName])
              return new Error('<' + componentName + '> may not have a "' + propName + '" prop');
          }};
        module.exports = PropTypes;
      }, {}],
      26: [function(_dereq_, module, exports) {
        function Redirect(to, params, query) {
          this.to = to;
          this.params = params;
          this.query = query;
        }
        module.exports = Redirect;
      }, {}],
      27: [function(_dereq_, module, exports) {
        var assign = _dereq_('react/lib/Object.assign');
        var reversedArray = _dereq_('./reversedArray');
        var Redirect = _dereq_('./Redirect');
        var Promise = _dereq_('./Promise');
        function runHooks(hooks, callback) {
          var promise;
          try {
            promise = hooks.reduce(function(promise, hook) {
              return promise ? promise.then(hook) : hook();
            }, null);
          } catch (error) {
            return callback(error);
          }
          if (promise) {
            promise.then(function() {
              setTimeout(callback);
            }, function(error) {
              setTimeout(function() {
                callback(error);
              });
            });
          } else {
            callback();
          }
        }
        function runTransitionFromHooks(transition, routes, components, callback) {
          components = reversedArray(components);
          var hooks = reversedArray(routes).map(function(route, index) {
            return function() {
              var handler = route.handler;
              if (!transition.isAborted && handler.willTransitionFrom)
                return handler.willTransitionFrom(transition, components[index]);
              var promise = transition._promise;
              transition._promise = null;
              return promise;
            };
          });
          runHooks(hooks, callback);
        }
        function runTransitionToHooks(transition, routes, params, query, callback) {
          var hooks = routes.map(function(route) {
            return function() {
              var handler = route.handler;
              if (!transition.isAborted && handler.willTransitionTo)
                handler.willTransitionTo(transition, params, query);
              var promise = transition._promise;
              transition._promise = null;
              return promise;
            };
          });
          runHooks(hooks, callback);
        }
        function Transition(path, retry) {
          this.path = path;
          this.abortReason = null;
          this.isAborted = false;
          this.retry = retry.bind(this);
          this._promise = null;
        }
        assign(Transition.prototype, {
          abort: function(reason) {
            if (this.isAborted) {
              return ;
            }
            this.abortReason = reason;
            this.isAborted = true;
          },
          redirect: function(to, params, query) {
            this.abort(new Redirect(to, params, query));
          },
          wait: function(value) {
            this._promise = Promise.resolve(value);
          },
          from: function(routes, components, callback) {
            return runTransitionFromHooks(this, routes, components, callback);
          },
          to: function(routes, params, query, callback) {
            return runTransitionToHooks(this, routes, params, query, callback);
          }
        });
        module.exports = Transition;
      }, {
        "./Promise": 24,
        "./Redirect": 26,
        "./reversedArray": 31,
        "react/lib/Object.assign": 40
      }],
      28: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var warning = _dereq_('react/lib/warning');
        var invariant = _dereq_('react/lib/invariant');
        var canUseDOM = _dereq_('react/lib/ExecutionEnvironment').canUseDOM;
        var ImitateBrowserBehavior = _dereq_('../behaviors/ImitateBrowserBehavior');
        var RouteHandler = _dereq_('../components/RouteHandler');
        var LocationActions = _dereq_('../actions/LocationActions');
        var HashLocation = _dereq_('../locations/HashLocation');
        var HistoryLocation = _dereq_('../locations/HistoryLocation');
        var RefreshLocation = _dereq_('../locations/RefreshLocation');
        var NavigationContext = _dereq_('../mixins/NavigationContext');
        var StateContext = _dereq_('../mixins/StateContext');
        var Scrolling = _dereq_('../mixins/Scrolling');
        var createRoutesFromChildren = _dereq_('./createRoutesFromChildren');
        var supportsHistory = _dereq_('./supportsHistory');
        var Transition = _dereq_('./Transition');
        var PropTypes = _dereq_('./PropTypes');
        var Redirect = _dereq_('./Redirect');
        var History = _dereq_('./History');
        var Cancellation = _dereq_('./Cancellation');
        var Path = _dereq_('./Path');
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
            warning(!canUseDOM || "production" === 'test', 'You should not use a static location in a DOM environment because ' + 'the router will not be kept in sync with the current URL');
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
      }, {
        "../actions/LocationActions": 1,
        "../behaviors/ImitateBrowserBehavior": 2,
        "../components/RouteHandler": 9,
        "../locations/HashLocation": 11,
        "../locations/HistoryLocation": 12,
        "../locations/RefreshLocation": 13,
        "../mixins/NavigationContext": 16,
        "../mixins/Scrolling": 18,
        "../mixins/StateContext": 20,
        "./Cancellation": 21,
        "./History": 22,
        "./Path": 23,
        "./PropTypes": 25,
        "./Redirect": 26,
        "./Transition": 27,
        "./createRoutesFromChildren": 29,
        "./supportsHistory": 33,
        "react/lib/ExecutionEnvironment": 39,
        "react/lib/invariant": 43,
        "react/lib/warning": 44
      }],
      29: [function(_dereq_, module, exports) {
        var React = (typeof window !== "undefined" ? window.React : typeof global !== "undefined" ? global.React : null);
        var warning = _dereq_('react/lib/warning');
        var invariant = _dereq_('react/lib/invariant');
        var DefaultRoute = _dereq_('../components/DefaultRoute');
        var NotFoundRoute = _dereq_('../components/NotFoundRoute');
        var Redirect = _dereq_('../components/Redirect');
        var Route = _dereq_('../components/Route');
        var Path = _dereq_('./Path');
        var CONFIG_ELEMENT_TYPES = [DefaultRoute.type, NotFoundRoute.type, Redirect.type, Route.type];
        function createRedirectHandler(to, _params, _query) {
          return React.createClass({
            statics: {willTransitionTo: function(transition, params, query) {
                transition.redirect(to, _params || params, _query || query);
              }},
            render: function() {
              return null;
            }
          });
        }
        function checkPropTypes(componentName, propTypes, props) {
          for (var propName in propTypes) {
            if (propTypes.hasOwnProperty(propName)) {
              var error = propTypes[propName](props, propName, componentName);
              if (error instanceof Error)
                warning(false, error.message);
            }
          }
        }
        function createRoute(element, parentRoute, namedRoutes) {
          var type = element.type;
          var props = element.props;
          var componentName = (type && type.displayName) || 'UnknownComponent';
          invariant(CONFIG_ELEMENT_TYPES.indexOf(type) !== -1, 'Unrecognized route configuration element "<%s>"', componentName);
          if (type.propTypes)
            checkPropTypes(componentName, type.propTypes, props);
          var route = {name: props.name};
          if (props.ignoreScrollBehavior) {
            route.ignoreScrollBehavior = true;
          }
          if (type === Redirect.type) {
            route.handler = createRedirectHandler(props.to, props.params, props.query);
            props.path = props.path || props.from || '*';
          } else {
            route.handler = props.handler;
          }
          var parentPath = (parentRoute && parentRoute.path) || '/';
          if ((props.path || props.name) && type !== DefaultRoute.type && type !== NotFoundRoute.type) {
            var path = props.path || props.name;
            if (!Path.isAbsolute(path))
              path = Path.join(parentPath, path);
            route.path = Path.normalize(path);
          } else {
            route.path = parentPath;
            if (type === NotFoundRoute.type)
              route.path += '*';
          }
          route.paramNames = Path.extractParamNames(route.path);
          if (parentRoute && Array.isArray(parentRoute.paramNames)) {
            parentRoute.paramNames.forEach(function(paramName) {
              invariant(route.paramNames.indexOf(paramName) !== -1, 'The nested route path "%s" is missing the "%s" parameter of its parent path "%s"', route.path, paramName, parentRoute.path);
            });
          }
          if (props.name) {
            invariant(namedRoutes[props.name] == null, 'You cannot use the name "%s" for more than one route', props.name);
            namedRoutes[props.name] = route;
          }
          if (type === NotFoundRoute.type) {
            invariant(parentRoute, '<NotFoundRoute> must have a parent <Route>');
            invariant(parentRoute.notFoundRoute == null, 'You may not have more than one <NotFoundRoute> per <Route>');
            parentRoute.notFoundRoute = route;
            return null;
          }
          if (type === DefaultRoute.type) {
            invariant(parentRoute, '<DefaultRoute> must have a parent <Route>');
            invariant(parentRoute.defaultRoute == null, 'You may not have more than one <DefaultRoute> per <Route>');
            parentRoute.defaultRoute = route;
            return null;
          }
          route.childRoutes = createRoutesFromChildren(props.children, route, namedRoutes);
          return route;
        }
        function createRoutesFromChildren(children, parentRoute, namedRoutes) {
          var routes = [];
          React.Children.forEach(children, function(child) {
            if (child = createRoute(child, parentRoute, namedRoutes))
              routes.push(child);
          });
          return routes;
        }
        module.exports = createRoutesFromChildren;
      }, {
        "../components/DefaultRoute": 4,
        "../components/NotFoundRoute": 6,
        "../components/Redirect": 7,
        "../components/Route": 8,
        "./Path": 23,
        "react/lib/invariant": 43,
        "react/lib/warning": 44
      }],
      30: [function(_dereq_, module, exports) {
        var invariant = _dereq_('react/lib/invariant');
        var canUseDOM = _dereq_('react/lib/ExecutionEnvironment').canUseDOM;
        function getWindowScrollPosition() {
          invariant(canUseDOM, 'Cannot get current scroll position without a DOM');
          return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
          };
        }
        module.exports = getWindowScrollPosition;
      }, {
        "react/lib/ExecutionEnvironment": 39,
        "react/lib/invariant": 43
      }],
      31: [function(_dereq_, module, exports) {
        function reversedArray(array) {
          return array.slice(0).reverse();
        }
        module.exports = reversedArray;
      }, {}],
      32: [function(_dereq_, module, exports) {
        var createRouter = _dereq_('./createRouter');
        function runRouter(routes, location, callback) {
          if (typeof location === 'function') {
            callback = location;
            location = null;
          }
          var router = createRouter({
            routes: routes,
            location: location
          });
          router.run(callback);
          return router;
        }
        module.exports = runRouter;
      }, {"./createRouter": 28}],
      33: [function(_dereq_, module, exports) {
        function supportsHistory() {
          var ua = navigator.userAgent;
          if ((ua.indexOf('Android 2.') !== -1 || (ua.indexOf('Android 4.0') !== -1)) && ua.indexOf('Mobile Safari') !== -1 && ua.indexOf('Chrome') === -1 && ua.indexOf('Windows Phone') === -1) {
            return false;
          }
          return (window.history && 'pushState' in window.history);
        }
        module.exports = supportsHistory;
      }, {}],
      34: [function(_dereq_, module, exports) {
        module.exports = _dereq_('./lib');
      }, {"./lib": 35}],
      35: [function(_dereq_, module, exports) {
        var Stringify = _dereq_('./stringify');
        var Parse = _dereq_('./parse');
        var internals = {};
        module.exports = {
          stringify: Stringify,
          parse: Parse
        };
      }, {
        "./parse": 36,
        "./stringify": 37
      }],
      36: [function(_dereq_, module, exports) {
        var Utils = _dereq_('./utils');
        var internals = {
          delimiter: '&',
          depth: 5,
          arrayLimit: 20,
          parameterLimit: 1000
        };
        internals.parseValues = function(str, options) {
          var obj = {};
          var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);
          for (var i = 0,
              il = parts.length; i < il; ++i) {
            var part = parts[i];
            var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;
            if (pos === -1) {
              obj[Utils.decode(part)] = '';
            } else {
              var key = Utils.decode(part.slice(0, pos));
              var val = Utils.decode(part.slice(pos + 1));
              if (!obj[key]) {
                obj[key] = val;
              } else {
                obj[key] = [].concat(obj[key]).concat(val);
              }
            }
          }
          return obj;
        };
        internals.parseObject = function(chain, val, options) {
          if (!chain.length) {
            return val;
          }
          var root = chain.shift();
          var obj = {};
          if (root === '[]') {
            obj = [];
            obj = obj.concat(internals.parseObject(chain, val, options));
          } else {
            var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
            var index = parseInt(cleanRoot, 10);
            if (!isNaN(index) && root !== cleanRoot && index <= options.arrayLimit) {
              obj = [];
              obj[index] = internals.parseObject(chain, val, options);
            } else {
              obj[cleanRoot] = internals.parseObject(chain, val, options);
            }
          }
          return obj;
        };
        internals.parseKeys = function(key, val, options) {
          if (!key) {
            return ;
          }
          var parent = /^([^\[\]]*)/;
          var child = /(\[[^\[\]]*\])/g;
          var segment = parent.exec(key);
          if (Object.prototype.hasOwnProperty(segment[1])) {
            return ;
          }
          var keys = [];
          if (segment[1]) {
            keys.push(segment[1]);
          }
          var i = 0;
          while ((segment = child.exec(key)) !== null && i < options.depth) {
            ++i;
            if (!Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {
              keys.push(segment[1]);
            }
          }
          if (segment) {
            keys.push('[' + key.slice(segment.index) + ']');
          }
          return internals.parseObject(keys, val, options);
        };
        module.exports = function(str, options) {
          if (str === '' || str === null || typeof str === 'undefined') {
            return {};
          }
          options = options || {};
          options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
          options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
          options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
          options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
          var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
          var obj = {};
          var keys = Object.keys(tempObj);
          for (var i = 0,
              il = keys.length; i < il; ++i) {
            var key = keys[i];
            var newObj = internals.parseKeys(key, tempObj[key], options);
            obj = Utils.merge(obj, newObj);
          }
          return Utils.compact(obj);
        };
      }, {"./utils": 38}],
      37: [function(_dereq_, module, exports) {
        var Utils = _dereq_('./utils');
        var internals = {delimiter: '&'};
        internals.stringify = function(obj, prefix) {
          if (Utils.isBuffer(obj)) {
            obj = obj.toString();
          } else if (obj instanceof Date) {
            obj = obj.toISOString();
          } else if (obj === null) {
            obj = '';
          }
          if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
            return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
          }
          var values = [];
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']'));
            }
          }
          return values;
        };
        module.exports = function(obj, options) {
          options = options || {};
          var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
          var keys = [];
          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              keys = keys.concat(internals.stringify(obj[key], key));
            }
          }
          return keys.join(delimiter);
        };
      }, {"./utils": 38}],
      38: [function(_dereq_, module, exports) {
        var internals = {};
        exports.arrayToObject = function(source) {
          var obj = {};
          for (var i = 0,
              il = source.length; i < il; ++i) {
            if (typeof source[i] !== 'undefined') {
              obj[i] = source[i];
            }
          }
          return obj;
        };
        exports.merge = function(target, source) {
          if (!source) {
            return target;
          }
          if (Array.isArray(source)) {
            for (var i = 0,
                il = source.length; i < il; ++i) {
              if (typeof source[i] !== 'undefined') {
                if (typeof target[i] === 'object') {
                  target[i] = exports.merge(target[i], source[i]);
                } else {
                  target[i] = source[i];
                }
              }
            }
            return target;
          }
          if (Array.isArray(target)) {
            if (typeof source !== 'object') {
              target.push(source);
              return target;
            } else {
              target = exports.arrayToObject(target);
            }
          }
          var keys = Object.keys(source);
          for (var k = 0,
              kl = keys.length; k < kl; ++k) {
            var key = keys[k];
            var value = source[key];
            if (value && typeof value === 'object') {
              if (!target[key]) {
                target[key] = value;
              } else {
                target[key] = exports.merge(target[key], value);
              }
            } else {
              target[key] = value;
            }
          }
          return target;
        };
        exports.decode = function(str) {
          try {
            return decodeURIComponent(str.replace(/\+/g, ' '));
          } catch (e) {
            return str;
          }
        };
        exports.compact = function(obj, refs) {
          if (typeof obj !== 'object' || obj === null) {
            return obj;
          }
          refs = refs || [];
          var lookup = refs.indexOf(obj);
          if (lookup !== -1) {
            return refs[lookup];
          }
          refs.push(obj);
          if (Array.isArray(obj)) {
            var compacted = [];
            for (var i = 0,
                l = obj.length; i < l; ++i) {
              if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
              }
            }
            return compacted;
          }
          var keys = Object.keys(obj);
          for (var i = 0,
              il = keys.length; i < il; ++i) {
            var key = keys[i];
            obj[key] = exports.compact(obj[key], refs);
          }
          return obj;
        };
        exports.isRegExp = function(obj) {
          return Object.prototype.toString.call(obj) === '[object RegExp]';
        };
        exports.isBuffer = function(obj) {
          if (typeof Buffer !== 'undefined') {
            return Buffer.isBuffer(obj);
          } else {
            return false;
          }
        };
      }, {}],
      39: [function(_dereq_, module, exports) {
        "use strict";
        var canUseDOM = !!(typeof window !== 'undefined' && window.document && window.document.createElement);
        var ExecutionEnvironment = {
          canUseDOM: canUseDOM,
          canUseWorkers: typeof Worker !== 'undefined',
          canUseEventListeners: canUseDOM && !!(window.addEventListener || window.attachEvent),
          canUseViewport: canUseDOM && !!window.screen,
          isInWorker: !canUseDOM
        };
        module.exports = ExecutionEnvironment;
      }, {}],
      40: [function(_dereq_, module, exports) {
        function assign(target, sources) {
          if (target == null) {
            throw new TypeError('Object.assign target cannot be null or undefined');
          }
          var to = Object(target);
          var hasOwnProperty = Object.prototype.hasOwnProperty;
          for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
            var nextSource = arguments[nextIndex];
            if (nextSource == null) {
              continue;
            }
            var from = Object(nextSource);
            for (var key in from) {
              if (hasOwnProperty.call(from, key)) {
                to[key] = from[key];
              }
            }
          }
          return to;
        }
        ;
        module.exports = assign;
      }, {}],
      41: [function(_dereq_, module, exports) {
        function cx(classNames) {
          if (typeof classNames == 'object') {
            return Object.keys(classNames).filter(function(className) {
              return classNames[className];
            }).join(' ');
          } else {
            return Array.prototype.join.call(arguments, ' ');
          }
        }
        module.exports = cx;
      }, {}],
      42: [function(_dereq_, module, exports) {
        function makeEmptyFunction(arg) {
          return function() {
            return arg;
          };
        }
        function emptyFunction() {}
        emptyFunction.thatReturns = makeEmptyFunction;
        emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
        emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
        emptyFunction.thatReturnsNull = makeEmptyFunction(null);
        emptyFunction.thatReturnsThis = function() {
          return this;
        };
        emptyFunction.thatReturnsArgument = function(arg) {
          return arg;
        };
        module.exports = emptyFunction;
      }, {}],
      43: [function(_dereq_, module, exports) {
        "use strict";
        var invariant = function(condition, format, a, b, c, d, e, f) {
          if ("production" !== "production") {
            if (format === undefined) {
              throw new Error('invariant requires an error message argument');
            }
          }
          if (!condition) {
            var error;
            if (format === undefined) {
              error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
            } else {
              var args = [a, b, c, d, e, f];
              var argIndex = 0;
              error = new Error('Invariant Violation: ' + format.replace(/%s/g, function() {
                return args[argIndex++];
              }));
            }
            error.framesToPop = 1;
            throw error;
          }
        };
        module.exports = invariant;
      }, {}],
      44: [function(_dereq_, module, exports) {
        "use strict";
        var emptyFunction = _dereq_("./emptyFunction");
        var warning = emptyFunction;
        if ("production" !== "production") {
          warning = function(condition, format) {
            for (var args = [],
                $__0 = 2,
                $__1 = arguments.length; $__0 < $__1; $__0++)
              args.push(arguments[$__0]);
            if (format === undefined) {
              throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
            }
            if (!condition) {
              var argIndex = 0;
              console.warn('Warning: ' + format.replace(/%s/g, function() {
                return args[argIndex++];
              }));
            }
          };
        }
        module.exports = warning;
      }, {"./emptyFunction": 42}],
      45: [function(_dereq_, module, exports) {
        (function(define) {
          'use strict';
          define(function(_dereq_) {
            var makePromise = _dereq_('./makePromise');
            var Scheduler = _dereq_('./Scheduler');
            var async = _dereq_('./async');
            return makePromise({scheduler: new Scheduler(async)});
          });
        })(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(_dereq_);
        });
      }, {
        "./Scheduler": 47,
        "./async": 48,
        "./makePromise": 49
      }],
      46: [function(_dereq_, module, exports) {
        (function(define) {
          'use strict';
          define(function() {
            function Queue(capacityPow2) {
              this.head = this.tail = this.length = 0;
              this.buffer = new Array(1 << capacityPow2);
            }
            Queue.prototype.push = function(x) {
              if (this.length === this.buffer.length) {
                this._ensureCapacity(this.length * 2);
              }
              this.buffer[this.tail] = x;
              this.tail = (this.tail + 1) & (this.buffer.length - 1);
              ++this.length;
              return this.length;
            };
            Queue.prototype.shift = function() {
              var x = this.buffer[this.head];
              this.buffer[this.head] = void 0;
              this.head = (this.head + 1) & (this.buffer.length - 1);
              --this.length;
              return x;
            };
            Queue.prototype._ensureCapacity = function(capacity) {
              var head = this.head;
              var buffer = this.buffer;
              var newBuffer = new Array(capacity);
              var i = 0;
              var len;
              if (head === 0) {
                len = this.length;
                for (; i < len; ++i) {
                  newBuffer[i] = buffer[i];
                }
              } else {
                capacity = buffer.length;
                len = this.tail;
                for (; head < capacity; ++i, ++head) {
                  newBuffer[i] = buffer[head];
                }
                for (head = 0; head < len; ++i, ++head) {
                  newBuffer[i] = buffer[head];
                }
              }
              this.buffer = newBuffer;
              this.head = 0;
              this.tail = this.length;
            };
            return Queue;
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory();
        }));
      }, {}],
      47: [function(_dereq_, module, exports) {
        (function(define) {
          'use strict';
          define(function(_dereq_) {
            var Queue = _dereq_('./Queue');
            function Scheduler(async) {
              this._async = async;
              this._queue = new Queue(15);
              this._afterQueue = new Queue(5);
              this._running = false;
              var self = this;
              this.drain = function() {
                self._drain();
              };
            }
            Scheduler.prototype.enqueue = function(task) {
              this._add(this._queue, task);
            };
            Scheduler.prototype.afterQueue = function(task) {
              this._add(this._afterQueue, task);
            };
            Scheduler.prototype._drain = function() {
              runQueue(this._queue);
              this._running = false;
              runQueue(this._afterQueue);
            };
            Scheduler.prototype._add = function(queue, task) {
              queue.push(task);
              if (!this._running) {
                this._running = true;
                this._async(this.drain);
              }
            };
            function runQueue(queue) {
              while (queue.length > 0) {
                queue.shift().run();
              }
            }
            return Scheduler;
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(_dereq_);
        }));
      }, {"./Queue": 46}],
      48: [function(_dereq_, module, exports) {
        (function(define) {
          'use strict';
          define(function(_dereq_) {
            var nextTick,
                MutationObs;
            if (typeof process !== 'undefined' && process !== null && typeof process.nextTick === 'function') {
              nextTick = function(f) {
                process.nextTick(f);
              };
            } else if (MutationObs = (typeof MutationObserver === 'function' && MutationObserver) || (typeof WebKitMutationObserver === 'function' && WebKitMutationObserver)) {
              nextTick = (function(document, MutationObserver) {
                var scheduled;
                var el = document.createElement('div');
                var o = new MutationObserver(run);
                o.observe(el, {attributes: true});
                function run() {
                  var f = scheduled;
                  scheduled = void 0;
                  f();
                }
                return function(f) {
                  scheduled = f;
                  el.setAttribute('class', 'x');
                };
              }(document, MutationObs));
            } else {
              nextTick = (function(cjsRequire) {
                var vertx;
                try {
                  vertx = cjsRequire('vertx');
                } catch (ignore) {}
                if (vertx) {
                  if (typeof vertx.runOnLoop === 'function') {
                    return vertx.runOnLoop;
                  }
                  if (typeof vertx.runOnContext === 'function') {
                    return vertx.runOnContext;
                  }
                }
                var capturedSetTimeout = setTimeout;
                return function(t) {
                  capturedSetTimeout(t, 0);
                };
              }(_dereq_));
            }
            return nextTick;
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory(_dereq_);
        }));
      }, {}],
      49: [function(_dereq_, module, exports) {
        (function(define) {
          'use strict';
          define(function() {
            return function makePromise(environment) {
              var tasks = environment.scheduler;
              var objectCreate = Object.create || function(proto) {
                function Child() {}
                Child.prototype = proto;
                return new Child();
              };
              function Promise(resolver, handler) {
                this._handler = resolver === Handler ? handler : init(resolver);
              }
              function init(resolver) {
                var handler = new Pending();
                try {
                  resolver(promiseResolve, promiseReject, promiseNotify);
                } catch (e) {
                  promiseReject(e);
                }
                return handler;
                function promiseResolve(x) {
                  handler.resolve(x);
                }
                function promiseReject(reason) {
                  handler.reject(reason);
                }
                function promiseNotify(x) {
                  handler.notify(x);
                }
              }
              Promise.resolve = resolve;
              Promise.reject = reject;
              Promise.never = never;
              Promise._defer = defer;
              Promise._handler = getHandler;
              function resolve(x) {
                return isPromise(x) ? x : new Promise(Handler, new Async(getHandler(x)));
              }
              function reject(x) {
                return new Promise(Handler, new Async(new Rejected(x)));
              }
              function never() {
                return foreverPendingPromise;
              }
              function defer() {
                return new Promise(Handler, new Pending());
              }
              Promise.prototype.then = function(onFulfilled, onRejected) {
                var parent = this._handler;
                var state = parent.join().state();
                if ((typeof onFulfilled !== 'function' && state > 0) || (typeof onRejected !== 'function' && state < 0)) {
                  return new this.constructor(Handler, parent);
                }
                var p = this._beget();
                var child = p._handler;
                parent.chain(child, parent.receiver, onFulfilled, onRejected, arguments.length > 2 ? arguments[2] : void 0);
                return p;
              };
              Promise.prototype['catch'] = function(onRejected) {
                return this.then(void 0, onRejected);
              };
              Promise.prototype._beget = function() {
                var parent = this._handler;
                var child = new Pending(parent.receiver, parent.join().context);
                return new this.constructor(Handler, child);
              };
              Promise.all = all;
              Promise.race = race;
              function all(promises) {
                var resolver = new Pending();
                var pending = promises.length >>> 0;
                var results = new Array(pending);
                var i,
                    h,
                    x,
                    s;
                for (i = 0; i < promises.length; ++i) {
                  x = promises[i];
                  if (x === void 0 && !(i in promises)) {
                    --pending;
                    continue;
                  }
                  if (maybeThenable(x)) {
                    h = getHandlerMaybeThenable(x);
                    s = h.state();
                    if (s === 0) {
                      h.fold(settleAt, i, results, resolver);
                    } else if (s > 0) {
                      results[i] = h.value;
                      --pending;
                    } else {
                      unreportRemaining(promises, i + 1, h);
                      resolver.become(h);
                      break;
                    }
                  } else {
                    results[i] = x;
                    --pending;
                  }
                }
                if (pending === 0) {
                  resolver.become(new Fulfilled(results));
                }
                return new Promise(Handler, resolver);
                function settleAt(i, x, resolver) {
                  this[i] = x;
                  if (--pending === 0) {
                    resolver.become(new Fulfilled(this));
                  }
                }
              }
              function unreportRemaining(promises, start, rejectedHandler) {
                var i,
                    h,
                    x;
                for (i = start; i < promises.length; ++i) {
                  x = promises[i];
                  if (maybeThenable(x)) {
                    h = getHandlerMaybeThenable(x);
                    if (h !== rejectedHandler) {
                      h.visit(h, void 0, h._unreport);
                    }
                  }
                }
              }
              function race(promises) {
                if (Object(promises) === promises && promises.length === 0) {
                  return never();
                }
                var h = new Pending();
                var i,
                    x;
                for (i = 0; i < promises.length; ++i) {
                  x = promises[i];
                  if (x !== void 0 && i in promises) {
                    getHandler(x).visit(h, h.resolve, h.reject);
                  }
                }
                return new Promise(Handler, h);
              }
              function getHandler(x) {
                if (isPromise(x)) {
                  return x._handler.join();
                }
                return maybeThenable(x) ? getHandlerUntrusted(x) : new Fulfilled(x);
              }
              function getHandlerMaybeThenable(x) {
                return isPromise(x) ? x._handler.join() : getHandlerUntrusted(x);
              }
              function getHandlerUntrusted(x) {
                try {
                  var untrustedThen = x.then;
                  return typeof untrustedThen === 'function' ? new Thenable(untrustedThen, x) : new Fulfilled(x);
                } catch (e) {
                  return new Rejected(e);
                }
              }
              function Handler() {}
              Handler.prototype.when = Handler.prototype.become = Handler.prototype.notify = Handler.prototype.fail = Handler.prototype._unreport = Handler.prototype._report = noop;
              Handler.prototype._state = 0;
              Handler.prototype.state = function() {
                return this._state;
              };
              Handler.prototype.join = function() {
                var h = this;
                while (h.handler !== void 0) {
                  h = h.handler;
                }
                return h;
              };
              Handler.prototype.chain = function(to, receiver, fulfilled, rejected, progress) {
                this.when({
                  resolver: to,
                  receiver: receiver,
                  fulfilled: fulfilled,
                  rejected: rejected,
                  progress: progress
                });
              };
              Handler.prototype.visit = function(receiver, fulfilled, rejected, progress) {
                this.chain(failIfRejected, receiver, fulfilled, rejected, progress);
              };
              Handler.prototype.fold = function(f, z, c, to) {
                this.visit(to, function(x) {
                  f.call(c, z, x, this);
                }, to.reject, to.notify);
              };
              function FailIfRejected() {}
              inherit(Handler, FailIfRejected);
              FailIfRejected.prototype.become = function(h) {
                h.fail();
              };
              var failIfRejected = new FailIfRejected();
              function Pending(receiver, inheritedContext) {
                Promise.createContext(this, inheritedContext);
                this.consumers = void 0;
                this.receiver = receiver;
                this.handler = void 0;
                this.resolved = false;
              }
              inherit(Handler, Pending);
              Pending.prototype._state = 0;
              Pending.prototype.resolve = function(x) {
                this.become(getHandler(x));
              };
              Pending.prototype.reject = function(x) {
                if (this.resolved) {
                  return ;
                }
                this.become(new Rejected(x));
              };
              Pending.prototype.join = function() {
                if (!this.resolved) {
                  return this;
                }
                var h = this;
                while (h.handler !== void 0) {
                  h = h.handler;
                  if (h === this) {
                    return this.handler = cycle();
                  }
                }
                return h;
              };
              Pending.prototype.run = function() {
                var q = this.consumers;
                var handler = this.join();
                this.consumers = void 0;
                for (var i = 0; i < q.length; ++i) {
                  handler.when(q[i]);
                }
              };
              Pending.prototype.become = function(handler) {
                if (this.resolved) {
                  return ;
                }
                this.resolved = true;
                this.handler = handler;
                if (this.consumers !== void 0) {
                  tasks.enqueue(this);
                }
                if (this.context !== void 0) {
                  handler._report(this.context);
                }
              };
              Pending.prototype.when = function(continuation) {
                if (this.resolved) {
                  tasks.enqueue(new ContinuationTask(continuation, this.handler));
                } else {
                  if (this.consumers === void 0) {
                    this.consumers = [continuation];
                  } else {
                    this.consumers.push(continuation);
                  }
                }
              };
              Pending.prototype.notify = function(x) {
                if (!this.resolved) {
                  tasks.enqueue(new ProgressTask(x, this));
                }
              };
              Pending.prototype.fail = function(context) {
                var c = typeof context === 'undefined' ? this.context : context;
                this.resolved && this.handler.join().fail(c);
              };
              Pending.prototype._report = function(context) {
                this.resolved && this.handler.join()._report(context);
              };
              Pending.prototype._unreport = function() {
                this.resolved && this.handler.join()._unreport();
              };
              function Async(handler) {
                this.handler = handler;
              }
              inherit(Handler, Async);
              Async.prototype.when = function(continuation) {
                tasks.enqueue(new ContinuationTask(continuation, this));
              };
              Async.prototype._report = function(context) {
                this.join()._report(context);
              };
              Async.prototype._unreport = function() {
                this.join()._unreport();
              };
              function Thenable(then, thenable) {
                Pending.call(this);
                tasks.enqueue(new AssimilateTask(then, thenable, this));
              }
              inherit(Pending, Thenable);
              function Fulfilled(x) {
                Promise.createContext(this);
                this.value = x;
              }
              inherit(Handler, Fulfilled);
              Fulfilled.prototype._state = 1;
              Fulfilled.prototype.fold = function(f, z, c, to) {
                runContinuation3(f, z, this, c, to);
              };
              Fulfilled.prototype.when = function(cont) {
                runContinuation1(cont.fulfilled, this, cont.receiver, cont.resolver);
              };
              var errorId = 0;
              function Rejected(x) {
                Promise.createContext(this);
                this.id = ++errorId;
                this.value = x;
                this.handled = false;
                this.reported = false;
                this._report();
              }
              inherit(Handler, Rejected);
              Rejected.prototype._state = -1;
              Rejected.prototype.fold = function(f, z, c, to) {
                to.become(this);
              };
              Rejected.prototype.when = function(cont) {
                if (typeof cont.rejected === 'function') {
                  this._unreport();
                }
                runContinuation1(cont.rejected, this, cont.receiver, cont.resolver);
              };
              Rejected.prototype._report = function(context) {
                tasks.afterQueue(new ReportTask(this, context));
              };
              Rejected.prototype._unreport = function() {
                this.handled = true;
                tasks.afterQueue(new UnreportTask(this));
              };
              Rejected.prototype.fail = function(context) {
                Promise.onFatalRejection(this, context === void 0 ? this.context : context);
              };
              function ReportTask(rejection, context) {
                this.rejection = rejection;
                this.context = context;
              }
              ReportTask.prototype.run = function() {
                if (!this.rejection.handled) {
                  this.rejection.reported = true;
                  Promise.onPotentiallyUnhandledRejection(this.rejection, this.context);
                }
              };
              function UnreportTask(rejection) {
                this.rejection = rejection;
              }
              UnreportTask.prototype.run = function() {
                if (this.rejection.reported) {
                  Promise.onPotentiallyUnhandledRejectionHandled(this.rejection);
                }
              };
              Promise.createContext = Promise.enterContext = Promise.exitContext = Promise.onPotentiallyUnhandledRejection = Promise.onPotentiallyUnhandledRejectionHandled = Promise.onFatalRejection = noop;
              var foreverPendingHandler = new Handler();
              var foreverPendingPromise = new Promise(Handler, foreverPendingHandler);
              function cycle() {
                return new Rejected(new TypeError('Promise cycle'));
              }
              function ContinuationTask(continuation, handler) {
                this.continuation = continuation;
                this.handler = handler;
              }
              ContinuationTask.prototype.run = function() {
                this.handler.join().when(this.continuation);
              };
              function ProgressTask(value, handler) {
                this.handler = handler;
                this.value = value;
              }
              ProgressTask.prototype.run = function() {
                var q = this.handler.consumers;
                if (q === void 0) {
                  return ;
                }
                for (var c,
                    i = 0; i < q.length; ++i) {
                  c = q[i];
                  runNotify(c.progress, this.value, this.handler, c.receiver, c.resolver);
                }
              };
              function AssimilateTask(then, thenable, resolver) {
                this._then = then;
                this.thenable = thenable;
                this.resolver = resolver;
              }
              AssimilateTask.prototype.run = function() {
                var h = this.resolver;
                tryAssimilate(this._then, this.thenable, _resolve, _reject, _notify);
                function _resolve(x) {
                  h.resolve(x);
                }
                function _reject(x) {
                  h.reject(x);
                }
                function _notify(x) {
                  h.notify(x);
                }
              };
              function tryAssimilate(then, thenable, resolve, reject, notify) {
                try {
                  then.call(thenable, resolve, reject, notify);
                } catch (e) {
                  reject(e);
                }
              }
              function isPromise(x) {
                return x instanceof Promise;
              }
              function maybeThenable(x) {
                return (typeof x === 'object' || typeof x === 'function') && x !== null;
              }
              function runContinuation1(f, h, receiver, next) {
                if (typeof f !== 'function') {
                  return next.become(h);
                }
                Promise.enterContext(h);
                tryCatchReject(f, h.value, receiver, next);
                Promise.exitContext();
              }
              function runContinuation3(f, x, h, receiver, next) {
                if (typeof f !== 'function') {
                  return next.become(h);
                }
                Promise.enterContext(h);
                tryCatchReject3(f, x, h.value, receiver, next);
                Promise.exitContext();
              }
              function runNotify(f, x, h, receiver, next) {
                if (typeof f !== 'function') {
                  return next.notify(x);
                }
                Promise.enterContext(h);
                tryCatchReturn(f, x, receiver, next);
                Promise.exitContext();
              }
              function tryCatchReject(f, x, thisArg, next) {
                try {
                  next.become(getHandler(f.call(thisArg, x)));
                } catch (e) {
                  next.become(new Rejected(e));
                }
              }
              function tryCatchReject3(f, x, y, thisArg, next) {
                try {
                  f.call(thisArg, x, y, next);
                } catch (e) {
                  next.become(new Rejected(e));
                }
              }
              function tryCatchReturn(f, x, thisArg, next) {
                try {
                  next.notify(f.call(thisArg, x));
                } catch (e) {
                  next.notify(e);
                }
              }
              function inherit(Parent, Child) {
                Child.prototype = objectCreate(Parent.prototype);
                Child.prototype.constructor = Child;
              }
              function noop() {}
              return Promise;
            };
          });
        }(typeof define === 'function' && define.amd ? define : function(factory) {
          module.exports = factory();
        }));
      }, {}]
    }, {}, [10])(10);
  });
})(require("buffer").Buffer, require("process"));
