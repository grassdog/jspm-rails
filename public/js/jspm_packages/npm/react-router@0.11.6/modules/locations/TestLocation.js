/* */ 
var invariant = require("react/lib/invariant");
var LocationActions = require("../actions/LocationActions");
var History = require("../utils/History");
var _listener;
function notifyChange(type) {
  if (_listener)
    _listener({
      path: TestLocation.getCurrentPath(),
      type: type
    });
}
function updateHistoryLength() {
  History.length = TestLocation.history.length;
}
var TestLocation = {
  history: [],
  addChangeListener: function(listener) {
    _listener = listener;
    updateHistoryLength();
  },
  removeChangeListener: function() {},
  push: function(path) {
    TestLocation.history.push(path);
    updateHistoryLength();
    notifyChange(LocationActions.PUSH);
  },
  replace: function(path) {
    invariant(History.length, 'You cannot replace the current path with no history');
    TestLocation.history[TestLocation.history.length - 1] = path;
    notifyChange(LocationActions.REPLACE);
  },
  pop: function() {
    TestLocation.history.pop();
    updateHistoryLength();
    notifyChange(LocationActions.POP);
  },
  getCurrentPath: function() {
    return TestLocation.history[TestLocation.history.length - 1];
  },
  toString: function() {
    return '<TestLocation>';
  }
};
module.exports = TestLocation;
