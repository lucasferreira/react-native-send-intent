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

var _extends = _assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _prodInvariant = require('./reactProdInvariant'),
    _assign = require('object-assign');

var emptyObject = require('fbjs/lib/emptyObject');
var getComponentName = require('./getComponentName');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');

var _require = require('./ReactFiberTreeReflection'),
    isFiberMounted = _require.isFiberMounted;

var _require2 = require('./ReactTypeOfWork'),
    ClassComponent = _require2.ClassComponent,
    HostRoot = _require2.HostRoot;

var _require3 = require('./ReactFiberStack'),
    createCursor = _require3.createCursor,
    pop = _require3.pop,
    push = _require3.push;

if (process.env.NODE_ENV !== 'production') {
  var checkReactTypeSpec = require('./checkReactTypeSpec');
  var ReactDebugCurrentFrame = require('react/lib/ReactDebugCurrentFrame');
  var ReactDebugCurrentFiber = require('./ReactDebugCurrentFiber');

  var _require4 = require('./ReactDebugFiberPerf'),
      startPhaseTimer = _require4.startPhaseTimer,
      stopPhaseTimer = _require4.stopPhaseTimer;

  var warnedAboutMissingGetChildContext = {};
}

// A cursor to the current merged context object on the stack.
var contextStackCursor = createCursor(emptyObject);
// A cursor to a boolean indicating whether the context has changed.
var didPerformWorkStackCursor = createCursor(false);
// Keep track of the previous context object that was on the stack.
// We use this to get access to the parent context after we have already
// pushed the next context provider, and now need to merge their contexts.
var previousContext = emptyObject;

function getUnmaskedContext(workInProgress) {
  var hasOwnContext = isContextProvider(workInProgress);
  if (hasOwnContext) {
    // If the fiber is a context provider itself, when we read its context
    // we have already pushed its own child context on the stack. A context
    // provider should not "see" its own child context. Therefore we read the
    // previous (parent) context instead for a context provider.
    return previousContext;
  }
  return contextStackCursor.current;
}
exports.getUnmaskedContext = getUnmaskedContext;

function cacheContext(workInProgress, unmaskedContext, maskedContext) {
  var instance = workInProgress.stateNode;
  instance.__reactInternalMemoizedUnmaskedChildContext = unmaskedContext;
  instance.__reactInternalMemoizedMaskedChildContext = maskedContext;
}
exports.cacheContext = cacheContext;

exports.getMaskedContext = function (workInProgress, unmaskedContext) {
  var type = workInProgress.type;
  var contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }

  // Avoid recreating masked context unless unmasked context has changed.
  // Failing to do this will result in unnecessary calls to componentWillReceiveProps.
  // This may trigger infinite loops if componentWillReceiveProps calls setState.
  var instance = workInProgress.stateNode;
  if (instance && instance.__reactInternalMemoizedUnmaskedChildContext === unmaskedContext) {
    return instance.__reactInternalMemoizedMaskedChildContext;
  }

  var context = {};
  for (var key in contextTypes) {
    context[key] = unmaskedContext[key];
  }

  if (process.env.NODE_ENV !== 'production') {
    var name = getComponentName(workInProgress) || 'Unknown';
    ReactDebugCurrentFrame.current = workInProgress;
    checkReactTypeSpec(contextTypes, context, 'context', name);
    ReactDebugCurrentFrame.current = null;
  }

  // Cache unmasked context so we can avoid recreating masked context unless necessary.
  // Context is created before the class component is instantiated so check for instance.
  if (instance) {
    cacheContext(workInProgress, unmaskedContext, context);
  }

  return context;
};

exports.hasContextChanged = function () {
  return didPerformWorkStackCursor.current;
};

function isContextConsumer(fiber) {
  return fiber.tag === ClassComponent && fiber.type.contextTypes != null;
}
exports.isContextConsumer = isContextConsumer;

function isContextProvider(fiber) {
  return fiber.tag === ClassComponent && fiber.type.childContextTypes != null;
}
exports.isContextProvider = isContextProvider;

function popContextProvider(fiber) {
  if (!isContextProvider(fiber)) {
    return;
  }

  pop(didPerformWorkStackCursor, fiber);
  pop(contextStackCursor, fiber);
}
exports.popContextProvider = popContextProvider;

exports.pushTopLevelContextObject = function (fiber, context, didChange) {
  invariant(contextStackCursor.cursor == null, 'Unexpected context found on stack');

  push(contextStackCursor, context, fiber);
  push(didPerformWorkStackCursor, didChange, fiber);
};

