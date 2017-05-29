/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

// Trust the developer to only use this with a __DEV__ check
var ReactHostOperationHistoryHook = null;

if (process.env.NODE_ENV !== 'production') {
  var history = [];

  ReactHostOperationHistoryHook = {
    onHostOperation: function (operation) {
      history.push(operation);
    },
    clearHistory: function () {
      if (ReactHostOperationHistoryHook._preventClearing) {
        // Should only be used for tests.
        return;
      }

      history = [];
    },
    getHistory: function () {
      return history;
    }
  };
}

module.exports = ReactHostOperationHistoryHook;