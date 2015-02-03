/* */ 
"use strict";
var EventConstants = require("./EventConstants");
var EventPropagators = require("./EventPropagators");
var ExecutionEnvironment = require("./ExecutionEnvironment");
var ReactInputSelection = require("./ReactInputSelection");
var SyntheticCompositionEvent = require("./SyntheticCompositionEvent");
var getTextContentAccessor = require("./getTextContentAccessor");
var keyOf = require("./keyOf");
var END_KEYCODES = [9, 13, 27, 32];
var START_KEYCODE = 229;
var useCompositionEvent = (ExecutionEnvironment.canUseDOM && 'CompositionEvent' in window);
var useFallbackData = (!useCompositionEvent || ('documentMode' in document && document.documentMode > 8 && document.documentMode <= 11));
var topLevelTypes = EventConstants.topLevelTypes;
var currentComposition = null;
var eventTypes = {
  compositionEnd: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionEnd: null}),
      captured: keyOf({onCompositionEndCapture: null})
    },
    dependencies: [topLevelTypes.topBlur, topLevelTypes.topCompositionEnd, topLevelTypes.topKeyDown, topLevelTypes.topKeyPress, topLevelTypes.topKeyUp, topLevelTypes.topMouseDown]
  },
  compositionStart: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionStart: null}),
      captured: keyOf({onCompositionStartCapture: null})
    },
    dependencies: [topLevelTypes.topBlur, topLevelTypes.topCompositionStart, topLevelTypes.topKeyDown, topLevelTypes.topKeyPress, topLevelTypes.topKeyUp, topLevelTypes.topMouseDown]
  },
  compositionUpdate: {
    phasedRegistrationNames: {
      bubbled: keyOf({onCompositionUpdate: null}),
      captured: keyOf({onCompositionUpdateCapture: null})
    },
    dependencies: [topLevelTypes.topBlur, topLevelTypes.topCompositionUpdate, topLevelTypes.topKeyDown, topLevelTypes.topKeyPress, topLevelTypes.topKeyUp, topLevelTypes.topMouseDown]
  }
};
function getCompositionEventType(topLevelType) {
  switch (topLevelType) {
    case topLevelTypes.topCompositionStart:
      return eventTypes.compositionStart;
    case topLevelTypes.topCompositionEnd:
      return eventTypes.compositionEnd;
    case topLevelTypes.topCompositionUpdate:
      return eventTypes.compositionUpdate;
  }
}
function isFallbackStart(topLevelType, nativeEvent) {
  return (topLevelType === topLevelTypes.topKeyDown && nativeEvent.keyCode === START_KEYCODE);
}
function isFallbackEnd(topLevelType, nativeEvent) {
  switch (topLevelType) {
    case topLevelTypes.topKeyUp:
      return (END_KEYCODES.indexOf(nativeEvent.keyCode) !== -1);
    case topLevelTypes.topKeyDown:
      return (nativeEvent.keyCode !== START_KEYCODE);
    case topLevelTypes.topKeyPress:
    case topLevelTypes.topMouseDown:
    case topLevelTypes.topBlur:
      return true;
    default:
      return false;
  }
}
function FallbackCompositionState(root) {
  this.root = root;
  this.startSelection = ReactInputSelection.getSelection(root);
  this.startValue = this.getText();
}
FallbackCompositionState.prototype.getText = function() {
  return this.root.value || this.root[getTextContentAccessor()];
};
FallbackCompositionState.prototype.getData = function() {
  var endValue = this.getText();
  var prefixLength = this.startSelection.start;
  var suffixLength = this.startValue.length - this.startSelection.end;
  return endValue.substr(prefixLength, endValue.length - suffixLength - prefixLength);
};
var CompositionEventPlugin = {
  eventTypes: eventTypes,
  extractEvents: function(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
    var eventType;
    var data;
    if (useCompositionEvent) {
      eventType = getCompositionEventType(topLevelType);
    } else if (!currentComposition) {
      if (isFallbackStart(topLevelType, nativeEvent)) {
        eventType = eventTypes.compositionStart;
      }
    } else if (isFallbackEnd(topLevelType, nativeEvent)) {
      eventType = eventTypes.compositionEnd;
    }
    if (useFallbackData) {
      if (!currentComposition && eventType === eventTypes.compositionStart) {
        currentComposition = new FallbackCompositionState(topLevelTarget);
      } else if (eventType === eventTypes.compositionEnd) {
        if (currentComposition) {
          data = currentComposition.getData();
          currentComposition = null;
        }
      }
    }
    if (eventType) {
      var event = SyntheticCompositionEvent.getPooled(eventType, topLevelTargetID, nativeEvent);
      if (data) {
        event.data = data;
      }
      EventPropagators.accumulateTwoPhaseDispatches(event);
      return event;
    }
  }
};
module.exports = CompositionEventPlugin;