function processChildContext(fiber, parentContext, isReconciling) {
  var instance = fiber.stateNode;
  var childContextTypes = fiber.type.childContextTypes;

  // TODO (bvaughn) Replace this behavior with an invariant() in the future.
  // It has only been added in Fiber to match the (unintentional) behavior in Stack.
  if (typeof instance.getChildContext !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      var componentName = getComponentName(fiber) || 'Unknown';

      if (!warnedAboutMissingGetChildContext[componentName]) {
        warnedAboutMissingGetChildContext[componentName] = true;
        process.env.NODE_ENV !== 'production' ? warning(false, '%s.childContextTypes is specified but there is no getChildContext() method ' + 'on the instance. You can either define getChildContext() on %s or remove ' + 'childContextTypes from it.', componentName, componentName) : void 0;
      }
    }
    return parentContext;
  }

  var childContext = void 0;
  if (process.env.NODE_ENV !== 'production') {
    ReactDebugCurrentFiber.phase = 'getChildContext';
    startPhaseTimer(fiber, 'getChildContext');
    childContext = instance.getChildContext();
    stopPhaseTimer();
    ReactDebugCurrentFiber.phase = null;
  } else {
    childContext = instance.getChildContext();
  }
  for (var contextKey in childContext) {
    !(contextKey in childContextTypes) ? process.env.NODE_ENV !== 'production' ? invariant(false, '%s.getChildContext(): key "%s" is not defined in childContextTypes.', getComponentName(fiber) || 'Unknown', contextKey) : _prodInvariant('108', getComponentName(fiber) || 'Unknown', contextKey) : void 0;
  }
  if (process.env.NODE_ENV !== 'production') {
    var name = getComponentName(fiber) || 'Unknown';
    // We can only provide accurate element stacks if we pass work-in-progress tree
    // during the begin or complete phase. However currently this function is also
    // called from unstable_renderSubtree legacy implementation. In this case it unsafe to
    // assume anything about the given fiber. We won't pass it down if we aren't sure.
    // TODO: remove this hack when we delete unstable_renderSubtree in Fiber.
    var workInProgress = isReconciling ? fiber : null;
    ReactDebugCurrentFrame.current = workInProgress;
    checkReactTypeSpec(childContextTypes, childContext, 'child context', name);
    ReactDebugCurrentFrame.current = null;
  }

  return _extends({}, parentContext, childContext);
}
exports.processChildContext = processChildContext;

exports.pushContextProvider = function (workInProgress) {
  if (!isContextProvider(workInProgress)) {
    return false;
  }

  var instance = workInProgress.stateNode;
  // We push the context as early as possible to ensure stack integrity.
  // If the instance does not exist yet, we will push null at first,
  // and replace it on the stack later when invalidating the context.
  var memoizedMergedChildContext = instance && instance.__reactInternalMemoizedMergedChildContext || emptyObject;

  // Remember the parent context so we can merge with it later.
  previousContext = contextStackCursor.current;
  push(contextStackCursor, memoizedMergedChildContext, workInProgress);
  push(didPerformWorkStackCursor, false, workInProgress);

  return true;
};

exports.invalidateContextProvider = function (workInProgress) {
  var instance = workInProgress.stateNode;
  invariant(instance, 'Expected to have an instance by this point.');

  // Merge parent and own context.
  var mergedContext = processChildContext(workInProgress, previousContext, true);
  instance.__reactInternalMemoizedMergedChildContext = mergedContext;

  // Replace the old (or empty) context with the new one.
  // It is important to unwind the context in the reverse order.
  pop(didPerformWorkStackCursor, workInProgress);
  pop(contextStackCursor, workInProgress);
  // Now push the new context and mark that it has changed.
  push(contextStackCursor, mergedContext, workInProgress);
  push(didPerformWorkStackCursor, true, workInProgress);
};

exports.resetContext = function () {
  previousContext = emptyObject;
  contextStackCursor.current = emptyObject;
  didPerformWorkStackCursor.current = false;
};

exports.findCurrentUnmaskedContext = function (fiber) {
  // Currently this is only used with renderSubtreeIntoContainer; not sure if it
  // makes sense elsewhere
  invariant(isFiberMounted(fiber) && fiber.tag === ClassComponent, 'Expected subtree parent to be a mounted class component');

  var node = fiber;
  while (node.tag !== HostRoot) {
    if (isContextProvider(node)) {
      return node.stateNode.__reactInternalMemoizedMergedChildContext;
    }
    var parent = node['return'];
    invariant(parent, 'Found unexpected detached subtree parent');
    node = parent;
  }
  return node.stateNode.context;
};