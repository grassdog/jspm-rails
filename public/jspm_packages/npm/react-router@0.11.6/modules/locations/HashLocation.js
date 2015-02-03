/* */ 
var LocationActions = require("../actions/LocationActions");
var History = require("../utils/History");
var Path = require("../utils/Path");
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
