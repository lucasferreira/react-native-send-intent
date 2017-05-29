/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 */

'use strict';

// The Symbol used to tag the special React types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var REACT_PORTAL_TYPE = typeof Symbol === 'function' && Symbol['for'] && Symbol['for']('react.portal') || 0xeaca;

exports.createPortal = function (children, containerInfo,
// TODO: figure out the API for cross-renderer implementation.
implementation) {
  var key = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  return {
    // This tag allow us to uniquely identify this as a React Portal
    $$typeof: REACT_PORTAL_TYPE,
    key: key == null ? null : '' + key,
    children: children,
    containerInfo: containerInfo,
    implementation: implementation
  };
};

/**
 * Verifies the object is a portal object.
 */
exports.isPortal = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_PORTAL_TYPE;
};

exports.REACT_PORTAL_TYPE = REACT_PORTAL_TYPE;