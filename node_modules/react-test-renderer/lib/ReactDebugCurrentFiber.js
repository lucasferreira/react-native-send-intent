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

if (process.env.NODE_ENV !== 'production') {
  var getComponentName = require('./getComponentName');

  var _require = require('./ReactFiberComponentTreeHook'),
      getStackAddendumByWorkInProgressFiber = _require.getStackAddendumByWorkInProgressFiber;
}

function getCurrentFiberOwnerName() {
  if (process.env.NODE_ENV !== 'production') {
    var fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    if (fiber._debugOwner != null) {
      return getComponentName(fiber._debugOwner);
    }
  }
  return null;
}

function getCurrentFiberStackAddendum() {
  if (process.env.NODE_ENV !== 'production') {
    var fiber = ReactDebugCurrentFiber.current;
    if (fiber === null) {
      return null;
    }
    // Safe because if current fiber exists, we are reconciling,
    // and it is guaranteed to be the work-in-progress version.
    return getStackAddendumByWorkInProgressFiber(fiber);
  }
  return null;
}

var ReactDebugCurrentFiber = {
  current: null,
  phase: null,

  getCurrentFiberOwnerName: getCurrentFiberOwnerName,
  getCurrentFiberStackAddendum: getCurrentFiberStackAddendum
};

module.exports = ReactDebugCurrentFiber;