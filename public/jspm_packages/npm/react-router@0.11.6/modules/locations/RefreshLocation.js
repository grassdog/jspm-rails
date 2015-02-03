/* */ 
var HistoryLocation = require("./HistoryLocation");
var History = require("../utils/History");
var Path = require("../utils/Path");
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
