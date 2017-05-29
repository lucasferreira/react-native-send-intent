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

var _prodInvariant = require('./reactProdInvariant');

var ReactTypeOfWork = require('./ReactTypeOfWork');
var IndeterminateComponent = ReactTypeOfWork.IndeterminateComponent,
    ClassComponent = ReactTypeOfWork.ClassComponent,
    HostRoot = ReactTypeOfWork.HostRoot,
    HostComponent = ReactTypeOfWork.HostComponent,
    HostText = ReactTypeOfWork.HostText,
    HostPortal = ReactTypeOfWork.HostPortal,
    CoroutineComponent = ReactTypeOfWork.CoroutineComponent,
    YieldComponent = ReactTypeOfWork.YieldComponent,
    Fragment = ReactTypeOfWork.Fragment;

var _require = require('./ReactPriorityLevel'),
    NoWork = _require.NoWork;

var _require2 = require('./ReactTypeOfSideEffect'),
    NoEffect = _require2.NoEffect;

var _require3 = require('./ReactFiberUpdateQueue'),
    cloneUpdateQueue = _require3.cloneUpdateQueue;

var invariant = require('fbjs/lib/invariant');

if (process.env.NODE_ENV !== 'production') {
  var getComponentName = require('./getComponentName');
}

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.


if (process.env.NODE_ENV !== 'production') {
  var debugCounter = 1;
}

// This is a constructor of a POJO instead of a constructor function for a few
// reasons:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We can easily go from a createFiber call to calling a constructor if that
//    is faster. The opposite is not true.
// 4) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
var createFiber = function (tag, key) {
  var fiber = {
    // Instance

    tag: tag,

    key: key,

    type: null,

    stateNode: null,

    // Fiber

    'return': null,

    child: null,
    sibling: null,
    index: 0,

    ref: null,

    pendingProps: null,
    memoizedProps: null,
    updateQueue: null,
    memoizedState: null,

    effectTag: NoEffect,
    nextEffect: null,
    firstEffect: null,
    lastEffect: null,

    pendingWorkPriority: NoWork,
    progressedPriority: NoWork,
    progressedChild: null,
    progressedFirstDeletion: null,
    progressedLastDeletion: null,

    alternate: null
  };

  if (process.env.NODE_ENV !== 'production') {
    fiber._debugID = debugCounter++;
    fiber._debugSource = null;
    fiber._debugOwner = null;
    fiber._debugIsCurrentlyTiming = false;
    if (typeof Object.preventExtensions === 'function') {
      Object.preventExtensions(fiber);
    }
  }

  return fiber;
};

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

// This is used to create an alternate fiber to do work on.
// TODO: Rename to createWorkInProgressFiber or something like that.
exports.cloneFiber = function (fiber, priorityLevel) {
  // We clone to get a work in progress. That means that this fiber is the
  // current. To make it safe to reuse that fiber later on as work in progress
  // we need to reset its work in progress flag now. We don't have an
  // opportunity to do this earlier since we don't traverse the tree when
  // the work in progress tree becomes the current tree.
  // fiber.progressedPriority = NoWork;
  // fiber.progressedChild = null;

  // We use a double buffering pooling technique because we know that we'll only
  // ever need at most two versions of a tree. We pool the "other" unused node
  // that we're free to reuse. This is lazily created to avoid allocating extra
  // objects for things that are never updated. It also allow us to reclaim the
  // extra memory if needed.
  var alt = fiber.alternate;
  if (alt !== null) {
    // If we clone, then we do so from the "current" state. The current state
    // can't have any side-effects that are still valid so we reset just to be
    // sure.
    alt.effectTag = NoEffect;
    alt.nextEffect = null;
    alt.firstEffect = null;
    alt.lastEffect = null;
  } else {
    // This should not have an alternate already
    alt = createFiber(fiber.tag, fiber.key);
    alt.type = fiber.type;

    alt.progressedChild = fiber.progressedChild;
    alt.progressedPriority = fiber.progressedPriority;

    alt.alternate = fiber;
    fiber.alternate = alt;
  }

  alt.stateNode = fiber.stateNode;
  alt.child = fiber.child;
  alt.sibling = fiber.sibling; // This should always be overridden. TODO: null
  alt.index = fiber.index; // This should always be overridden.
  alt.ref = fiber.ref;
  // pendingProps is here for symmetry but is unnecessary in practice for now.
  // TODO: Pass in the new pendingProps as an argument maybe?
  alt.pendingProps = fiber.pendingProps;
  cloneUpdateQueue(fiber, alt);
  alt.pendingWorkPriority = priorityLevel;

  alt.memoizedProps = fiber.memoizedProps;
  alt.memoizedState = fiber.memoizedState;

  if (process.env.NODE_ENV !== 'production') {
    alt._debugID = fiber._debugID;
    alt._debugSource = fiber._debugSource;
    alt._debugOwner = fiber._debugOwner;
  }

  return alt;
};

