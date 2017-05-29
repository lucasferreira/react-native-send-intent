/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

var checkPropTypes = require('react/lib/checkPropTypes');

var _require = require('react/lib/ReactDebugCurrentFrame'),
    getStackAddendum = _require.getStackAddendum;

function checkReactTypeSpec(typeSpecs, values, location, componentName) {
  checkPropTypes(typeSpecs, values, location, componentName, getStackAddendum);
}

module.exports = checkReactTypeSpec;