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

var warning = require('fbjs/lib/warning');

var valueStack = [];

if (process.env.NODE_ENV !== 'production') {
  var fiberStack = [];
}

var index = -1;

exports.createCursor = function (defaultValue) {
  return {
    current: defaultValue
  };
};

exports.isEmpty = function () {
  return index === -1;
};

exports.pop = function (cursor, fiber) {
  if (index < 0) {
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Unexpected pop.') : void 0;
    }
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    if (fiber !== fiberStack[index]) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Unexpected Fiber popped.') : void 0;
    }
  }

  cursor.current = valueStack[index];

  valueStack[index] = null;

  if (process.env.NODE_ENV !== 'production') {
    fiberStack[index] = null;
  }

  index--;
};

exports.push = function (cursor, value, fiber) {
  index++;

  valueStack[index] = cursor.current;

  if (process.env.NODE_ENV !== 'production') {
    fiberStack[index] = fiber;
  }

  cursor.current = value;
};

exports.reset = function () {
  while (index > -1) {
    valueStack[index] = null;

    if (process.env.NODE_ENV !== 'production') {
      fiberStack[index] = null;
    }

    index--;
  }
};