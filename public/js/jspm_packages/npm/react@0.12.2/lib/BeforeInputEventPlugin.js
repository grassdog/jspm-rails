/* */ 
"use strict";
var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var SyntheticInputEvent = require("./SyntheticInputEvent");
var keyOf = require("./keyOf");
var canUseTextInputEvent = (ExecutionEnvironment.canUseDOM && 'TextEvent' in window && !('documentMode' in document || isPresto()));
function isPresto() {
  var opera = window.opera;
  return (typeof opera === 'object' && typeof opera.version === 'function' && parseInt(opera.version(), 10) <= 12);
}
var SPACEBAR_CODE = 32;
var SPACEBAR_CHAR = String.fromCharCode(SPACEBAR_CODE);
var topLevelTypes = EventConstants.topLevelTypes;
var eventTypes = {beforeInput: {
    phasedRegistrationNames: {
      bubbled: keyOf({onBeforeInput: null}),
      captured: keyOf({onBeforeInputCapture: null})
    },
    dependencies: [topLevelTypes.topCompositionEnd, topLevelTypes.topKeyPress, topLevelTypes.topTextInput, topLevelTypes.topPaste]
  }};
var fallbackChars = null;
var hasSpaceKeypress = false;
function isKeypressCommand(nativeEvent) {
  return ((nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) && !(nativeEvent.ctrlKey && nativeEvent.altKey));
}
var BeforeInputEventPlugin = {
  eventTypes: eventTypes,
  extractEvents: function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
    var chars;
    if (canUseTextInputEvent) {
      switch (topLevelType) {
        case topLevelTypes.topKeyPress:
          var which = nativeEvent.which;
          if (which !== SPACEBAR_CODE) {
            return ;
          }
          hasSpaceKeypress = true;
          chars = SPACEBAR_CHAR;
          break;
        case topLevelTypes.topTextInput:
          chars = nativeEvent.data;
          if (chars === SPACEBAR_CHAR && hasSpaceKeypress) {
            return ;
          }
          break;
        default:
          return ;
      }
    } else {
      switch (topLevelType) {
        case topLevelTypes.topPaste:
          fallbackChars = null;
          break;
        case topLevelTypes.topKeyPress:
          if (nativeEvent.which && !isKeypressCommand(nativeEvent)) {
            fallbackChars = String.fromCharCode(nativeEvent.which);
          }
          break;
        case topLevelTypes.topCompositionEnd:
          fallbackChars = nativeEvent.data;
          break;
      }
      if (fallbackChars === null) {
        return ;
      }
      chars = fallbackChars;
    }
    if (!chars) {
      return ;
    }
    var event = SyntheticInputEvent.getPooled(eventTypes.beforeInput, topLevelTargetID, nativeEvent);
    event.data = chars;
    fallbackChars = null;
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  }
};
module.exports = BeforeInputEventPlugin;
