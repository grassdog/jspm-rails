/* */ 
"use strict";
var getUnboundedScrollPosition = require("./getUnboundedScrollPosition");
var ViewportMetrics = {
  currentScrollLeft: 0,
  currentScrollTop: 0,
  refreshScrollValues: function() {
    var scrollPosition = getUnboundedScrollPosition(window);
    ViewportMetrics.currentScrollLeft = scrollPosition.x;
    ViewportMetrics.currentScrollTop = scrollPosition.y;
  }
};
module.exports = ViewportMetrics;
