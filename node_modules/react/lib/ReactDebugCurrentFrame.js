/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

var ReactDebugCurrentFrame = {};

if (process.env.NODE_ENV !== 'production') {
  var _require = require('./ReactComponentTreeHook'),
      getStackAddendumByID = _require.getStackAddendumByID,
      getCurrentStackAddendum = _require.getCurrentStackAddendum;

  var _require2 = require('./ReactFiberComponentTreeHook'),
      getStackAddendumByWorkInProgressFiber = _require2.getStackAddendumByWorkInProgressFiber;

  // Component that is being worked on


  ReactDebugCurrentFrame.current = null;

  // Element that is being cloned or created
  ReactDebugCurrentFrame.element = null;

  ReactDebugCurrentFrame.getStackAddendum = function () {
    var stack = null;
    var current = ReactDebugCurrentFrame.current;
    var element = ReactDebugCurrentFrame.element;
    if (current !== null) {
      if (typeof current === 'number') {
        // DebugID from Stack.
        var debugID = current;
        stack = getStackAddendumByID(debugID);
      } else if (typeof current.tag === 'number') {
        // This is a Fiber.
        // The stack will only be correct if this is a work in progress
        // version and we're calling it during reconciliation.
        var workInProgress = current;
        stack = getStackAddendumByWorkInProgressFiber(workInProgress);
      }
    } else if (element !== null) {
      stack = getCurrentStackAddendum(element);
    }
    return stack;
  };
}

module.exports = ReactDebugCurrentFrame;