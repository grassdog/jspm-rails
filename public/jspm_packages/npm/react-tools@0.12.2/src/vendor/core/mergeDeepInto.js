/* */ 
(function(process) {
  "use strict";
  var invariant = require("invariant");
  var mergeHelpers = require("mergeHelpers");
  var ArrayStrategies = mergeHelpers.ArrayStrategies;
  var checkArrayStrategy = mergeHelpers.checkArrayStrategy;
  var checkMergeArrayArgs = mergeHelpers.checkMergeArrayArgs;
  var checkMergeLevel = mergeHelpers.checkMergeLevel;
  var checkMergeObjectArgs = mergeHelpers.checkMergeObjectArgs;
  var isTerminal = mergeHelpers.isTerminal;
  var normalizeMergeArg = mergeHelpers.normalizeMergeArg;
  var mergeDeepIntoObjects = function(one, two, arrayStrategy, level) {
    checkMergeObjectArgs(one, two);
    checkMergeLevel(level);
    var twoKeys = two ? Object.keys(two) : [];
    for (var i = 0; i < twoKeys.length; i++) {
      var twoKey = twoKeys[i];
      mergeSingleFieldDeep(one, two, twoKey, arrayStrategy, level);
    }
  };
  var mergeDeepIntoArrays = function(one, two, arrayStrategy, level) {
    checkMergeArrayArgs(one, two);
    checkMergeLevel(level);
    var maxLen = Math.max(one.length, two.length);
    for (var i = 0; i < maxLen; i++) {
      mergeSingleFieldDeep(one, two, i, arrayStrategy, level);
    }
  };
  var mergeSingleFieldDeep = function(one, two, key, arrayStrategy, level) {
    var twoVal = two[key];
    var twoValIsPresent = two.hasOwnProperty(key);
    var twoValIsTerminal = twoValIsPresent && isTerminal(twoVal);
    var twoValIsArray = twoValIsPresent && Array.isArray(twoVal);
    var twoValIsProperObject = twoValIsPresent && !twoValIsArray && !twoValIsArray;
    var oneVal = one[key];
    var oneValIsPresent = one.hasOwnProperty(key);
    var oneValIsTerminal = oneValIsPresent && isTerminal(oneVal);
    var oneValIsArray = oneValIsPresent && Array.isArray(oneVal);
    var oneValIsProperObject = oneValIsPresent && !oneValIsArray && !oneValIsArray;
    if (oneValIsTerminal) {
      if (twoValIsTerminal) {
        one[key] = twoVal;
      } else if (twoValIsArray) {
        one[key] = [];
        mergeDeepIntoArrays(one[key], twoVal, arrayStrategy, level + 1);
      } else if (twoValIsProperObject) {
        one[key] = {};
        mergeDeepIntoObjects(one[key], twoVal, arrayStrategy, level + 1);
      } else if (!twoValIsPresent) {
        one[key] = oneVal;
      }
    } else if (oneValIsArray) {
      if (twoValIsTerminal) {
        one[key] = twoVal;
      } else if (twoValIsArray) {
        invariant(ArrayStrategies[arrayStrategy], 'mergeDeepInto(...): Attempted to merge two arrays, but a valid ' + 'ArrayStrategy was not specified.');
        if (arrayStrategy === ArrayStrategies.Clobber) {
          oneVal.length = 0;
        }
        mergeDeepIntoArrays(oneVal, twoVal, arrayStrategy, level + 1);
      } else if (twoValIsProperObject) {
        one[key] = {};
        mergeDeepIntoObjects(one[key], twoVal, arrayStrategy, level + 1);
      } else if (!twoValIsPresent) {}
    } else if (oneValIsProperObject) {
      if (twoValIsTerminal) {
        one[key] = twoVal;
      } else if (twoValIsArray) {
        one[key] = [];
        mergeDeepIntoArrays(one[key], twoVal, arrayStrategy, level + 1);
      } else if (twoValIsProperObject) {
        mergeDeepIntoObjects(oneVal, twoVal, arrayStrategy, level + 1);
      } else if (!twoValIsPresent) {}
    } else if (!oneValIsPresent) {
      if (twoValIsTerminal) {
        one[key] = twoVal;
      } else if (twoValIsArray) {
        one[key] = [];
        mergeDeepIntoArrays(one[key], twoVal, arrayStrategy, level + 1);
      } else if (twoValIsProperObject) {
        one[key] = {};
        mergeDeepIntoObjects(one[key], twoVal, arrayStrategy, level + 1);
      } else if (!twoValIsPresent) {}
    }
  };
  var mergeDeepInto = function(one, twoParam, arrayStrategy) {
    var two = normalizeMergeArg(twoParam);
    checkArrayStrategy(arrayStrategy);
    mergeDeepIntoObjects(one, two, arrayStrategy, 0);
  };
  module.exports = mergeDeepInto;
})(require("process"));
