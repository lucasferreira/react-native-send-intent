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

var rendererID = null;
var injectInternals = null;
var onCommitRoot = null;
var onCommitUnmount = null;
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' && __REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber) {
  var inject = __REACT_DEVTOOLS_GLOBAL_HOOK__.inject,
      onCommitFiberRoot = __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot,
      onCommitFiberUnmount = __REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberUnmount;


  injectInternals = function (internals) {
    process.env.NODE_ENV !== 'production' ? warning(rendererID == null, 'Cannot inject into DevTools twice.') : void 0;
    rendererID = inject(internals);
  };

  onCommitRoot = function (root) {
    if (rendererID == null) {
      return;
    }
    try {
      onCommitFiberRoot(rendererID, root);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_ENV !== 'production' ? warning(false, 'React DevTools encountered an error: %s', err) : void 0;
      }
    }
  };

  onCommitUnmount = function (fiber) {
    if (rendererID == null) {
      return;
    }
    try {
      onCommitFiberUnmount(rendererID, fiber);
    } catch (err) {
      // Catch all errors because it is unsafe to throw in the commit phase.
      if (process.env.NODE_ENV !== 'production') {
        process.env.NODE_ENV !== 'production' ? warning(false, 'React DevTools encountered an error: %s', err) : void 0;
      }
    }
  };
}

exports.injectInternals = injectInternals;
exports.onCommitRoot = onCommitRoot;
exports.onCommitUnmount = onCommitUnmount;