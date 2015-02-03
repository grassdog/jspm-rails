/* */ 
var assign = require("react/lib/Object.assign");
var reversedArray = require("./reversedArray");
var Redirect = require("./Redirect");
var Promise = require("./Promise");
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
