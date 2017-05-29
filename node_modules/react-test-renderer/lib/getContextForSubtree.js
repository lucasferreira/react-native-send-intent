'use strict';

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

var ReactInstanceMap = require('./ReactInstanceMap');

var emptyObject = require('fbjs/lib/emptyObject');
var invariant = require('fbjs/lib/invariant');

var getContextFiber = function (arg) {
  invariant(false, 'Missing injection for fiber getContextForSubtree');
};

function getContextForSubtree(parentComponent) {
  if (!parentComponent) {
    return emptyObject;
  }

  var instance = ReactInstanceMap.get(parentComponent);
  if (typeof instance.tag === 'number') {
    return getContextFiber(instance);
  } else {
    return instance._processChildContext(instance._context);
  }
}

getContextForSubtree._injectFiber = function (fn) {
  getContextFiber = fn;
};

module.exports = getContextForSubtree;