exports.createHostRootFiber = function () {
  var fiber = createFiber(HostRoot, null);
  return fiber;
};

exports.createFiberFromElement = function (element, priorityLevel) {
  var owner = null;
  if (process.env.NODE_ENV !== 'production') {
    owner = element._owner;
  }

  var fiber = createFiberFromElementType(element.type, element.key, owner);
  fiber.pendingProps = element.props;
  fiber.pendingWorkPriority = priorityLevel;

  if (process.env.NODE_ENV !== 'production') {
    fiber._debugSource = element._source;
    fiber._debugOwner = element._owner;
  }

  return fiber;
};

exports.createFiberFromFragment = function (elements, priorityLevel) {
  // TODO: Consider supporting keyed fragments. Technically, we accidentally
  // support that in the existing React.
  var fiber = createFiber(Fragment, null);
  fiber.pendingProps = elements;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromText = function (content, priorityLevel) {
  var fiber = createFiber(HostText, null);
  fiber.pendingProps = content;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

function createFiberFromElementType(type, key, debugOwner) {
  var fiber = void 0;
  if (typeof type === 'function') {
    fiber = shouldConstruct(type) ? createFiber(ClassComponent, key) : createFiber(IndeterminateComponent, key);
    fiber.type = type;
  } else if (typeof type === 'string') {
    fiber = createFiber(HostComponent, key);
    fiber.type = type;
  } else if (typeof type === 'object' && type !== null && typeof type.tag === 'number') {
    // Currently assumed to be a continuation and therefore is a fiber already.
    // TODO: The yield system is currently broken for updates in some cases.
    // The reified yield stores a fiber, but we don't know which fiber that is;
    // the current or a workInProgress? When the continuation gets rendered here
    // we don't know if we can reuse that fiber or if we need to clone it.
    // There is probably a clever way to restructure this.
    fiber = type;
  } else {
    var info = '';
    if (process.env.NODE_ENV !== 'production') {
      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
        info += ' You likely forgot to export your component from the file ' + "it's defined in.";
      }
      var ownerName = debugOwner ? getComponentName(debugOwner) : null;
      if (ownerName) {
        info += '\n\nCheck the render method of `' + ownerName + '`.';
      }
    }
    !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s', type == null ? type : typeof type, info) : _prodInvariant('130', type == null ? type : typeof type, info) : void 0;
  }
  return fiber;
}

exports.createFiberFromElementType = createFiberFromElementType;

exports.createFiberFromCoroutine = function (coroutine, priorityLevel) {
  var fiber = createFiber(CoroutineComponent, coroutine.key);
  fiber.type = coroutine.handler;
  fiber.pendingProps = coroutine;
  fiber.pendingWorkPriority = priorityLevel;
  return fiber;
};

exports.createFiberFromYield = function (yieldNode, priorityLevel) {
  var fiber = createFiber(YieldComponent, null);
  return fiber;
};

exports.createFiberFromPortal = function (portal, priorityLevel) {
  var fiber = createFiber(HostPortal, portal.key);
  fiber.pendingProps = portal.children || [];
  fiber.pendingWorkPriority = priorityLevel;
  fiber.stateNode = {
    containerInfo: portal.containerInfo,
    implementation: portal.implementation
  };
  return fiber;
};