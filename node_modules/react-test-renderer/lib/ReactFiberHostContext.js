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

var emptyObject = require('fbjs/lib/emptyObject');

var _require = require('./ReactFiberStack'),
    createCursor = _require.createCursor,
    pop = _require.pop,
    push = _require.push;

var invariant = require('fbjs/lib/invariant');

module.exports = function (config) {
  var getChildHostContext = config.getChildHostContext,
      getRootHostContext = config.getRootHostContext;


  var contextStackCursor = createCursor(null);
  var contextFiberStackCursor = createCursor(null);
  var rootInstanceStackCursor = createCursor(null);

  function getRootHostContainer() {
    var rootInstance = rootInstanceStackCursor.current;
    invariant(rootInstance !== null, 'Expected root container to exist. This error is likely caused by a ' + 'bug in React. Please file an issue.');
    return rootInstance;
  }

  function pushHostContainer(fiber, nextRootInstance) {
    // Push current root instance onto the stack;
    // This allows us to reset root when portals are popped.
    push(rootInstanceStackCursor, nextRootInstance, fiber);

    var nextRootContext = getRootHostContext(nextRootInstance);

    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextRootContext, fiber);
  }

  function popHostContainer(fiber) {
    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
    pop(rootInstanceStackCursor, fiber);
  }

  function getHostContext() {
    var context = contextStackCursor.current;
    invariant(context != null, 'Expected host context to exist. This error is likely caused by a bug ' + 'in React. Please file an issue.');
    return context;
  }

  function pushHostContext(fiber) {
    var rootInstance = rootInstanceStackCursor.current;
    invariant(rootInstance != null, 'Expected root host context to exist. This error is likely caused by ' + 'a bug in React. Please file an issue.');

    var context = contextStackCursor.current !== null ? contextStackCursor.current : emptyObject;
    var nextContext = getChildHostContext(context, fiber.type, rootInstance);

    // Don't push this Fiber's context unless it's unique.
    if (context === nextContext) {
      return;
    }

    // Track the context and the Fiber that provided it.
    // This enables us to pop only Fibers that provide unique contexts.
    push(contextFiberStackCursor, fiber, fiber);
    push(contextStackCursor, nextContext, fiber);
  }

  function popHostContext(fiber) {
    // Do not pop unless this Fiber provided the current context.
    // pushHostContext() only pushes Fibers that provide unique contexts.
    if (contextFiberStackCursor.current !== fiber) {
      return;
    }

    pop(contextStackCursor, fiber);
    pop(contextFiberStackCursor, fiber);
  }

  function resetHostContainer() {
    contextStackCursor.current = null;
    rootInstanceStackCursor.current = null;
  }

  return {
    getHostContext: getHostContext,
    getRootHostContainer: getRootHostContainer,
    popHostContainer: popHostContainer,
    popHostContext: popHostContext,
    pushHostContainer: pushHostContainer,
    pushHostContext: pushHostContext,
    resetHostContainer: resetHostContainer
  };
};